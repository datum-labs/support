package v1alpha1

import metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

// +genclient
// +genclient:nonNamespaced
// +k8s:deepcopy-gen:interfaces=k8s.io/apimachinery/pkg/runtime.Object

// SupportMessage is a message within a SupportTicket conversation thread.
type SupportMessage struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   SupportMessageSpec   `json:"spec"`
	Status SupportMessageStatus `json:"status,omitempty"`
}

// SupportMessageSpec defines the content and metadata of a message.
type SupportMessageSpec struct {
	// TicketRef is the name of the parent SupportTicket.
	// +required
	TicketRef string `json:"ticketRef"`

	// Body is the message content in Markdown format.
	// +required
	Body string `json:"body"`

	// AuthorRef identifies the user who wrote this message.
	// +required
	AuthorRef UserReference `json:"authorRef"`

	// AuthorType indicates whether the author is staff or a customer.
	// Valid values: staff, customer.
	// +required
	AuthorType string `json:"authorType"`

	// Internal marks the message as a staff-only note not visible to customers.
	// +optional
	Internal bool `json:"internal,omitempty"`
}

// SupportMessageStatus describes the observed state of a SupportMessage.
type SupportMessageStatus struct {
	// CreatedAt is the time the message was created.
	// +optional
	CreatedAt *metav1.Time `json:"createdAt,omitempty"`

	// UpdatedAt is the time the message was last modified.
	// +optional
	UpdatedAt *metav1.Time `json:"updatedAt,omitempty"`
}

// +k8s:deepcopy-gen:interfaces=k8s.io/apimachinery/pkg/runtime.Object

// SupportMessageList contains a list of SupportMessage objects.
type SupportMessageList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`

	Items []SupportMessage `json:"items"`
}
