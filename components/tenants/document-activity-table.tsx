"use client";

import { useMemo, useState } from "react";
import type { TenantActivityEvent, TenantActivityEventKind } from "@/lib/services/tenant-activity";
import { getActivityKindLabel } from "@/lib/services/tenant-activity";
import { formatDate } from "@/lib/utils";
import { VersionBadge } from "@/components/ui/version-badge";
import { cn } from "@/lib/utils";

type ActivityFilter = "all" | "emails" | TenantActivityEventKind;

const FILTER_OPTIONS: Array<{ value: ActivityFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "coi_uploaded", label: "Uploads" },
  { value: "emails", label: "Emails" },
  { value: "agent_step", label: "AI steps" },
  { value: "ai_run", label: "Pipeline" },
  { value: "job_update", label: "Jobs" },
  { value: "version_accepted", label: "Accepted" },
  { value: "version_rejected", label: "Rejected" },
];

function matchesFilter(event: TenantActivityEvent, filter: ActivityFilter): boolean {
  if (filter === "all") return true;
  if (filter === "emails") {
    return event.kind === "email_sent" || event.kind === "email_failed";
  }
  return event.kind === filter;
}

function kindBadgeClass(kind: TenantActivityEventKind): string {
  switch (kind) {
    case "email_sent":
    case "version_accepted":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
    case "email_failed":
    case "version_rejected":
      return "border-red-500/30 bg-red-500/10 text-red-400";
    case "coi_uploaded":
      return "border-sky-500/30 bg-sky-500/10 text-sky-400";
    case "job_update":
      return "border-violet-500/30 bg-violet-500/10 text-violet-400";
    case "ai_run":
      return "border-indigo-500/30 bg-indigo-500/10 text-indigo-400";
    case "agent_step":
      return "border-cyan-500/30 bg-cyan-500/10 text-cyan-400";
    default:
      return "border-border bg-muted/40 text-muted-foreground";
  }
}

function summarizeMeta(
  meta?: Record<string, string | number | boolean | null>
): string {
  if (!meta) return "—";
  const entries = Object.entries(meta).filter(
    ([, value]) => value !== null && value !== undefined && value !== ""
  );
  if (entries.length === 0) return "—";
  return entries
    .slice(0, 3)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(" · ");
}

interface DocumentActivityTableProps {
  events: TenantActivityEvent[];
  emptyMessage?: string;
  className?: string;
  maxHeightClassName?: string;
  headerAction?: React.ReactNode;
}

export function DocumentActivityTable({
  events,
  emptyMessage = "No activity for this document.",
  className,
  maxHeightClassName = "max-h-[22rem]",
  headerAction,
}: DocumentActivityTableProps) {
  const [filter, setFilter] = useState<ActivityFilter>("all");

  const counts = useMemo(() => {
    const result: Partial<Record<ActivityFilter, number>> = {};
    for (const option of FILTER_OPTIONS) {
      result[option.value] = events.filter((event) =>
        matchesFilter(event, option.value)
      ).length;
    }
    return result;
  }, [events]);

  const filtered = useMemo(
    () => events.filter((event) => matchesFilter(event, filter)),
    [events, filter]
  );

  return (
    <section
      className={cn(
        "flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border bg-card shadow-sm",
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b px-4 py-3 md:px-5">
        <div className="min-w-0">
          <h2 className="font-semibold tracking-tight">Activity log</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {events.length} event{events.length === 1 ? "" : "s"} · emails, jobs, and AI steps
          </p>
        </div>
        {headerAction}
      </div>

      {events.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </p>
      ) : (
        <>
          <div
            role="tablist"
            aria-label="Filter activity"
            className="flex gap-0.5 overflow-x-auto border-b bg-muted/30 p-2 [scrollbar-width:thin]"
          >
            {FILTER_OPTIONS.map((option) => {
              const isActive = filter === option.value;
              const count = counts[option.value] ?? 0;
              if (option.value !== "all" && count === 0) return null;

              return (
                <button
                  key={option.value}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setFilter(option.value)}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors",
                    isActive
                      ? "border-border/60 bg-background text-foreground shadow-sm"
                      : "border-transparent text-muted-foreground hover:bg-background/70 hover:text-foreground"
                  )}
                >
                  {option.label}
                  <span className="tabular-nums text-[10px] opacity-70">{count}</span>
                </button>
              );
            })}
          </div>

          {filtered.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              No events for this filter.
            </p>
          ) : (
            <div className={cn("min-h-0 overflow-auto", maxHeightClassName)}>
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="sticky top-0 z-10 border-b bg-muted/80 text-xs uppercase tracking-wide text-muted-foreground backdrop-blur">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">When</th>
                    <th className="px-4 py-2.5 font-medium">Type</th>
                    <th className="px-4 py-2.5 font-medium">Event</th>
                    <th className="px-4 py-2.5 font-medium">Details</th>
                    <th className="px-4 py-2.5 font-medium">Ver</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((event) => (
                    <tr
                      key={event.id}
                      className="border-b last:border-0 hover:bg-muted/20"
                    >
                      <td className="whitespace-nowrap px-4 py-2.5 text-xs text-muted-foreground">
                        <time dateTime={event.timestamp}>
                          {formatDate(event.timestamp)}
                        </time>
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={cn(
                            "inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                            kindBadgeClass(event.kind)
                          )}
                        >
                          {getActivityKindLabel(event.kind)}
                        </span>
                      </td>
                      <td className="max-w-[200px] px-4 py-2.5">
                        <p className="line-clamp-1 font-medium" title={event.title}>
                          {event.title}
                        </p>
                        <p
                          className="mt-0.5 line-clamp-1 text-xs text-muted-foreground"
                          title={event.description}
                        >
                          {event.description}
                        </p>
                      </td>
                      <td className="max-w-[220px] px-4 py-2.5 text-xs text-muted-foreground">
                        <span
                          className="line-clamp-2 font-mono"
                          title={summarizeMeta(event.meta)}
                        >
                          {summarizeMeta(event.meta)}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <VersionBadge versionNumber={event.versionNumber} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
}
