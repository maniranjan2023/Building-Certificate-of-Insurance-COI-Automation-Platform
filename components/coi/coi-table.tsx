import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { CoiDocumentWithLatestJob } from "@/lib/services/coi";
import { JOB_STATUS_LABELS } from "@/lib/constants/job-status";
import { formatBytes, formatDate } from "@/lib/utils";
import { JobStatusBadge } from "@/components/ui/job-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface CoiTableProps {
  documents: CoiDocumentWithLatestJob[];
}

const compactCardClass = "gap-3 py-4";
const compactHeaderClass = "gap-1 px-4 pb-0";
const compactContentClass = "px-4 pb-4";
const compactTitleClass = "text-lg";

export function CoiTable({ documents }: CoiTableProps) {
  if (documents.length === 0) {
    return (
      <Card className={compactCardClass}>
        <CardHeader className={compactHeaderClass}>
          <CardTitle className={compactTitleClass}>COI submissions</CardTitle>
          <CardDescription className="text-sm">
            No certificates uploaded yet. Upload a COI to get started.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={compactCardClass}>
      <CardHeader className={compactHeaderClass}>
        <CardTitle className={compactTitleClass}>COI submissions</CardTitle>
        <CardDescription className="text-sm">
          {documents.length} document{documents.length === 1 ? "" : "s"} in your portfolio
        </CardDescription>
      </CardHeader>
      <CardContent className={`${compactContentClass} overflow-x-auto`}>
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b text-muted-foreground">
              <th className="px-2 py-2 font-medium">File</th>
              <th className="px-2 py-2 font-medium">Job status</th>
              <th className="px-2 py-2 font-medium">Size</th>
              <th className="px-2 py-2 font-medium">Uploaded</th>
              <th className="px-2 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((document) => {
              const job = document.latestJob;

              return (
                <tr key={document.id} className="border-b last:border-0">
                  <td className="px-2 py-2.5 font-medium">
                    {document.fileName}
                  </td>
                  <td className="px-2 py-2.5">
                    {job ? (
                      <div className="flex flex-col gap-1">
                        <JobStatusBadge
                          status={job.status}
                          label={JOB_STATUS_LABELS[job.status]}
                        />
                        {job.status === "DLQ" ? (
                          <Link
                            href="/dashboard/jobs"
                            className="text-xs text-red-400 hover:underline"
                          >
                            View in dead letter queue →
                          </Link>
                        ) : job.status === "FAILED" ? (
                          <Link
                            href="/dashboard/jobs"
                            className="text-xs text-amber-400 hover:underline"
                          >
                            View in job queue →
                          </Link>
                        ) : job.status !== "READY_FOR_REVIEW" ? (
                          <Link
                            href="/dashboard/jobs"
                            className="text-xs text-muted-foreground hover:underline"
                          >
                            View job queue →
                          </Link>
                        ) : null}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">No job</span>
                    )}
                  </td>
                  <td className="px-2 py-2.5 text-muted-foreground">
                    {formatBytes(document.fileSizeBytes)}
                  </td>
                  <td className="px-2 py-2.5 text-muted-foreground">
                    {formatDate(document.createdAt)}
                  </td>
                  <td className="px-2 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <Button asChild variant="outline" size="xs">
                        <Link href={`/dashboard/${document.id}`}>View</Link>
                      </Button>
                      <Button asChild variant="ghost" size="xs">
                        <a
                          href={document.cloudinaryUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="size-3" />
                          Open
                        </a>
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
