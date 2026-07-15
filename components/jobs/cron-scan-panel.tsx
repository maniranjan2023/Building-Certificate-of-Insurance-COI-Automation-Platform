"use client";

import { useCallback, useEffect, useState } from "react";
import { Clock3, RefreshCw } from "lucide-react";
import { CronScanSkeleton } from "@/components/skeletons/shadcn-page-skeletons";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

interface CronScanRow {
  id: string;
  startedAt: string;
  completedAt: string | null;
  durationMs: number | null;
  scanned: number;
  statusUpdates: number;
  remindersEnqueued: number;
  skippedAlreadySent: number;
  skippedNoEmail: number;
  skippedNoExpiry: number;
  expirationDatesBackfilled: number;
  errorMessage: string | null;
  lockSkipped: boolean;
}

export function CronScanPanel() {
  const [scans, setScans] = useState<CronScanRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/cron/scans", { cache: "no-store" });
      const payload = await response.json();
      if (response.ok && payload.success) {
        setScans(payload.data);
      }
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

  if (loading && scans.length === 0) {
    return <CronScanSkeleton />;
  }

  return (
    <section className="rounded-2xl border bg-card p-4 shadow-sm md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 text-sm font-medium text-primary">
            <Clock3 className="size-4" />
            Cron scan history
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Runtime, rows scanned, reminders enqueued, and errors from recent expiry scans
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

      <div className="mt-4 overflow-x-auto">
        {scans.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No cron scans recorded yet. Invoke `expiry-reminder-cron` in Inngest to create one.
          </p>
        ) : (
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="px-2 py-2 font-medium">Started</th>
                <th className="px-2 py-2 font-medium">Duration</th>
                <th className="px-2 py-2 font-medium">Scanned</th>
                <th className="px-2 py-2 font-medium">Enqueued</th>
                <th className="px-2 py-2 font-medium">Updates</th>
                <th className="px-2 py-2 font-medium">Result</th>
              </tr>
            </thead>
            <tbody>
              {scans.map((scan) => (
                <tr key={scan.id} className="border-b last:border-0">
                  <td className="px-2 py-2 text-muted-foreground">
                    {formatDate(scan.startedAt)}
                  </td>
                  <td className="px-2 py-2 tabular-nums">
                    {scan.lockSkipped
                      ? "skipped"
                      : scan.durationMs != null
                        ? `${scan.durationMs}ms`
                        : "—"}
                  </td>
                  <td className="px-2 py-2 tabular-nums">{scan.scanned}</td>
                  <td className="px-2 py-2 tabular-nums">{scan.remindersEnqueued}</td>
                  <td className="px-2 py-2 tabular-nums">{scan.statusUpdates}</td>
                  <td className="px-2 py-2">
                    {scan.errorMessage ? (
                      <span className="text-destructive">{scan.errorMessage}</span>
                    ) : scan.lockSkipped ? (
                      <span className="text-amber-600 dark:text-amber-400">Lock held</span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400">OK</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
