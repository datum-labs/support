package knowledgebase

import (
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apiserver/pkg/registry/generic"
	genericregistry "k8s.io/apiserver/pkg/registry/generic/registry"
	"k8s.io/apiserver/pkg/registry/rest"

	"go.miloapis.com/support/pkg/apis/support/v1alpha1"
)

// REST implements etcd-backed storage for KnowledgeBaseEntry.
type REST struct {
	*genericregistry.Store
}

// NewREST creates a REST storage backend for KnowledgeBaseEntry.
func NewREST(scheme *runtime.Scheme, optsGetter generic.RESTOptionsGetter) (*REST, error) {
	strategy := NewStrategy(scheme)

	store := &genericregistry.Store{
		NewFunc:                   func() runtime.Object { return &v1alpha1.KnowledgeBaseEntry{} },
		NewListFunc:               func() runtime.Object { return &v1alpha1.KnowledgeBaseEntryList{} },
		PredicateFunc:             MatchKnowledgeBaseEntry,
		DefaultQualifiedResource:  v1alpha1.Resource("knowledgebaseentries"),
		SingularQualifiedResource: v1alpha1.Resource("knowledgebaseentry"),
		CreateStrategy:            strategy,
		UpdateStrategy:            strategy,
		DeleteStrategy:            strategy,
		TableConvertor:            rest.NewDefaultTableConvertor(v1alpha1.Resource("knowledgebaseentries")),
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
