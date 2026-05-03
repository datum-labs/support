package ticket

import (
	"context"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apiserver/pkg/registry/generic"
	genericregistry "k8s.io/apiserver/pkg/registry/generic/registry"
	"k8s.io/apiserver/pkg/registry/rest"

	"go.miloapis.com/support/internal/counter"
	"go.miloapis.com/support/pkg/apis/support/v1alpha1"
)

// REST implements etcd-backed storage for SupportTicket.
type REST struct {
	*genericregistry.Store
	counter *counter.TicketCounter
}

// NewREST creates a REST storage backend for SupportTicket.
func NewREST(scheme *runtime.Scheme, optsGetter generic.RESTOptionsGetter) (*REST, error) {
	strategy := NewStrategy(scheme)

	store := &genericregistry.Store{
		NewFunc:                   func() runtime.Object { return &v1alpha1.SupportTicket{} },
		NewListFunc:               func() runtime.Object { return &v1alpha1.SupportTicketList{} },
		PredicateFunc:             MatchTicket,
		DefaultQualifiedResource:  v1alpha1.Resource("supporttickets"),
		SingularQualifiedResource: v1alpha1.Resource("supportticket"),
		CreateStrategy:            strategy,
		UpdateStrategy:            strategy,
		DeleteStrategy:            strategy,
		TableConvertor:            rest.NewDefaultTableConvertor(v1alpha1.Resource("supporttickets")),
	}

	options := &generic.StoreOptions{
		RESTOptions: optsGetter,
		AttrFunc:    GetAttrs,
	}
	if err := store.CompleteWithOptions(options); err != nil {
		return nil, err
	}

	ctr, err := counter.New(optsGetter)
	if err != nil {
		return nil, err
	}

	return &REST{Store: store, counter: ctr}, nil
}

// Create overrides the embedded store's Create to assign a TicketUID before
// the object is persisted. The UID is fetched via an atomic counter increment
// and written into Status.TicketUID. Because PrepareForCreate runs before this
// point (inside the strategy), the status has already been initialised with
// defaults; we overwrite only the TicketUID field here.
func (r *REST) Create(ctx context.Context, obj runtime.Object, createValidation rest.ValidateObjectFunc, options *metav1.CreateOptions) (runtime.Object, error) {
	ticket, ok := obj.(*v1alpha1.SupportTicket)
	if !ok {
		// Unexpected type — delegate to the embedded store and let it handle
		// the error.
		return r.Store.Create(ctx, obj, createValidation, options)
	}

	uid, err := r.counter.Next(ctx)
	if err != nil {
		return nil, err
	}
	ticket.Status.TicketUID = uid

	return r.Store.Create(ctx, ticket, createValidation, options)
}
