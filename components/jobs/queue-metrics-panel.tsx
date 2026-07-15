"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, RefreshCw } from "lucide-react";
import type { QueueMetricsSnapshot } from "@/lib/services/queue-metrics";
import { QueueMetricsSkeleton } from "@/components/skeletons/shadcn-page-skeletons";
import { Button } from "@/components/ui/button";

function statusColor(value: number): string {
  if (value === 0) return "text-muted-foreground";
  if (value < 10) return "text-amber-600 dark:text-amber-400";
  return "text-red-500";
}

function QueueMetricsContent({ metrics }: { metrics: QueueMetricsSnapshot }) {
  return (
    <div className="mt-4 space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.queues.map((queue) => (
          <div key={queue.queueName} className="rounded-xl border bg-muted/20 p-3">
            <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {queue.queueName}
            </p>
            <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
              <div>
                <p className="text-muted-foreground">Wait</p>
                <p className={`font-semibold tabular-nums ${statusColor(queue.waiting)}`}>
                  {queue.waiting}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Active</p>
                <p className="font-semibold tabular-nums">{queue.active}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Delayed</p>
                <p className={`font-semibold tabular-nums ${statusColor(queue.delayed)}`}>
                  {queue.delayed}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span>DB queued: {metrics.database.queued}</span>
        <span>DB processing: {metrics.database.processing}</span>
        <span>COI DLQ: {metrics.database.dlq}</span>
        <span>Reminder DLQ: {metrics.database.reminderDlq}</span>
        <span>Updated: {new Date(metrics.generatedAt).toLocaleTimeString()}</span>
      </div>
    </div>
  );
}

export function QueueMetricsPanel() {
  const [metrics, setMetrics] = useState<QueueMetricsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/queues/metrics", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? "Failed to load queue metrics");
      }
      setMetrics(payload.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    function refetchWhenVisible() {
      if (document.visibilityState === "visible") {
        void load();
      }
    }
    document.addEventListener("visibilitychange", refetchWhenVisible);
    window.addEventListener("focus", refetchWhenVisible);
    return () => {
      document.removeEventListener("visibilitychange", refetchWhenVisible);
      window.removeEventListener("focus", refetchWhenVisible);
    };
  }, [load]);

  if (loading && !metrics) {
    return <QueueMetricsSkeleton />;
  }

  return (
    <section className="rounded-2xl border bg-card p-4 shadow-sm md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 text-sm font-medium text-primary">
            <Activity className="size-4" />
            Live queue monitoring
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Inngest job status + Redis DLQ depth (refreshes on demand)
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => void load()}
          disabled={loading}
        >
          <RefreshCw className="size-3.5" />
          Refresh
        </Button>
      </div>

      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
      {metrics ? <QueueMetricsContent metrics={metrics} /> : null}
    </section>
  );
}
