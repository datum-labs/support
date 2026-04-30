package apiserver

import (
	"context"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/apimachinery/pkg/runtime/serializer"
	"k8s.io/apiserver/pkg/registry/rest"
	genericapiserver "k8s.io/apiserver/pkg/server"
	"k8s.io/klog/v2"

	_ "go.miloapis.com/support/internal/metrics"
	"go.miloapis.com/support/internal/registry/message"
	"go.miloapis.com/support/internal/registry/ticket"
	"go.miloapis.com/support/pkg/apis/support/install"
	"go.miloapis.com/support/pkg/apis/support/v1alpha1"
)

var (
	Scheme = runtime.NewScheme()
	Codecs = serializer.NewCodecFactory(Scheme)
)

func init() {
	install.Install(Scheme)

	metav1.AddToGroupVersion(Scheme, schema.GroupVersion{Version: "v1"})

	unversioned := schema.GroupVersion{Group: "", Version: "v1"}
	Scheme.AddUnversionedTypes(unversioned,
		&metav1.Status{},
		&metav1.APIVersions{},
		&metav1.APIGroupList{},
		&metav1.APIGroup{},
		&metav1.APIResourceList{},
	)
}

// Config combines generic apiserver configuration for the support server.
type Config struct {
	GenericConfig *genericapiserver.RecommendedConfig
}

// SupportServer is the support aggregated apiserver.
type SupportServer struct {
	GenericAPIServer *genericapiserver.GenericAPIServer
}

type completedConfig struct {
	GenericConfig genericapiserver.CompletedConfig
}

// CompletedConfig wraps a completed config to prevent use of incomplete configs.
type CompletedConfig struct {
	*completedConfig
}

// Complete fills defaults and returns a CompletedConfig.
func (cfg *Config) Complete() CompletedConfig {
	return CompletedConfig{&completedConfig{cfg.GenericConfig.Complete()}}
}

// New creates and initializes the SupportServer.
func (c completedConfig) New() (*SupportServer, error) {
	genericServer, err := c.GenericConfig.New("support-apiserver", genericapiserver.NewEmptyDelegate())
	if err != nil {
		return nil, err
	}

	s := &SupportServer{GenericAPIServer: genericServer}

	ticketREST, err := ticket.NewREST(Scheme, c.GenericConfig.RESTOptionsGetter)
	if err != nil {
		return nil, err
	}

	messageREST, err := message.NewREST(Scheme, c.GenericConfig.RESTOptionsGetter)
	if err != nil {
		return nil, err
	}

	apiGroupInfo := genericapiserver.NewDefaultAPIGroupInfo(v1alpha1.GroupName, Scheme, metav1.ParameterCodec, Codecs)
	apiGroupInfo.VersionedResourcesStorageMap["v1alpha1"] = map[string]rest.Storage{
		"supporttickets":  ticketREST,
		"supportmessages": messageREST,
	}

	if err := s.GenericAPIServer.InstallAPIGroup(&apiGroupInfo); err != nil {
		return nil, err
	}

	klog.Info("Support server initialized successfully")
	return s, nil
}

// Run starts the server.
func (s *SupportServer) Run(ctx context.Context) error {
	return s.GenericAPIServer.PrepareRun().RunWithContext(ctx)
}
