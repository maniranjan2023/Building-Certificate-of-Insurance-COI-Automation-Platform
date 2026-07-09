import { SkeletonPageHeader } from "@/components/skeletons/page-header";
import { QueueMetricsFixture } from "@/components/skeletons/fixtures/queue-metrics";

export function JobsPageFixture() {
  return (
    <div className="space-y-4">
      <SkeletonPageHeader
        eyebrow="Automation"
        title="Job queue, DLQ & operations"
        description="Live BullMQ queue depth, cron scan metrics, COI and reminder jobs, and DLQ recovery with retry or dismiss."
      />
      <QueueMetricsFixture />
      <section className="rounded-2xl border bg-card p-4 shadow-sm">
        <div className="mb-4 h-5 w-40 rounded bg-muted" />
        <div className="space-y-2">
          {[1, 2, 3, 4].map((row) => (
            <div key={row} className="h-10 rounded-lg border bg-muted/20" />
          ))}
        </div>
      </section>
    </div>
  );
}
