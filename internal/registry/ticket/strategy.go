package ticket

import (
	"context"
	"fmt"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
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

func (s strategy) PrepareForCreate(_ context.Context, obj runtime.Object) {
	ticket := obj.(*v1alpha1.SupportTicket)
	if ticket.Spec.Status == "" {
		ticket.Spec.Status = "open"
	}
	if ticket.Spec.Priority == "" {
		ticket.Spec.Priority = "medium"
	}
	if ticket.Spec.Visibility == "" {
		ticket.Spec.Visibility = "all-staff"
	}
	// Preserve TicketUID if it has already been assigned by the REST layer
	// before reaching this point in the admission chain.
	uid := ticket.Status.TicketUID
	ticket.Status = v1alpha1.SupportTicketStatus{
		Phase:     ticket.Spec.Status,
		TicketUID: uid,
	}
}

func (s strategy) PrepareForUpdate(_ context.Context, obj, old runtime.Object) {
	newTicket := obj.(*v1alpha1.SupportTicket)
	oldTicket := old.(*v1alpha1.SupportTicket)

	newTicket.Spec.ReporterRef = oldTicket.Spec.ReporterRef
	newTicket.Spec.OrganizationRef = oldTicket.Spec.OrganizationRef

	// TicketUID is immutable once assigned; always carry the old value forward.
	newTicket.Status.TicketUID = oldTicket.Status.TicketUID

	newTicket.Status.Phase = newTicket.Spec.Status
	newTicket.Status.MessageCount = oldTicket.Status.MessageCount
	if newTicket.Status.LastActivity == nil {
		newTicket.Status.LastActivity = oldTicket.Status.LastActivity
	}

	// Merge ReadState: a PATCH from one user should not wipe other users' read cursors.
	if len(newTicket.Status.ReadState) > 0 {
		merged := make(map[string]metav1.Time, len(oldTicket.Status.ReadState)+len(newTicket.Status.ReadState))
		for k, v := range oldTicket.Status.ReadState {
			merged[k] = v
		}
		for k, v := range newTicket.Status.ReadState {
			merged[k] = v
		}
		newTicket.Status.ReadState = merged
	} else {
		newTicket.Status.ReadState = oldTicket.Status.ReadState
	}
}

func (s strategy) Validate(_ context.Context, obj runtime.Object) field.ErrorList {
	ticket := obj.(*v1alpha1.SupportTicket)
	var errs field.ErrorList

	if ticket.Spec.Title == "" {
		errs = append(errs, field.Required(field.NewPath("spec", "title"), ""))
	}
	if ticket.Spec.Description == "" {
		errs = append(errs, field.Required(field.NewPath("spec", "description"), ""))
	}
	if ticket.Spec.ReporterRef.Name == "" {
		errs = append(errs, field.Required(field.NewPath("spec", "reporterRef", "name"), ""))
	}

	validStatuses := map[string]bool{
		"open": true, "in-progress": true, "waiting-on-customer": true,
		"resolved": true, "closed": true,
	}
	if ticket.Spec.Status != "" && !validStatuses[ticket.Spec.Status] {
		errs = append(errs, field.Invalid(field.NewPath("spec", "status"), ticket.Spec.Status,
			"must be one of: open, in-progress, waiting-on-customer, resolved, closed"))
	}

	validPriorities := map[string]bool{"low": true, "medium": true, "high": true, "urgent": true}
	if ticket.Spec.Priority != "" && !validPriorities[ticket.Spec.Priority] {
		errs = append(errs, field.Invalid(field.NewPath("spec", "priority"), ticket.Spec.Priority,
			"must be one of: low, medium, high, urgent"))
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
	ticket, ok := obj.(*v1alpha1.SupportTicket)
	if !ok {
		return nil, nil, fmt.Errorf("not a SupportTicket")
	}
	fs := generic.ObjectMetaFieldsSet(&ticket.ObjectMeta, false)
	fs["spec.status"] = ticket.Spec.Status
	fs["spec.priority"] = ticket.Spec.Priority
	fs["status.phase"] = ticket.Status.Phase
	if ticket.Spec.OrganizationRef != nil {
		fs["spec.organizationRef.name"] = ticket.Spec.OrganizationRef.Name
	}
	if ticket.Spec.OwnerRef != nil {
		fs["spec.ownerRef.name"] = ticket.Spec.OwnerRef.Name
	}
	return labels.Set(ticket.Labels), fs, nil
}

// MatchTicket returns a selection predicate for field/label selectors.
func MatchTicket(label labels.Selector, field fields.Selector) storage.SelectionPredicate {
	return storage.SelectionPredicate{
		Label:    label,
		Field:    field,
		GetAttrs: GetAttrs,
	}
}
