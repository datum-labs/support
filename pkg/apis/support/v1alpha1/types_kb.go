package v1alpha1

import metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

// +genclient
// +genclient:nonNamespaced
// +k8s:deepcopy-gen:interfaces=k8s.io/apimachinery/pkg/runtime.Object

// KnowledgeBaseEntry is a reusable article in the support knowledge base.
type KnowledgeBaseEntry struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   KnowledgeBaseEntrySpec   `json:"spec"`
	Status KnowledgeBaseEntryStatus `json:"status,omitempty"`
}

// KnowledgeBaseEntrySpec defines the content and metadata of a KB entry.
type KnowledgeBaseEntrySpec struct {
	// Title is the human-readable title of the entry.
	// +required
	Title string `json:"title"`

	// Body is the entry content in Markdown format.
	// +required
	Body string `json:"body"`

	// Topic categorizes the entry within the knowledge base.
	// +optional
	Topic string `json:"topic,omitempty"`

	// Tags are searchable labels attached to this entry.
	// +optional
	Tags []string `json:"tags,omitempty"`

	// AuthorRef identifies the staff member who created this entry.
	// +required
	AuthorRef UserReference `json:"authorRef"`

	// SourceMessageRef optionally tracks the SupportMessage this entry was promoted from.
	// +optional
	SourceMessageRef string `json:"sourceMessageRef,omitempty"`
}

// KnowledgeBaseEntryStatus describes the observed state of a KnowledgeBaseEntry.
type KnowledgeBaseEntryStatus struct {
	// CreatedAt is the time the entry was created.
	// +optional
	CreatedAt *metav1.Time `json:"createdAt,omitempty"`

	// UpdatedAt is the time the entry was last modified.
	// +optional
	UpdatedAt *metav1.Time `json:"updatedAt,omitempty"`
}

// +k8s:deepcopy-gen:interfaces=k8s.io/apimachinery/pkg/runtime.Object

// KnowledgeBaseEntryList contains a list of KnowledgeBaseEntry objects.
type KnowledgeBaseEntryList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`

	Items []KnowledgeBaseEntry `json:"items"`
}
