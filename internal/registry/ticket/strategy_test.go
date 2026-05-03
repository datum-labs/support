package ticket

import (
	"context"
	"testing"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"

	"go.miloapis.com/support/pkg/apis/support/v1alpha1"
)

// stubTyper satisfies runtime.ObjectTyper for strategy construction.
type stubTyper struct{}

func (stubTyper) ObjectKinds(_ runtime.Object) ([]schema.GroupVersionKind, bool, error) {
	return nil, false, nil
}
func (stubTyper) Recognizes(_ schema.GroupVersionKind) bool { return false }

func newStrategy() strategy { return NewStrategy(stubTyper{}) }

func validTicket() *v1alpha1.SupportTicket {
	return &v1alpha1.SupportTicket{
		Spec: v1alpha1.SupportTicketSpec{
			Title:       "Cannot log in",
			Description: "Login page returns 500.",
			ReporterRef: v1alpha1.UserReference{Name: "user-abc"},
		},
	}
}

// ── PrepareForCreate ──────────────────────────────────────────────────────────

func TestPrepareForCreate_Defaults(t *testing.T) {
	s := newStrategy()
	ticket := validTicket()

	s.PrepareForCreate(context.Background(), ticket)

	if ticket.Spec.Status != "open" {
		t.Errorf("status: got %q, want %q", ticket.Spec.Status, "open")
	}
	if ticket.Spec.Priority != "medium" {
		t.Errorf("priority: got %q, want %q", ticket.Spec.Priority, "medium")
	}
	if ticket.Spec.Visibility != "all-staff" {
		t.Errorf("visibility: got %q, want %q", ticket.Spec.Visibility, "all-staff")
	}
	if ticket.Status.Phase != "open" {
		t.Errorf("status.phase: got %q, want %q", ticket.Status.Phase, "open")
	}
}

func TestPrepareForCreate_PreservesTicketUID(t *testing.T) {
	s := newStrategy()
	ticket := validTicket()
	// Simulate the REST layer having pre-populated TicketUID before calling
	// PrepareForCreate via the strategy chain.
	ticket.Status.TicketUID = 42

	s.PrepareForCreate(context.Background(), ticket)

	if ticket.Status.TicketUID != 42 {
		t.Errorf("TicketUID: got %d, want 42 — PrepareForCreate must not zero a pre-assigned TicketUID", ticket.Status.TicketUID)
	}
}

func TestPrepareForCreate_PreservesExplicitValues(t *testing.T) {
	s := newStrategy()
	ticket := validTicket()
	ticket.Spec.Status = "in-progress"
	ticket.Spec.Priority = "urgent"
	ticket.Spec.Visibility = "all-staff"

	s.PrepareForCreate(context.Background(), ticket)

	if ticket.Spec.Status != "in-progress" {
		t.Errorf("status: got %q, want %q", ticket.Spec.Status, "in-progress")
	}
	if ticket.Spec.Priority != "urgent" {
		t.Errorf("priority: got %q, want %q", ticket.Spec.Priority, "urgent")
	}
}

// ── PrepareForUpdate ──────────────────────────────────────────────────────────

func TestPrepareForUpdate_PreservesImmutableFields(t *testing.T) {
	s := newStrategy()

	old := validTicket()
	old.Spec.ReporterRef = v1alpha1.UserReference{Name: "original-reporter"}
	old.Spec.OrganizationRef = &v1alpha1.ObjectReference{Name: "org-xyz"}
	old.Status.MessageCount = 5

	updated := validTicket()
	updated.Spec.ReporterRef = v1alpha1.UserReference{Name: "hacker-attempt"}
	updated.Spec.OrganizationRef = &v1alpha1.ObjectReference{Name: "different-org"}
	updated.Spec.Status = "resolved"

	s.PrepareForUpdate(context.Background(), updated, old)

	if updated.Spec.ReporterRef.Name != "original-reporter" {
		t.Errorf("reporterRef: got %q, want %q", updated.Spec.ReporterRef.Name, "original-reporter")
	}
	if updated.Spec.OrganizationRef == nil || updated.Spec.OrganizationRef.Name != "org-xyz" {
		t.Errorf("organizationRef: got %v, want org-xyz", updated.Spec.OrganizationRef)
	}
	if updated.Status.Phase != "resolved" {
		t.Errorf("status.phase: got %q, want %q", updated.Status.Phase, "resolved")
	}
	if updated.Status.MessageCount != 5 {
		t.Errorf("messageCount: got %d, want 5", updated.Status.MessageCount)
	}
}

func TestPrepareForUpdate_PreservesTicketUID(t *testing.T) {
	s := newStrategy()

	old := validTicket()
	old.Status.TicketUID = 99

	updated := validTicket()
	updated.Spec.Status = "closed"
	updated.Status.TicketUID = 0 // attempt to clear by a client

	s.PrepareForUpdate(context.Background(), updated, old)

	if updated.Status.TicketUID != 99 {
		t.Errorf("TicketUID: got %d, want 99 — PrepareForUpdate must restore TicketUID from old object", updated.Status.TicketUID)
	}
}

func TestPrepareForUpdate_PreservesLastActivityWhenNotSet(t *testing.T) {
	s := newStrategy()

	ts := metav1.Now()
	old := validTicket()
	old.Status.LastActivity = &ts

	updated := validTicket()
	updated.Spec.Status = "closed"
	// updated.Status.LastActivity is nil

	s.PrepareForUpdate(context.Background(), updated, old)

	if updated.Status.LastActivity == nil {
		t.Error("lastActivity should be carried over from old when not set on update")
	}
}

