"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Bot,
  CheckCircle2,
  FileUp,
  Mail,
  MailX,
  RefreshCw,
  Sparkles,
  XCircle,
} from "lucide-react";
import type { TenantActivityEvent, TenantActivityEventKind } from "@/lib/services/tenant-activity";
import { getActivityKindLabel } from "@/lib/services/tenant-activity";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VersionBadge } from "@/components/ui/version-badge";
import { cn } from "@/lib/utils";

const KIND_ICONS: Record<TenantActivityEventKind, typeof FileUp> = {
  coi_uploaded: FileUp,
  job_update: RefreshCw,
  ai_run: Sparkles,
  agent_step: Bot,
  email_sent: Mail,
  email_failed: MailX,
  version_accepted: CheckCircle2,
  version_rejected: XCircle,
};

const KIND_STYLES: Record<TenantActivityEventKind, string> = {
  coi_uploaded: "border-sky-500/30 bg-sky-500/10 text-sky-400",
  job_update: "border-violet-500/30 bg-violet-500/10 text-violet-400",
  ai_run: "border-indigo-500/30 bg-indigo-500/10 text-indigo-400",
  agent_step: "border-cyan-500/30 bg-cyan-500/10 text-cyan-400",
  email_sent: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  email_failed: "border-red-500/30 bg-red-500/10 text-red-400",
  version_accepted: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  version_rejected: "border-red-500/30 bg-red-500/10 text-red-400",
};

type ActivityFilter = "all" | "emails" | TenantActivityEventKind;

const FILTER_OPTIONS: Array<{ value: ActivityFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "coi_uploaded", label: "Uploads" },
  { value: "emails", label: "Emails" },
  { value: "agent_step", label: "AI steps" },
  { value: "ai_run", label: "Pipeline" },
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

function ActivityFilterTabs({
  filter,
  onFilterChange,
  counts,
}: {
  filter: ActivityFilter;
  onFilterChange: (value: ActivityFilter) => void;
  counts: Partial<Record<ActivityFilter, number>>;
}) {
  return (
    <div
      role="tablist"
      aria-label="Filter activity"
      className="flex w-full flex-nowrap gap-0.5 overflow-x-auto rounded-lg border bg-muted/50 p-1 [scrollbar-width:thin]"
    >
      {FILTER_OPTIONS.map((option) => {
        const isActive = filter === option.value;
        const count = counts[option.value] ?? 0;

        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onFilterChange(option.value)}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-[color,background-color,box-shadow]",
              "border-transparent",
              isActive
                ? "border-border/60 bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:bg-background/60 hover:text-foreground"
            )}
          >
            {option.label}
            <span
              className={cn(
                "inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

interface TenantActivityTimelineProps {
  events: TenantActivityEvent[];
  showCoiLinks?: boolean;
  compact?: boolean;
  emptyMessage?: string;
}

export function TenantActivityTimeline({
  events,
  showCoiLinks = true,
  compact = false,
  emptyMessage = "No activity recorded yet.",
}: TenantActivityTimelineProps) {
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

  const filtered = useMemo(() => {
    return events.filter((event) => matchesFilter(event, filter));
  }, [events, filter]);

  if (events.length === 0) {
    return (
      <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {!compact ? (
        <ActivityFilterTabs
          filter={filter}
          onFilterChange={setFilter}
          counts={counts}
        />
      ) : null}

      {filtered.length === 0 ? (
        <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          No {FILTER_OPTIONS.find((o) => o.value === filter)?.label.toLowerCase()} events in this timeline.
        </p>
      ) : (
      <ol className="relative space-y-0">
        {filtered.map((event, index) => {
          const Icon = KIND_ICONS[event.kind];
          const isLast = index === filtered.length - 1;

          return (
            <li key={event.id} className="relative flex gap-4 pb-6">
              {!isLast ? (
                <span
                  aria-hidden
                  className="absolute left-[1.125rem] top-10 h-[calc(100%-1.5rem)] w-px bg-border"
                />
              ) : null}

              <div
                className={cn(
                  "relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full border",
                  KIND_STYLES[event.kind]
                )}
              >
                <Icon className="size-4" />
              </div>

              <div className="min-w-0 flex-1 space-y-1 pt-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium leading-tight">{event.title}</p>
                  <VersionBadge versionNumber={event.versionNumber} />
                  <span className="rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                    {getActivityKindLabel(event.kind)}
                  </span>
                </div>

                <p className="text-sm text-muted-foreground">{event.description}</p>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <time dateTime={event.timestamp}>{formatDate(event.timestamp)}</time>
                  {event.fileName ? <span>{event.fileName}</span> : null}
                </div>

                {event.meta && Object.keys(event.meta).length > 0 ? (
                  <dl className="mt-2 grid gap-1 rounded-md border bg-muted/30 p-2 text-xs">
                    {Object.entries(event.meta)
                      .filter(([, value]) => value !== null && value !== undefined && value !== "")
                      .slice(0, compact ? 3 : 6)
                      .map(([key, value]) => (
                        <div key={key} className="flex gap-2">
                          <dt className="shrink-0 text-muted-foreground">{key}:</dt>
                          <dd className="min-w-0 break-words font-mono">{String(value)}</dd>
                        </div>
                      ))}
                  </dl>
                ) : null}

                {showCoiLinks ? (
                  <Button asChild size="sm" variant="link" className="h-auto px-0 text-xs">
                    <Link href={`/dashboard/${event.coiDocumentId}`}>
                      Open COI v{event.versionNumber} — view AI pipeline
                    </Link>
                  </Button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
      )}
    </div>
  );
}

interface TenantActivitySummaryCardsProps {
  versionCount: number;
  emailSentCount: number;
  emailFailedCount: number;
  acceptedCount: number;
  rejectedCount: number;
}

export function TenantActivitySummaryCards({
  versionCount,
  emailSentCount,
  emailFailedCount,
  acceptedCount,
  rejectedCount,
}: TenantActivitySummaryCardsProps) {
  const items = [
    { label: "COI versions", value: versionCount },
    { label: "Emails sent", value: emailSentCount },
    { label: "Emails failed", value: emailFailedCount },
    { label: "Accepted", value: acceptedCount },
    { label: "Rejected", value: rejectedCount },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {items.map((item) => (
        <Card key={item.label} className="gap-2 py-3">
          <CardHeader className="px-4 pb-0">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {item.label}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-2">
            <p className="text-2xl font-semibold tabular-nums">{item.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
