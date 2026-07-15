"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, Trash2 } from "lucide-react";
import type { CoiJobWithRelations } from "@/lib/services/jobs";
import { JOB_STATUS_LABELS } from "@/lib/constants/job-status";
import { JOB_TYPE_LABELS, isReminderQueue } from "@/lib/constants/job-type";
import { formatDate } from "@/lib/utils";
import { JobStatusBadge } from "@/components/ui/job-status-badge";
import { VersionBadge } from "@/components/ui/version-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { QueueMetricsPanel } from "@/components/jobs/queue-metrics-panel";
import { CronScanPanel } from "@/components/jobs/cron-scan-panel";

interface JobsTableProps {
  jobs: CoiJobWithRelations[];
  dlqJobs: CoiJobWithRelations[];
}

type DlqFilter = "all" | "coi" | "reminder";

export function JobsTable({ jobs, dlqJobs }: JobsTableProps) {
  const router = useRouter();
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [dismissingId, setDismissingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dlqFilter, setDlqFilter] = useState<DlqFilter>("all");

  const filteredDlq = useMemo(() => {
    if (dlqFilter === "reminder") {
      return dlqJobs.filter((job) => isReminderQueue(job.queueName));
    }
    if (dlqFilter === "coi") {
      return dlqJobs.filter((job) => !isReminderQueue(job.queueName));
    }
    return dlqJobs;
  }, [dlqJobs, dlqFilter]);

  const reminderDlqCount = useMemo(
    () => dlqJobs.filter((job) => isReminderQueue(job.queueName)).length,
    [dlqJobs]
  );

  async function retryDlqJob(jobId: string) {
    setError(null);
    setRetryingId(jobId);
    try {
      const response = await fetch(`/api/jobs/dlq/${jobId}/retry`, { method: "POST" });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? "Retry failed");
      }
      router.refresh();
    } catch (retryError) {
      setError(retryError instanceof Error ? retryError.message : "Retry failed");
    } finally {
      setRetryingId(null);
    }
  }

  async function dismissDlqJob(jobId: string) {
    setError(null);
    setDismissingId(jobId);
    try {
      const response = await fetch(`/api/jobs/dlq/${jobId}`, { method: "DELETE" });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? "Dismiss failed");
      }
      router.refresh();
    } catch (dismissError) {
      setError(dismissError instanceof Error ? dismissError.message : "Dismiss failed");
    } finally {
      setDismissingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <QueueMetricsPanel />
      <CronScanPanel />

      <Card className="gap-3 py-4">
        <CardHeader className="gap-1 px-4 pb-0">
          <CardTitle className="text-lg">Processing jobs</CardTitle>
          <CardDescription className="text-sm">
            COI pipeline and reminder jobs with queue name and job type
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {jobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No jobs yet. Upload a COI or email one to the inbox.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="px-2 py-2 font-medium">File</th>
                    <th className="px-2 py-2 font-medium">Type</th>
                    <th className="px-2 py-2 font-medium">Queue</th>
                    <th className="px-2 py-2 font-medium">Tenant</th>
                    <th className="px-2 py-2 font-medium">Version</th>
                    <th className="px-2 py-2 font-medium">Status</th>
                    <th className="px-2 py-2 font-medium">Attempts</th>
                    <th className="px-2 py-2 font-medium">Error</th>
                    <th className="px-2 py-2 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job.id} className="border-b last:border-0">
                      <td className="px-2 py-2.5 font-medium">{job.coiDocument.fileName}</td>
                      <td className="px-2 py-2.5">
                        <span className="rounded-md border bg-muted/30 px-2 py-0.5 text-xs">
                          {JOB_TYPE_LABELS[job.type]}
                        </span>
                      </td>
                      <td className="px-2 py-2.5 text-xs text-muted-foreground">{job.queueName}</td>
                      <td className="px-2 py-2.5 text-muted-foreground">
                        {job.coiVersion?.sender.email ??
                          job.coiDocument.senderEmail ??
                          "—"}
                      </td>
                      <td className="px-2 py-2.5">
                        {job.coiVersion ? (
                          <VersionBadge versionNumber={job.coiVersion.versionNumber} />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-2 py-2.5">
                        <JobStatusBadge
                          status={job.status}
                          label={JOB_STATUS_LABELS[job.status]}
                        />
                      </td>
                      <td className="px-2 py-2.5 text-muted-foreground">{job.attempts}</td>
                      <td
                        className="max-w-[280px] px-2 py-2.5 text-xs text-destructive"
                        title={job.failureReason ?? undefined}
                      >
                        {job.failureReason ? (
                          <span className="line-clamp-2 whitespace-pre-wrap break-words">
                            {job.failureReason}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-2 py-2.5 text-muted-foreground">
                        {formatDate(job.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="gap-3 py-4">
        <CardHeader className="gap-1 px-4 pb-0">
          <CardTitle className="text-lg text-red-400">Dead letter queue</CardTitle>
          <CardDescription className="text-sm">
            Failed jobs after all retries — retry or dismiss. Reminder DLQ: {reminderDlqCount}
          </CardDescription>
          <div className="mt-2 flex flex-wrap gap-2">
            {(["all", "coi", "reminder"] as DlqFilter[]).map((filter) => (
              <Button
                key={filter}
                type="button"
                size="sm"
                variant={dlqFilter === filter ? "default" : "outline"}
                onClick={() => setDlqFilter(filter)}
              >
                {filter === "all" ? "All" : filter === "coi" ? "COI jobs" : "Reminders"}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {error ? <p className="mb-3 text-sm text-destructive">{error}</p> : null}
          {filteredDlq.length === 0 ? (
            <p className="text-sm text-muted-foreground">No DLQ jobs for this filter.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="px-2 py-2 font-medium">File</th>
                    <th className="px-2 py-2 font-medium">Type</th>
                    <th className="px-2 py-2 font-medium">Queue</th>
                    <th className="px-2 py-2 font-medium">Failure details</th>
                    <th className="px-2 py-2 font-medium">Attempts</th>
                    <th className="px-2 py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDlq.map((job) => (
                    <tr key={job.id} className="border-b last:border-0">
                      <td className="px-2 py-2.5 font-medium">{job.coiDocument.fileName}</td>
                      <td className="px-2 py-2.5">
                        <span
                          className={`rounded-md border px-2 py-0.5 text-xs ${
                            isReminderQueue(job.queueName)
                              ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                              : "bg-muted/30"
                          }`}
                        >
                          {JOB_TYPE_LABELS[job.type]}
                        </span>
                      </td>
                      <td className="px-2 py-2.5 text-xs text-muted-foreground">{job.queueName}</td>
                      <td className="max-w-md px-2 py-2.5">
                        <p
                          className="whitespace-pre-wrap break-words text-xs text-destructive"
                          title={job.failureReason ?? undefined}
                        >
                          {job.failureReason ?? "Unknown error"}
                        </p>
                        {job.dlqJobId ? (
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            DLQ id: {job.dlqJobId}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-2 py-2.5 text-muted-foreground">{job.attempts}</td>
                      <td className="px-2 py-2.5">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            size="xs"
                            variant="outline"
                            disabled={retryingId === job.id || dismissingId === job.id}
                            onClick={() => retryDlqJob(job.id)}
                          >
                            <RotateCcw className="size-3" />
                            {retryingId === job.id ? "Retrying..." : "Retry"}
                          </Button>
                          <Button
                            type="button"
                            size="xs"
                            variant="ghost"
                            disabled={retryingId === job.id || dismissingId === job.id}
                            onClick={() => dismissDlqJob(job.id)}
                          >
                            <Trash2 className="size-3" />
                            {dismissingId === job.id ? "..." : "Dismiss"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
