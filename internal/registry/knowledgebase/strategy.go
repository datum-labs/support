package knowledgebase

import (
	"context"
	"fmt"

	"k8s.io/apimachinery/pkg/fields"
	"k8s.io/apimachinery/pkg/labels"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/util/validation/field"
	"k8s.io/apiserver/pkg/registry/generic"
	"k8s.io/apiserver/pkg/storage"
	"k8s.io/apiserver/pkg/storage/names"

	"go.miloapis.com/support/pkg/apis/support/v1alpha1"
)

type strategy struct {
	runtime.ObjectTyper
	names.NameGenerator
}

func NewStrategy(typer runtime.ObjectTyper) strategy {
	return strategy{typer, names.SimpleNameGenerator}
}

func (s strategy) NamespaceScoped() bool { return false }

func (s strategy) PrepareForCreate(_ context.Context, _ runtime.Object) {}

func (s strategy) PrepareForUpdate(_ context.Context, _, _ runtime.Object) {}

func (s strategy) Validate(_ context.Context, obj runtime.Object) field.ErrorList {
	entry := obj.(*v1alpha1.KnowledgeBaseEntry)
	var errs field.ErrorList

	if entry.Spec.Title == "" {
		errs = append(errs, field.Required(field.NewPath("spec", "title"), ""))
	}
	if entry.Spec.Body == "" {
		errs = append(errs, field.Required(field.NewPath("spec", "body"), ""))
	}
	if entry.Spec.AuthorRef.Name == "" {
		errs = append(errs, field.Required(field.NewPath("spec", "authorRef", "name"), ""))
	}

	return errs
}

func (s strategy) ValidateUpdate(ctx context.Context, obj, _ runtime.Object) field.ErrorList {
	return s.Validate(ctx, obj)
}

func (s strategy) Canonicalize(_ runtime.Object) {}

func (s strategy) AllowCreateOnUpdate() bool                                           { return false }
func (s strategy) AllowUnconditionalUpdate() bool                                      { return true }
func (s strategy) WarningsOnCreate(_ context.Context, _ runtime.Object) []string       { return nil }
func (s strategy) WarningsOnUpdate(_ context.Context, _, _ runtime.Object) []string    { return nil }

// GetAttrs extracts labels and fields for field-selector filtering.
func GetAttrs(obj runtime.Object) (labels.Set, fields.Set, error) {
	entry, ok := obj.(*v1alpha1.KnowledgeBaseEntry)
	if !ok {
		return nil, nil, fmt.Errorf("not a KnowledgeBaseEntry")
	}
	fs := generic.ObjectMetaFieldsSet(&entry.ObjectMeta, false)
	fs["spec.topic"] = entry.Spec.Topic
	return labels.Set(entry.Labels), fs, nil
}

// MatchKnowledgeBaseEntry returns a selection predicate for field/label selectors.
func MatchKnowledgeBaseEntry(label labels.Selector, field fields.Selector) storage.SelectionPredicate {
	return storage.SelectionPredicate{
		Label:    label,
		Field:    field,
		GetAttrs: GetAttrs,
	}
}
