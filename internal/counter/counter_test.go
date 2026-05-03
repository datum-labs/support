package counter

import (
	"bytes"
	"context"
	"encoding/json"
	"sync"
	"testing"

	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/apimachinery/pkg/watch"
	"k8s.io/apiserver/pkg/storage"
)

// ── counterObject ─────────────────────────────────────────────────────────────

func TestCounterObject_DeepCopy(t *testing.T) {
	orig := &counterObject{counterValue{Next: 7}}
	cp := orig.DeepCopyObject().(*counterObject)

	if cp.Next != 7 {
		t.Fatalf("deep copy: got %d, want 7", cp.Next)
	}
	// Mutations must not alias.
	cp.Next = 99
	if orig.Next != 7 {
		t.Fatalf("deep copy aliased: orig.Next changed to %d", orig.Next)
	}
}

func TestCounterObject_GetObjectKind(t *testing.T) {
	c := &counterObject{}
	if c.GetObjectKind() != schema.EmptyObjectKind {
		t.Fatal("GetObjectKind should return schema.EmptyObjectKind")
	}
}

// ── counterCodec ──────────────────────────────────────────────────────────────

func TestCounterCodec_RoundTrip(t *testing.T) {
	codec := counterCodec{}

	orig := &counterObject{counterValue{Next: 42}}

	// Encode.
	var buf bytes.Buffer
	if err := codec.Encode(orig, &buf); err != nil {
		t.Fatalf("Encode: %v", err)
	}

	// Verify the wire format is plain JSON.
	var cv counterValue
	if err := json.Unmarshal(buf.Bytes(), &cv); err != nil {
		t.Fatalf("wire format is not valid JSON: %v", err)
	}
	if cv.Next != 42 {
		t.Fatalf("wire: got %d, want 42", cv.Next)
	}

	// Decode into fresh counterObject.
	decoded, _, err := codec.Decode(buf.Bytes(), nil, &counterObject{})
	if err != nil {
		t.Fatalf("Decode: %v", err)
	}
	co, ok := decoded.(*counterObject)
	if !ok {
		t.Fatalf("Decode returned %T, want *counterObject", decoded)
	}
	if co.Next != 42 {
		t.Fatalf("decoded: got %d, want 42", co.Next)
	}
}

func TestCounterCodec_DecodeIntoNilInto(t *testing.T) {
	codec := counterCodec{}
	data := []byte(`{"next":7}`)

	decoded, _, err := codec.Decode(data, nil, nil)
	if err != nil {
		t.Fatalf("Decode: %v", err)
	}
	co, ok := decoded.(*counterObject)
	if !ok {
		t.Fatalf("got %T, want *counterObject", decoded)
	}
	if co.Next != 7 {
		t.Fatalf("got %d, want 7", co.Next)
	}
}

func TestCounterCodec_EncodeBadType(t *testing.T) {
	codec := counterCodec{}
	var buf bytes.Buffer
	// Pass something that is NOT a *counterObject.
	err := codec.Encode(&badObject{}, &buf)
	if err == nil {
		t.Fatal("expected error encoding unsupported type, got nil")
	}
}

func TestCounterCodec_Identifier(t *testing.T) {
	id := counterCodec{}.Identifier()
	if id == "" {
		t.Fatal("Identifier must be non-empty")
	}
}

// ── compile-time interface checks ─────────────────────────────────────────────

var (
	_ runtime.Object = (*counterObject)(nil)
	_ runtime.Codec  = counterCodec{}
)

// badObject is a minimal runtime.Object used to exercise codec error paths.
type badObject struct{}

func (*badObject) GetObjectKind() schema.ObjectKind { return schema.EmptyObjectKind }
func (*badObject) DeepCopyObject() runtime.Object   { return &badObject{} }

// ── Concurrent correctness ────────────────────────────────────────────────────

// TestTicketCounter_ConcurrentNext verifies that 1000 concurrent calls to
// Next() each receive a distinct value and together cover exactly {1 … 1000}.
func TestTicketCounter_ConcurrentNext(t *testing.T) {
	const n = 1000

	ctr := newForTest(&atomicFakeStore{})
	ctx := context.Background()

	results := make([]int64, n)
	var wg sync.WaitGroup
	wg.Add(n)
	for i := range n {
		go func() {
			defer wg.Done()
			uid, err := ctr.Next(ctx)
			if err != nil {
				t.Errorf("Next: %v", err)
				return
			}
			results[i] = uid
		}()
	}
	wg.Wait()

	seen := make(map[int64]int, n)
	for _, v := range results {
		seen[v]++
	}
	for want := int64(1); want <= n; want++ {
		if seen[want] != 1 {
			t.Errorf("ticketUID %d appeared %d times (want exactly 1)", want, seen[want])
		}
	}
}

// atomicFakeStore is a minimal storage.Interface that serialises
// GuaranteedUpdate with a mutex, faithfully modelling etcd's CAS atomicity
// without requiring a running etcd server. All other methods panic.
type atomicFakeStore struct {
	mu  sync.Mutex
	val int64
}

func (s *atomicFakeStore) GuaranteedUpdate(
	_ context.Context,
	_ string,
	_ runtime.Object,
	_ bool,
	_ *storage.Preconditions,
	tryUpdate storage.UpdateFunc,
	_ runtime.Object,
) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	existing := &counterObject{counterValue{Next: s.val}}
	updated, _, err := tryUpdate(existing, storage.ResponseMeta{})
	if err != nil {
		return err
	}
	s.val = updated.(*counterObject).Next
	return nil
}

func (*atomicFakeStore) Versioner() storage.Versioner { panic("not implemented") }
func (*atomicFakeStore) Create(_ context.Context, _ string, _, _ runtime.Object, _ uint64) error {
	panic("not implemented")
}
func (*atomicFakeStore) Delete(_ context.Context, _ string, _ runtime.Object, _ *storage.Preconditions, _ storage.ValidateObjectFunc, _ runtime.Object, _ storage.DeleteOptions) error {
	panic("not implemented")
}
func (*atomicFakeStore) Watch(_ context.Context, _ string, _ storage.ListOptions) (watch.Interface, error) {
	panic("not implemented")
}
func (*atomicFakeStore) Get(_ context.Context, _ string, _ storage.GetOptions, _ runtime.Object) error {
	panic("not implemented")
}
func (*atomicFakeStore) GetList(_ context.Context, _ string, _ storage.ListOptions, _ runtime.Object) error {
	panic("not implemented")
}
func (*atomicFakeStore) Stats(_ context.Context) (storage.Stats, error) { panic("not implemented") }
func (*atomicFakeStore) ReadinessCheck() error                           { panic("not implemented") }
func (*atomicFakeStore) RequestWatchProgress(_ context.Context) error    { panic("not implemented") }
func (*atomicFakeStore) GetCurrentResourceVersion(_ context.Context) (uint64, error) {
	panic("not implemented")
}
func (*atomicFakeStore) SetKeysFunc(_ storage.KeysFunc)  { panic("not implemented") }
func (*atomicFakeStore) CompactRevision() int64          { panic("not implemented") }
