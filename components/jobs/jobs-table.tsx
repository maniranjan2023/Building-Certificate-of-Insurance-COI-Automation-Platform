"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import type { CoiJobWithRelations } from "@/lib/services/jobs";
import { JOB_STATUS_LABELS } from "@/lib/constants/job-status";
import { formatDate } from "@/lib/utils";
import { IntakeSourceBadge } from "@/components/ui/intake-source-badge";
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

interface JobsTableProps {
  jobs: CoiJobWithRelations[];
  dlqJobs: CoiJobWithRelations[];
}

export function JobsTable({ jobs, dlqJobs }: JobsTableProps) {
  const router = useRouter();
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function retryDlqJob(jobId: string) {
    setError(null);
    setRetryingId(jobId);
    try {
      const response = await fetch(`/api/jobs/dlq/${jobId}/retry`, {
        method: "POST",
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? "Retry failed");
      }
      router.refresh();
    } catch (retryError) {
      setError(
        retryError instanceof Error ? retryError.message : "Retry failed"
      );
    } finally {
      setRetryingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="gap-3 py-4">
        <CardHeader className="gap-1 px-4 pb-0">
          <CardTitle className="text-lg">Processing jobs</CardTitle>
          <CardDescription className="text-sm">
            Each job is linked to a tenant version (v1, v2, …)
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {jobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No jobs yet. Upload a COI or email one to the inbox.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] text-left text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="px-2 py-2 font-medium">File</th>
                    <th className="px-2 py-2 font-medium">Tenant</th>
                    <th className="px-2 py-2 font-medium">Version</th>
                    <th className="px-2 py-2 font-medium">Source</th>
                    <th className="px-2 py-2 font-medium">Status</th>
                    <th className="px-2 py-2 font-medium">Attempts</th>
                    <th className="px-2 py-2 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job.id} className="border-b last:border-0">
                      <td className="px-2 py-2.5 font-medium">
                        {job.coiDocument.fileName}
                      </td>
                      <td className="px-2 py-2.5 text-muted-foreground">
                        {job.coiVersion?.sender.email ??
                          job.coiDocument.senderEmail ??
                          "—"}
                      </td>
                      <td className="px-2 py-2.5">
                        {job.coiVersion ? (
                          <VersionBadge
                            versionNumber={job.coiVersion.versionNumber}
                          />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-2 py-2.5">
                        <IntakeSourceBadge
                          source={job.coiDocument.intakeSource}
                        />
                      </td>
                      <td className="px-2 py-2.5">
                        <JobStatusBadge
                          status={job.status}
                          label={JOB_STATUS_LABELS[job.status]}
                        />
                      </td>
                      <td className="px-2 py-2.5 text-muted-foreground">
                        {job.attempts}
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
            Failed jobs after all retries — use Retry to re-enqueue
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {error ? (
            <p className="mb-3 text-sm text-destructive">{error}</p>
          ) : null}
          {dlqJobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No DLQ jobs.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] text-left text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="px-2 py-2 font-medium">File</th>
                    <th className="px-2 py-2 font-medium">Version</th>
                    <th className="px-2 py-2 font-medium">Reason</th>
                    <th className="px-2 py-2 font-medium">Attempts</th>
                    <th className="px-2 py-2 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {dlqJobs.map((job) => (
                    <tr key={job.id} className="border-b last:border-0">
                      <td className="px-2 py-2.5 font-medium">
                        {job.coiDocument.fileName}
                      </td>
                      <td className="px-2 py-2.5">
                        {job.coiVersion ? (
                          <VersionBadge
                            versionNumber={job.coiVersion.versionNumber}
                          />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="max-w-xs truncate px-2 py-2.5 text-muted-foreground">
                        {job.failureReason ?? "Unknown error"}
                      </td>
                      <td className="px-2 py-2.5 text-muted-foreground">
                        {job.attempts}
                      </td>
                      <td className="px-2 py-2.5">
                        <Button
                          type="button"
                          size="xs"
                          variant="outline"
                          disabled={retryingId === job.id}
                          onClick={() => retryDlqJob(job.id)}
                        >
                          <RotateCcw className="size-3" />
                          {retryingId === job.id ? "Retrying..." : "Retry"}
                        </Button>
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
