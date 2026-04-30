package main

import (
	"context"
	"fmt"
	"os"

	"github.com/spf13/cobra"
	"github.com/spf13/pflag"
	supportapiserver "go.miloapis.com/support/internal/apiserver"
	"go.miloapis.com/support/internal/version"
	"go.miloapis.com/support/pkg/generated/openapi"
	utilruntime "k8s.io/apimachinery/pkg/util/runtime"
	apiopenapi "k8s.io/apiserver/pkg/endpoints/openapi"
	genericapiserver "k8s.io/apiserver/pkg/server"
	"k8s.io/apiserver/pkg/server/options"
	utilfeature "k8s.io/apiserver/pkg/util/feature"
	"k8s.io/component-base/cli"
	basecompatibility "k8s.io/component-base/compatibility"
	"k8s.io/component-base/logs"
	logsapi "k8s.io/component-base/logs/api/v1"
	"k8s.io/klog/v2"

	_ "k8s.io/component-base/logs/json/register"
)

func init() {
	utilruntime.Must(logsapi.AddFeatureGates(utilfeature.DefaultMutableFeatureGate))
	utilfeature.DefaultMutableFeatureGate.Set("LoggingBetaOptions=true")
	utilfeature.DefaultMutableFeatureGate.Set("RemoteRequestHeaderUID=true")
}

func main() {
	cmd := newSupportCommand()
	code := cli.Run(cmd)
	os.Exit(code)
}

func newSupportCommand() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "support",
		Short: "Support - Kubernetes aggregated API for support ticket management",
		Long: `Support is a Kubernetes aggregated API server that provides support ticket
management capabilities, usable by any Milo-based system.

Exposes SupportTicket and SupportMessage resources accessible through
kubectl or any Kubernetes client.`,
	}
	cmd.AddCommand(newServeCommand())
	cmd.AddCommand(newVersionCommand())
	return cmd
}

func newServeCommand() *cobra.Command {
	opts := newSupportServerOptions()
	cmd := &cobra.Command{
		Use:   "serve",
		Short: "Start the support API server",
		RunE: func(cmd *cobra.Command, args []string) error {
			if err := opts.Complete(); err != nil {
				return err
			}
			if err := opts.Validate(); err != nil {
				return err
			}
			return runServer(opts, cmd.Context())
		},
	}
	flags := cmd.Flags()
	opts.AddFlags(flags)
	logsapi.AddFlags(opts.Logs, flags)
	return cmd
}

func newVersionCommand() *cobra.Command {
	return &cobra.Command{
		Use:   "version",
		Short: "Show version information",
		Run: func(cmd *cobra.Command, args []string) {
			info := version.Get()
			fmt.Printf("Support Server\n")
			fmt.Printf("  Version:       %s\n", info.Version)
			fmt.Printf("  Git Commit:    %s\n", info.GitCommit)
			fmt.Printf("  Git Tree:      %s\n", info.GitTreeState)
			fmt.Printf("  Build Date:    %s\n", info.BuildDate)
			fmt.Printf("  Go Version:    %s\n", info.GoVersion)
			fmt.Printf("  Go Compiler:   %s\n", info.Compiler)
			fmt.Printf("  Platform:      %s\n", info.Platform)
		},
	}
}

// SupportServerOptions holds all configuration for the support API server.
type SupportServerOptions struct {
	RecommendedOptions *options.RecommendedOptions
	Logs               *logsapi.LoggingConfiguration
}

func newSupportServerOptions() *SupportServerOptions {
	o := &SupportServerOptions{
		RecommendedOptions: options.NewRecommendedOptions(
			"/registry/support.miloapis.com",
			supportapiserver.Codecs.LegacyCodec(supportapiserver.Scheme.PrioritizedVersionsAllGroups()...),
		),
		Logs: logsapi.NewLoggingConfiguration(),
	}
	// Skip admission plugins for v1 — etcd registry handles validation via strategy.
	o.RecommendedOptions.Admission = nil
	return o
}

func (o *SupportServerOptions) AddFlags(fs *pflag.FlagSet) {
	o.RecommendedOptions.AddFlags(fs)
}

func (o *SupportServerOptions) Complete() error {
	return nil
}

func (o *SupportServerOptions) Validate() error {
	return nil
}

func (o *SupportServerOptions) Config() (*supportapiserver.Config, error) {
	if err := o.RecommendedOptions.SecureServing.MaybeDefaultWithSelfSignedCerts(
		"localhost", nil, nil); err != nil {
		return nil, fmt.Errorf("error creating self-signed certificates: %v", err)
	}

	genericConfig := genericapiserver.NewRecommendedConfig(supportapiserver.Codecs)
	genericConfig.EffectiveVersion = basecompatibility.NewEffectiveVersionFromString("1.34", "", "")

	namer := apiopenapi.NewDefinitionNamer(supportapiserver.Scheme)
	genericConfig.OpenAPIV3Config = genericapiserver.DefaultOpenAPIV3Config(openapi.GetOpenAPIDefinitions, namer)
	genericConfig.OpenAPIV3Config.Info.Title = "Support"
	genericConfig.OpenAPIV3Config.Info.Version = version.Version

	genericConfig.OpenAPIConfig = genericapiserver.DefaultOpenAPIConfig(openapi.GetOpenAPIDefinitions, namer)
	genericConfig.OpenAPIConfig.Info.Title = "Support"
	genericConfig.OpenAPIConfig.Info.Version = version.Version

	if err := o.RecommendedOptions.ApplyTo(genericConfig); err != nil {
		return nil, fmt.Errorf("failed to apply recommended options: %w", err)
	}

	return &supportapiserver.Config{GenericConfig: genericConfig}, nil
}

func runServer(opts *SupportServerOptions, ctx context.Context) error {
	if err := logsapi.ValidateAndApply(opts.Logs, utilfeature.DefaultMutableFeatureGate); err != nil {
		return fmt.Errorf("failed to apply logging configuration: %w", err)
	}

	config, err := opts.Config()
	if err != nil {
		return err
	}

	server, err := config.Complete().New()
	if err != nil {
		return err
	}

	defer logs.FlushLogs()
	klog.Info("Starting Support server...")
	return server.Run(ctx)
}
