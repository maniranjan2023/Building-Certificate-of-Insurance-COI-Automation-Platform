import { computePlatformMetrics } from "@/lib/services/metrics";
import { MetricsDashboard } from "@/components/metrics/metrics-dashboard";

export default async function MetricsPage() {
  const metrics = await computePlatformMetrics();

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Automation
        </p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight">Metrics & ROI</h2>
        <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
          Compliance health, automation coverage, turnaround times, and quantified
          savings from AI-assisted COI review.
        </p>
      </div>

      <MetricsDashboard metrics={metrics} />
    </div>
  );
}
