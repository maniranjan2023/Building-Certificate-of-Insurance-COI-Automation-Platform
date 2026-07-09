import { SkeletonPageHeader } from "@/components/skeletons/page-header";

export function MetricsPageFixture() {
  return (
    <div className="space-y-4">
      <SkeletonPageHeader
        eyebrow="Automation"
        title="Metrics & ROI"
        description="Compliance health, automation coverage, turnaround times, and quantified savings from AI-assisted COI review."
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          "Compliance rate",
          "Auto-processed",
          "Avg turnaround",
          "Est. savings",
        ].map((label) => (
          <div
            key={label}
            className="relative overflow-hidden rounded-xl border bg-background/70 p-4"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            <p className="mt-1 text-3xl font-semibold tabular-nums">84%</p>
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-48 rounded-xl border bg-card p-4" />
        <div className="h-48 rounded-xl border bg-card p-4" />
      </div>
    </div>
  );
}
