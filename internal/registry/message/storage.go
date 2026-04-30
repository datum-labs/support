package message

import (
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apiserver/pkg/registry/generic"
	genericregistry "k8s.io/apiserver/pkg/registry/generic/registry"

	"go.miloapis.com/support/pkg/apis/support/v1alpha1"
)

// REST implements etcd-backed storage for SupportMessage.
type REST struct {
	*genericregistry.Store
}

// NewREST creates a REST storage backend for SupportMessage.
func NewREST(scheme *runtime.Scheme, optsGetter generic.RESTOptionsGetter) (*REST, error) {
	strategy := NewStrategy(scheme)

	store := &genericregistry.Store{
		NewFunc:                   func() runtime.Object { return &v1alpha1.SupportMessage{} },
		NewListFunc:               func() runtime.Object { return &v1alpha1.SupportMessageList{} },
		PredicateFunc:             MatchMessage,
		DefaultQualifiedResource:  v1alpha1.Resource("supportmessages"),
		SingularQualifiedResource: v1alpha1.Resource("supportmessage"),
		CreateStrategy:            strategy,
		UpdateStrategy:            strategy,
		DeleteStrategy:            strategy,
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
