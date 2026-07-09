"use client";

import { Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CronScanFixture() {
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
        <Button type="button" size="sm" variant="outline" disabled>
          Refresh
        </Button>
      </div>
      <div className="mt-4 space-y-2">
        {[1, 2, 3].map((row) => (
          <div key={row} className="h-10 rounded border bg-muted/20" />
        ))}
      </div>
    </section>
  );
}
