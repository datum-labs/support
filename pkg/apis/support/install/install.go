package install

import (
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	utilruntime "k8s.io/apimachinery/pkg/util/runtime"

	"go.miloapis.com/support/pkg/apis/support/v1alpha1"
)

// Install registers the API group and adds types to a scheme.
func Install(scheme *runtime.Scheme) {
	utilruntime.Must(v1alpha1.AddToScheme(scheme))

	// Register v1alpha1 types under the internal (__internal) hub version so
	// the API machinery can handle server-side apply and other operations that
	// convert between wire format and the internal version. Since this group
	// has only one version, conversion is always identity.
	internalGV := schema.GroupVersion{Group: v1alpha1.GroupName, Version: runtime.APIVersionInternal}
	scheme.AddKnownTypes(internalGV,
		&v1alpha1.SupportTicket{},
		&v1alpha1.SupportTicketList{},
		&v1alpha1.SupportMessage{},
		&v1alpha1.SupportMessageList{},
		&v1alpha1.KnowledgeBaseEntry{},
		&v1alpha1.KnowledgeBaseEntryList{},
	)

	utilruntime.Must(scheme.SetVersionPriority(v1alpha1.SchemeGroupVersion))
}
