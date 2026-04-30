package ticket

import (
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apiserver/pkg/registry/generic"
	genericregistry "k8s.io/apiserver/pkg/registry/generic/registry"

	"go.miloapis.com/support/pkg/apis/support/v1alpha1"
)

// REST implements etcd-backed storage for SupportTicket.
type REST struct {
	*genericregistry.Store
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
		TableConvertor:            nil,
	}

	options := &generic.StoreOptions{
		RESTOptions: optsGetter,
		AttrFunc:    GetAttrs,
	}
	if err := store.CompleteWithOptions(options); err != nil {
		return nil, err
	}

	return &REST{store}, nil
}
