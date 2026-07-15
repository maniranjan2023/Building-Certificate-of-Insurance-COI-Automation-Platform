import { Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

export function QueueMetricsFixture() {
  return (
    <section className="rounded-2xl border bg-card p-4 shadow-sm md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 text-sm font-medium text-primary">
            <Activity className="size-4" />
            Live queue monitoring
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Redis DLQ depth + database job status (refreshes on demand)
          </p>
        </div>
        <Button type="button" size="sm" variant="outline" disabled>
          Refresh
        </Button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {["coi-jobs", "reminder-jobs", "coi-dlq", "reminder-dlq"].map((name) => (
          <div key={name} className="rounded-xl border bg-muted/20 p-3">
            <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {name}
            </p>
            <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
              <div>
                <p className="text-muted-foreground">Wait</p>
                <p className="font-semibold tabular-nums">3</p>
              </div>
              <div>
                <p className="text-muted-foreground">Active</p>
                <p className="font-semibold tabular-nums">1</p>
              </div>
              <div>
                <p className="text-muted-foreground">Delayed</p>
                <p className="font-semibold tabular-nums">0</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
