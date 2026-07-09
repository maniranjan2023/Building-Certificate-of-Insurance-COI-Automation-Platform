"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ExternalLink,
  FileText,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import type { CoiSubmissionRow } from "@/lib/services/coi";
import { JOB_STATUS_LABELS } from "@/lib/constants/job-status";
import { COI_STATUS_LABELS } from "@/lib/services/version-labels";
import { formatDate, formatBytes } from "@/lib/utils";
import { getInitials } from "@/lib/navigation";
import { CoiDeleteButton } from "@/components/coi/coi-delete-button";
import { IntakeSourceBadge } from "@/components/ui/intake-source-badge";
import { JobStatusBadge } from "@/components/ui/job-status-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { VersionBadge } from "@/components/ui/version-badge";
import { coiAssetApiPath } from "@/lib/coi-asset-path";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { CoiStatus, JobStatus } from "@prisma/client";

interface CoiPortfolioProps {
  documents: CoiSubmissionRow[];
}

type StatusFilter = "all" | CoiStatus | "processing";

const STATUS_FILTERS: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "PENDING_REVIEW", label: "Pending" },
  { value: "ACCEPTED", label: "Accepted" },
  { value: "REJECTED", label: "Rejected" },
  { value: "processing", label: "Processing" },
];

function matchesStatusFilter(
  submission: CoiSubmissionRow,
  filter: StatusFilter
): boolean {
  if (filter === "all") return true;
  if (filter === "processing") {
    const status = submission.latestJob?.status;
    return status === "QUEUED" || status === "PROCESSING";
  }
  return submission.status === filter;
}

export function CoiPortfolio({ documents }: CoiPortfolioProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const counts = useMemo(() => {
    const result: Partial<Record<StatusFilter, number>> = {};
    for (const option of STATUS_FILTERS) {
      result[option.value] = documents.filter((doc) =>
        matchesStatusFilter(doc, option.value)
      ).length;
    }
    return result;
  }, [documents]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return documents.filter((submission) => {
      if (!matchesStatusFilter(submission, statusFilter)) return false;
      if (!q) return true;
      const doc = submission.coiDocument;
      return (
        doc.fileName.toLowerCase().includes(q) ||
        submission.sender.email.toLowerCase().includes(q) ||
        (submission.sender.displayName?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [documents, query, statusFilter]);

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card/50 px-6 py-16 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl border bg-muted/50">
          <FileText className="size-7 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">No submissions yet</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Upload your first tenant COI or forward one by email — it will appear here
          with AI validation status.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">Submissions</h3>
          <p className="text-sm text-muted-foreground">
            {documents.length} version{documents.length === 1 ? "" : "s"} across your portfolio
          </p>
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search file or tenant…"
            className="h-9 bg-background/80 pl-9"
          />
        </div>
      </div>

      <div
        role="tablist"
        aria-label="Filter submissions"
        className="flex w-full flex-nowrap gap-0.5 overflow-x-auto rounded-lg border bg-muted/40 p-1 [scrollbar-width:thin]"
      >
        {STATUS_FILTERS.map((option) => {
          const isActive = statusFilter === option.value;
          const count = counts[option.value] ?? 0;

          return (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setStatusFilter(option.value)}
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
                  "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
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

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed px-6 py-10 text-center text-sm text-muted-foreground">
          <SlidersHorizontal className="mx-auto mb-2 size-5 opacity-50" />
          No submissions match your filters.
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((submission) => {
            const document = submission.coiDocument;
            const job = submission.latestJob;
            const tenantLabel =
              submission.sender.displayName ?? submission.sender.email;

            return (
              <article
                key={submission.id}
                className="group relative overflow-hidden rounded-xl border bg-card/80 p-4 shadow-sm transition-all hover:border-primary/25 hover:shadow-md"
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-linear-to-b from-primary/70 to-primary/20 opacity-0 transition-opacity group-hover:opacity-100"
                />

                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border bg-muted/40 text-xs font-semibold uppercase text-muted-foreground">
                      {getInitials(submission.sender.email)}
                    </div>

                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/dashboard/${document.id}`}
                          className="truncate font-medium hover:text-primary hover:underline"
                        >
                          {document.fileName}
                        </Link>
                        <VersionBadge versionNumber={submission.versionNumber} />
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <Link
                          href={`/tenants/${submission.senderId}`}
                          className="hover:text-foreground hover:underline"
                        >
                          {tenantLabel}
                        </Link>
                        <span>{formatBytes(document.fileSizeBytes)}</span>
                        <span>{formatDate(submission.createdAt)}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge
                          status={submission.status}
                          label={COI_STATUS_LABELS[submission.status]}
                        />
                        {job ? (
                          <JobStatusBadge
                            status={job.status}
                            label={JOB_STATUS_LABELS[job.status as JobStatus]}
                          />
                        ) : null}
                        <IntakeSourceBadge source={document.intakeSource} />
                      </div>

                      {job?.status === "DLQ" ? (
                        <Link
                          href="/dashboard/jobs"
                          className="inline-block text-xs text-red-400 hover:underline"
                        >
                          View in dead letter queue →
                        </Link>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5 lg:flex-col lg:items-end xl:flex-row">
                    <Button asChild size="sm">
                      <Link href={`/dashboard/${document.id}`}>Review</Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <a
                        href={coiAssetApiPath(document.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="size-3.5" />
                        Open
                      </a>
                    </Button>
                    <CoiDeleteButton
                      documentId={document.id}
                      fileName={document.fileName}
                    />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
