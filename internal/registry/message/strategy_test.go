package message

import (
	"context"
	"testing"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"

	"go.miloapis.com/support/pkg/apis/support/v1alpha1"
)

type stubTyper struct{}

func (stubTyper) ObjectKinds(_ runtime.Object) ([]schema.GroupVersionKind, bool, error) {
	return nil, false, nil
}
func (stubTyper) Recognizes(_ schema.GroupVersionKind) bool { return false }

func newStrategy() strategy { return NewStrategy(stubTyper{}) }

func validMessage() *v1alpha1.SupportMessage {
	return &v1alpha1.SupportMessage{
		Spec: v1alpha1.SupportMessageSpec{
			TicketRef:  "ticket-001",
			Body:       "Thank you for reaching out.",
			AuthorRef:  v1alpha1.UserReference{Name: "agent-007"},
			AuthorType: "staff",
		},
	}
}

// ── Validate ─────────────────────────────────────────────────────────────────

func TestValidate_Valid(t *testing.T) {
	s := newStrategy()
	errs := s.Validate(context.Background(), validMessage())
	if len(errs) != 0 {
		t.Errorf("expected no errors, got: %v", errs)
	}
}

func TestValidate_MissingRequired(t *testing.T) {
	cases := []struct {
		name   string
		mutate func(*v1alpha1.SupportMessage)
		field  string
	}{
		{
			name:   "empty ticketRef",
			mutate: func(m *v1alpha1.SupportMessage) { m.Spec.TicketRef = "" },
			field:  "spec.ticketRef",
		},
		{
			name:   "empty body",
			mutate: func(m *v1alpha1.SupportMessage) { m.Spec.Body = "" },
			field:  "spec.body",
		},
		{
			name:   "empty authorRef.name",
			mutate: func(m *v1alpha1.SupportMessage) { m.Spec.AuthorRef.Name = "" },
			field:  "spec.authorRef.name",
		},
		{
			name:   "empty authorType",
			mutate: func(m *v1alpha1.SupportMessage) { m.Spec.AuthorType = "" },
			field:  "spec.authorType",
		},
	}

	s := newStrategy()
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			msg := validMessage()
			tc.mutate(msg)
			errs := s.Validate(context.Background(), msg)
			if len(errs) == 0 {
				t.Fatalf("expected validation error for %s", tc.field)
			}
			if errs[0].Field != tc.field {
				t.Errorf("field: got %q, want %q", errs[0].Field, tc.field)
			}
		})
	}
}

func TestValidate_InvalidAuthorType(t *testing.T) {
	s := newStrategy()
	msg := validMessage()
	msg.Spec.AuthorType = "bot"

	errs := s.Validate(context.Background(), msg)
	if len(errs) == 0 {
		t.Fatal("expected validation error for invalid authorType")
	}
	if errs[0].Field != "spec.authorType" {
		t.Errorf("field: got %q, want %q", errs[0].Field, "spec.authorType")
	}
}

func TestValidate_ValidAuthorTypes(t *testing.T) {
	s := newStrategy()
	for _, at := range []string{"staff", "customer"} {
		t.Run(at, func(t *testing.T) {
			msg := validMessage()
			msg.Spec.AuthorType = at
			if errs := s.Validate(context.Background(), msg); len(errs) != 0 {
				t.Errorf("unexpected errors for authorType %q: %v", at, errs)
			}
		})
	}
}

// ── GetAttrs ──────────────────────────────────────────────────────────────────

func TestGetAttrs_FieldSelectors(t *testing.T) {
	msg := &v1alpha1.SupportMessage{
		ObjectMeta: metav1.ObjectMeta{Name: "msg-001"},
		Spec: v1alpha1.SupportMessageSpec{
			TicketRef:  "ticket-001",
			AuthorType: "staff",
			Internal:   true,
		},
	}

	_, fs, err := GetAttrs(msg)
	if err != nil {
		t.Fatalf("GetAttrs error: %v", err)
	}

	cases := map[string]string{
		"spec.ticketRef":  "ticket-001",
		"spec.authorType": "staff",
		"spec.internal":   "true",
	}
	for field, want := range cases {
		if got := fs[field]; got != want {
			t.Errorf("fs[%q]: got %q, want %q", field, got, want)
		}
	}
}

func TestGetAttrs_InternalFalse(t *testing.T) {
	msg := &v1alpha1.SupportMessage{
		ObjectMeta: metav1.ObjectMeta{Name: "msg-002"},
		Spec: v1alpha1.SupportMessageSpec{
			TicketRef:  "ticket-002",
			AuthorType: "customer",
			Internal:   false,
		},
	}

	_, fs, err := GetAttrs(msg)
	if err != nil {
		t.Fatalf("GetAttrs error: %v", err)
	}
	if fs["spec.internal"] != "false" {
		t.Errorf(`fs["spec.internal"]: got %q, want "false"`, fs["spec.internal"])
	}
}

func TestGetAttrs_WrongType(t *testing.T) {
	_, _, err := GetAttrs(&v1alpha1.SupportTicket{})
	if err == nil {
		t.Error("expected error when passing non-SupportMessage object")
	}
}
