package message

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
	msg := obj.(*v1alpha1.SupportMessage)
	var errs field.ErrorList

	if msg.Spec.TicketRef == "" {
		errs = append(errs, field.Required(field.NewPath("spec", "ticketRef"), ""))
	}
	if msg.Spec.Body == "" {
		errs = append(errs, field.Required(field.NewPath("spec", "body"), ""))
	}
	if msg.Spec.AuthorRef.Name == "" {
		errs = append(errs, field.Required(field.NewPath("spec", "authorRef", "name"), ""))
	}

	validTypes := map[string]bool{"staff": true, "customer": true}
	if msg.Spec.AuthorType == "" {
		errs = append(errs, field.Required(field.NewPath("spec", "authorType"), "must be staff or customer"))
	} else if !validTypes[msg.Spec.AuthorType] {
		errs = append(errs, field.Invalid(field.NewPath("spec", "authorType"), msg.Spec.AuthorType,
			"must be one of: staff, customer"))
	}

	return errs
}

func (s strategy) ValidateUpdate(ctx context.Context, obj, _ runtime.Object) field.ErrorList {
	return s.Validate(ctx, obj)
}

func (s strategy) Canonicalize(_ runtime.Object) {}

func (s strategy) AllowCreateOnUpdate() bool      { return false }
func (s strategy) AllowUnconditionalUpdate() bool  { return true }
func (s strategy) WarningsOnCreate(_ context.Context, _ runtime.Object) []string { return nil }
func (s strategy) WarningsOnUpdate(_ context.Context, _, _ runtime.Object) []string { return nil }

// GetAttrs extracts labels and fields for field-selector filtering.
func GetAttrs(obj runtime.Object) (labels.Set, fields.Set, error) {
	msg, ok := obj.(*v1alpha1.SupportMessage)
	if !ok {
		return nil, nil, fmt.Errorf("not a SupportMessage")
	}
	fs := generic.ObjectMetaFieldsSet(&msg.ObjectMeta, false)
	fs["spec.ticketRef"] = msg.Spec.TicketRef
	fs["spec.authorType"] = msg.Spec.AuthorType
	if msg.Spec.Internal {
		fs["spec.internal"] = "true"
	} else {
		fs["spec.internal"] = "false"
	}
	return labels.Set(msg.Labels), fs, nil
}

// MatchMessage returns a selection predicate for field/label selectors.
func MatchMessage(label labels.Selector, field fields.Selector) storage.SelectionPredicate {
	return storage.SelectionPredicate{
		Label:    label,
		Field:    field,
		GetAttrs: GetAttrs,
	}
}
