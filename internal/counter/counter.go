// Package counter provides an etcd-backed atomic counter for assigning
// monotonically increasing identifiers across all SupportTickets in the Milo
// system.
//
// The counter is stored at a dedicated etcd key and incremented atomically
// using a compare-and-swap (GuaranteedUpdate) transaction, guaranteeing that
// every ticket receives a unique, strictly increasing TicketUID even under
// concurrent creation requests across multiple API server replicas.
package counter

import (
	"context"
	"encoding/json"
	"fmt"
	"io"

	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/apiserver/pkg/registry/generic"
	"k8s.io/apiserver/pkg/storage"
	"k8s.io/apiserver/pkg/storage/storagebackend/factory"
)

// etcdKey is the resource prefix passed to factory.Create. The etcd key used
// for GuaranteedUpdate is relative to the registry prefix configured in the
// StorageConfig, so it will be stored at:
//   <registry-prefix>/counters/ticketuid
const etcdKey = "counters/ticketuid"

// counterValue is the JSON-serialised state persisted in etcd.
type counterValue struct {
	// Next is the value that will be assigned to the next ticket.
	Next int64 `json:"next"`
}

// counterObject wraps counterValue so it satisfies runtime.Object, which is
// required by storage.Interface.GuaranteedUpdate.
type counterObject struct {
	counterValue
}

func (*counterObject) GetObjectKind() schema.ObjectKind { return schema.EmptyObjectKind }
func (c *counterObject) DeepCopyObject() runtime.Object {
	cp := *c
	return &cp
}

// counterCodec encodes and decodes counterObject as plain JSON, satisfying the
// runtime.Codec contract required by storagebackend.Config.
type counterCodec struct{}

func (counterCodec) Encode(obj runtime.Object, w io.Writer) error {
	co, ok := obj.(*counterObject)
	if !ok {
		return fmt.Errorf("counter: Encode expected *counterObject, got %T", obj)
	}
	return json.NewEncoder(w).Encode(&co.counterValue)
}

func (counterCodec) Decode(data []byte, _ *schema.GroupVersionKind, into runtime.Object) (runtime.Object, *schema.GroupVersionKind, error) {
	var cv counterValue
	if err := json.Unmarshal(data, &cv); err != nil {
		return nil, nil, fmt.Errorf("counter: decode: %w", err)
	}
	if co, ok := into.(*counterObject); ok {
		co.counterValue = cv
		return co, nil, nil
	}
	return &counterObject{cv}, nil, nil
}

func (counterCodec) Identifier() runtime.Identifier { return "counterCodec/json" }

// TicketCounter atomically reserves the next TicketUID using the same etcd
// cluster that backs the SupportTicket resources.
type TicketCounter struct {
	store   storage.Interface
	destroy factory.DestroyFunc
}

// newForTest builds a TicketCounter that delegates to the supplied store
// directly, skipping the etcd bootstrap in New. Only for use in unit tests.
func newForTest(store storage.Interface) *TicketCounter {
	return &TicketCounter{store: store}
}

// New builds a TicketCounter by reusing the transport configuration from the
// ticket registry's RESTOptionsGetter, then creating a raw (uncached) etcd
// storage.Interface for the counter key only.
func New(optsGetter generic.RESTOptionsGetter) (*TicketCounter, error) {
	opts, err := optsGetter.GetRESTOptions(
		schema.GroupResource{Group: "support.miloapis.com", Resource: "ticketcounters"},
		nil,
	)
	if err != nil {
		return nil, fmt.Errorf("counter: failed to get storage options: %w", err)
	}

	// Build a config identical to the ticket registry's except we replace the
	// Codec with our own lightweight JSON codec so the etcd layer can
	// encode/decode counterObject without needing the full Kubernetes scheme.
	cfg := *opts.StorageConfig // shallow copy of ConfigForResource
	cfg.Config.Codec = counterCodec{}
	cfg.Config.EncodeVersioner = nil
	cfg.GroupResource = schema.GroupResource{
		Group:    "support.miloapis.com",
		Resource: "ticketcounters",
	}

	newFunc := func() runtime.Object { return &counterObject{} }
	newListFunc := func() runtime.Object { return &counterObject{} }

	store, destroy, err := factory.Create(cfg, newFunc, newListFunc, etcdKey)
	if err != nil {
		return nil, fmt.Errorf("counter: failed to create storage backend: %w", err)
	}

	return &TicketCounter{store: store, destroy: destroy}, nil
}

// Destroy releases the storage resources held by the counter.
func (c *TicketCounter) Destroy() {
	if c.destroy != nil {
		c.destroy()
	}
}

// Next atomically increments the counter and returns the newly assigned
// TicketUID. The first call returns 1.
func (c *TicketCounter) Next(ctx context.Context) (int64, error) {
	var assigned int64

	err := c.store.GuaranteedUpdate(
		ctx,
		etcdKey,
		&counterObject{},
		true, // createIfNotFound — initialises counter at zero on first call
		nil,  // no preconditions
		func(existing runtime.Object, _ storage.ResponseMeta) (runtime.Object, *uint64, error) {
			cur, ok := existing.(*counterObject)
			if !ok {
				return nil, nil, fmt.Errorf("counter: unexpected stored type %T", existing)
			}
			next := cur.Next + 1
			assigned = next
			return &counterObject{counterValue{Next: next}}, nil, nil
		},
		nil, // no cached existing object
	)
	if err != nil {
		return 0, fmt.Errorf("counter: failed to increment ticket UID counter: %w", err)
	}
	return assigned, nil
}

// Compile-time interface conformance checks.
var (
	_ runtime.Object = (*counterObject)(nil)
	_ runtime.Codec  = counterCodec{}
)
