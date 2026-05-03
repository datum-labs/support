package v1alpha1

import metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

// +genclient
// +genclient:nonNamespaced
// +k8s:deepcopy-gen:interfaces=k8s.io/apimachinery/pkg/runtime.Object

// SupportTicket represents a customer support request.
type SupportTicket struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   SupportTicketSpec   `json:"spec"`
	Status SupportTicketStatus `json:"status,omitempty"`
}

// TicketParticipant represents a user added to a ticket thread beyond the original reporter.
type TicketParticipant struct {
	// UserRef identifies the participant.
	UserRef UserReference `json:"userRef"`
	// AddedAt is when the participant was added to the thread.
	// +optional
	AddedAt *metav1.Time `json:"addedAt,omitempty"`
}

// SupportTicketSpec defines the desired state of a SupportTicket.
type SupportTicketSpec struct {
	// Title is the subject line of the support ticket.
	// +required
	Title string `json:"title"`

	// Description is the initial message body of the ticket.
	// +required
	Description string `json:"description"`

	// Status is the current state of the ticket.
	// Valid values: open, in-progress, waiting-on-customer, resolved, closed.
	// +optional
	Status string `json:"status,omitempty"`

	// Priority indicates the urgency of the ticket.
	// Valid values: low, medium, high, urgent.
	// +optional
	Priority string `json:"priority,omitempty"`

	// OwnerRef identifies the staff member assigned to own this ticket.
	// +optional
	OwnerRef *UserReference `json:"ownerRef,omitempty"`

	// Contributors lists additional staff members working on the ticket.
	// +optional
	Contributors []UserReference `json:"contributors,omitempty"`

	// Participants lists users added to this ticket thread beyond the original reporter.
	// +optional
	Participants []TicketParticipant `json:"participants,omitempty"`

	// Tags are labels attached to the ticket for categorization.
	// +optional
	Tags []string `json:"tags,omitempty"`

	// Visibility controls which operators can view this ticket.
	// Valid values: all-staff.
	// +optional
	Visibility string `json:"visibility,omitempty"`

	// OrganizationRef identifies the organization this ticket belongs to.
	// +optional
	OrganizationRef *ObjectReference `json:"organizationRef,omitempty"`

	// ReporterRef identifies the user who filed this ticket.
	// +required
	ReporterRef UserReference `json:"reporterRef"`
}

// SupportTicketStatus describes the observed state of a SupportTicket.
type SupportTicketStatus struct {
	// Phase mirrors Spec.Status for field-selector queryability.
	// +optional
	Phase string `json:"phase,omitempty"`

	// TicketUID is a monotonically increasing integer assigned by the server at
	// creation time. It is unique across all SupportTickets in the entire Milo
	// system and never reused. Consumers may use it as a compact, human-friendly
	// reference number (e.g. "#42"). The value is immutable once set.
	// +optional
	TicketUID int64 `json:"ticketUid,omitempty"`

	// MessageCount is the number of messages on this ticket.
	// +optional
	MessageCount int32 `json:"messageCount,omitempty"`

	// LastActivity is the timestamp of the most recent message or update.
	// +optional
	LastActivity *metav1.Time `json:"lastActivity,omitempty"`

	// ReadState maps principal names to the time they last read the ticket.
	// Used to compute unread indicators and notification badges.
	// +optional
	ReadState map[string]metav1.Time `json:"readState,omitempty"`

	// Conditions represents the latest available observations of the ticket.
	// +optional
	Conditions []metav1.Condition `json:"conditions,omitempty"`
}

// UserReference identifies a user (staff or customer).
type UserReference struct {
	// Name is the unique identifier of the user.
	Name string `json:"name"`
	// DisplayName is the human-readable name of the user.
	// +optional
	DisplayName string `json:"displayName,omitempty"`
	// Email is the email address of the user.
	// +optional
	Email string `json:"email,omitempty"`
}

// ObjectReference identifies a related Kubernetes-style object.
type ObjectReference struct {
	// Kind is the type of the referenced object.
	Kind string `json:"kind"`
	// Name is the name of the referenced object.
	Name string `json:"name"`
}

// +k8s:deepcopy-gen:interfaces=k8s.io/apimachinery/pkg/runtime.Object

// SupportTicketList contains a list of SupportTicket objects.
type SupportTicketList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`

	Items []SupportTicket `json:"items"`
}