// ── Validate ─────────────────────────────────────────────────────────────────

func TestValidate_Valid(t *testing.T) {
	s := newStrategy()
	errs := s.Validate(context.Background(), validTicket())
	if len(errs) != 0 {
		t.Errorf("expected no errors, got: %v", errs)
	}
}

func TestValidate_MissingRequired(t *testing.T) {
	cases := []struct {
		name   string
		mutate func(*v1alpha1.SupportTicket)
		field  string
	}{
		{
			name:   "empty title",
			mutate: func(t *v1alpha1.SupportTicket) { t.Spec.Title = "" },
			field:  "spec.title",
		},
		{
			name:   "empty description",
			mutate: func(t *v1alpha1.SupportTicket) { t.Spec.Description = "" },
			field:  "spec.description",
		},
		{
			name:   "empty reporterRef.name",
			mutate: func(t *v1alpha1.SupportTicket) { t.Spec.ReporterRef.Name = "" },
			field:  "spec.reporterRef.name",
		},
	}

	s := newStrategy()
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			ticket := validTicket()
			tc.mutate(ticket)
			errs := s.Validate(context.Background(), ticket)
			if len(errs) == 0 {
				t.Fatalf("expected validation error for %s", tc.field)
			}
			got := errs[0].Field
			if got != tc.field {
				t.Errorf("field: got %q, want %q", got, tc.field)
			}
		})
	}
}

func TestValidate_InvalidStatus(t *testing.T) {
	s := newStrategy()
	ticket := validTicket()
	ticket.Spec.Status = "bogus-status"

	errs := s.Validate(context.Background(), ticket)
	if len(errs) == 0 {
		t.Fatal("expected validation error for invalid status")
	}
	if errs[0].Field != "spec.status" {
		t.Errorf("field: got %q, want %q", errs[0].Field, "spec.status")
	}
}

func TestValidate_InvalidPriority(t *testing.T) {
	s := newStrategy()
	ticket := validTicket()
	ticket.Spec.Priority = "extreme"

	errs := s.Validate(context.Background(), ticket)
	if len(errs) == 0 {
		t.Fatal("expected validation error for invalid priority")
	}
	if errs[0].Field != "spec.priority" {
		t.Errorf("field: got %q, want %q", errs[0].Field, "spec.priority")
	}
}

func TestValidate_AllValidStatuses(t *testing.T) {
	s := newStrategy()
	statuses := []string{"open", "in-progress", "waiting-on-customer", "resolved", "closed"}
	for _, st := range statuses {
		t.Run(st, func(t *testing.T) {
			ticket := validTicket()
			ticket.Spec.Status = st
			if errs := s.Validate(context.Background(), ticket); len(errs) != 0 {
				t.Errorf("unexpected errors for status %q: %v", st, errs)
			}
		})
	}
}

func TestValidate_AllValidPriorities(t *testing.T) {
	s := newStrategy()
	priorities := []string{"low", "medium", "high", "urgent"}
	for _, p := range priorities {
		t.Run(p, func(t *testing.T) {
			ticket := validTicket()
			ticket.Spec.Priority = p
			if errs := s.Validate(context.Background(), ticket); len(errs) != 0 {
				t.Errorf("unexpected errors for priority %q: %v", p, errs)
			}
		})
	}
}

// ── GetAttrs ──────────────────────────────────────────────────────────────────

func TestGetAttrs_FieldSelectors(t *testing.T) {
	ticket := &v1alpha1.SupportTicket{
		ObjectMeta: metav1.ObjectMeta{Name: "ticket-001"},
		Spec: v1alpha1.SupportTicketSpec{
			Status:          "in-progress",
			Priority:        "high",
			OrganizationRef: &v1alpha1.ObjectReference{Name: "org-abc"},
			OwnerRef:        &v1alpha1.UserReference{Name: "agent-007"},
			ReporterRef:     v1alpha1.UserReference{Name: "user-xyz"},
		},
		Status: v1alpha1.SupportTicketStatus{Phase: "in-progress"},
	}

	_, fs, err := GetAttrs(ticket)
	if err != nil {
		t.Fatalf("GetAttrs error: %v", err)
	}

	cases := map[string]string{
		"spec.status":              "in-progress",
		"spec.priority":            "high",
		"spec.organizationRef.name": "org-abc",
		"spec.ownerRef.name":       "agent-007",
		"status.phase":             "in-progress",
	}
	for field, want := range cases {
		if got := fs[field]; got != want {
			t.Errorf("fs[%q]: got %q, want %q", field, got, want)
		}
	}
}

func TestGetAttrs_WrongType(t *testing.T) {
	_, _, err := GetAttrs(&v1alpha1.SupportMessage{})
	if err == nil {
		t.Error("expected error when passing non-SupportTicket object")
	}
}

func TestGetAttrs_NilOptionalRefs(t *testing.T) {
	ticket := &v1alpha1.SupportTicket{
		ObjectMeta: metav1.ObjectMeta{Name: "ticket-002"},
		Spec: v1alpha1.SupportTicketSpec{
			Status:      "open",
			ReporterRef: v1alpha1.UserReference{Name: "user-xyz"},
		},
	}

	_, fs, err := GetAttrs(ticket)
	if err != nil {
		t.Fatalf("GetAttrs error: %v", err)
	}
	if _, ok := fs["spec.organizationRef.name"]; ok {
		t.Error("spec.organizationRef.name should not be set when OrganizationRef is nil")
	}
	if _, ok := fs["spec.ownerRef.name"]; ok {
		t.Error("spec.ownerRef.name should not be set when OwnerRef is nil")
	}
}
