package v1alpha1

import (
	"fmt"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
)

const GroupName = "support.miloapis.com"

var SchemeGroupVersion = schema.GroupVersion{Group: GroupName, Version: "v1alpha1"}

var (
	SchemeBuilder = runtime.NewSchemeBuilder(addKnownTypes, addFieldLabelConversions)
	AddToScheme   = SchemeBuilder.AddToScheme
)

func Resource(resource string) schema.GroupResource {
	return SchemeGroupVersion.WithResource(resource).GroupResource()
}

func addKnownTypes(scheme *runtime.Scheme) error {
	scheme.AddKnownTypes(SchemeGroupVersion,
		&SupportTicket{},
		&SupportTicketList{},
		&SupportMessage{},
		&SupportMessageList{},
	)
	metav1.AddToGroupVersion(scheme, SchemeGroupVersion)
	return nil
}

func addFieldLabelConversions(scheme *runtime.Scheme) error {
	if err := scheme.AddFieldLabelConversionFunc(SchemeGroupVersion.WithKind("SupportTicket"),
		func(label, value string) (string, string, error) {
			switch label {
			case "metadata.name",
				"spec.status",
				"spec.priority",
				"spec.organizationRef.name",
				"spec.ownerRef.name",
				"status.phase":
				return label, value, nil
			default:
				return "", "", fmt.Errorf("field label %q not supported for SupportTicket", label)
			}
		}); err != nil {
		return err
	}

	if err := scheme.AddFieldLabelConversionFunc(SchemeGroupVersion.WithKind("SupportMessage"),
		func(label, value string) (string, string, error) {
			switch label {
			case "metadata.name",
				"spec.ticketRef",
				"spec.authorType",
				"spec.internal":
				return label, value, nil
			default:
				return "", "", fmt.Errorf("field label %q not supported for SupportMessage", label)
			}
		}); err != nil {
		return err
	}

	return nil
}
