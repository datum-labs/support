package metrics

import (
	"k8s.io/component-base/metrics"
	"k8s.io/component-base/metrics/legacyregistry"
)

const namespace = "support"

var (
	OperationsTotal = metrics.NewCounterVec(
		&metrics.CounterOpts{
			Namespace:      namespace,
			Name:           "operations_total",
			Help:           "Total number of support resource operations",
			StabilityLevel: metrics.ALPHA,
		},
		[]string{"resource", "operation", "status"},
	)

	OperationDuration = metrics.NewHistogramVec(
		&metrics.HistogramOpts{
			Namespace:      namespace,
			Name:           "operation_duration_seconds",
			Help:           "Duration of support resource operations in seconds",
			StabilityLevel: metrics.ALPHA,
			Buckets:        metrics.ExponentialBuckets(0.001, 2, 14),
		},
		[]string{"resource", "operation"},
	)
)

func init() {
	legacyregistry.MustRegister(
		OperationsTotal,
		OperationDuration,
	)
}
