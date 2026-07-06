import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { CoiSubmissionRow } from "@/lib/services/coi";
import { JOB_STATUS_LABELS } from "@/lib/constants/job-status";
import { COI_STATUS_LABELS } from "@/lib/services/version-labels";
import { formatDate } from "@/lib/utils";
import { CoiDeleteButton } from "@/components/coi/coi-delete-button";
import { IntakeSourceBadge } from "@/components/ui/intake-source-badge";
import { JobStatusBadge } from "@/components/ui/job-status-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { VersionBadge } from "@/components/ui/version-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface CoiTableProps {
  documents: CoiSubmissionRow[];
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
          {documents.length} version{documents.length === 1 ? "" : "s"} in your portfolio
        </CardDescription>
      </CardHeader>
      <CardContent className={`${compactContentClass} overflow-x-auto`}>
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead>
            <tr className="border-b text-muted-foreground">
              <th className="px-2 py-2 font-medium">File</th>
              <th className="px-2 py-2 font-medium">Tenant</th>
              <th className="px-2 py-2 font-medium">Version</th>
              <th className="px-2 py-2 font-medium">Source</th>
              <th className="px-2 py-2 font-medium">COI status</th>
              <th className="px-2 py-2 font-medium">Job status</th>
              <th className="px-2 py-2 font-medium">Uploaded</th>
              <th className="px-2 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((submission) => {
              const document = submission.coiDocument;
              const job = submission.latestJob;

              return (
                <tr key={submission.id} className="border-b last:border-0">
                  <td className="px-2 py-2.5 font-medium">
                    {document.fileName}
                  </td>
                  <td className="px-2 py-2.5 text-muted-foreground">
                    {submission.sender.email}
                  </td>
                  <td className="px-2 py-2.5">
                    <VersionBadge versionNumber={submission.versionNumber} />
                  </td>
                  <td className="px-2 py-2.5">
                    <IntakeSourceBadge source={document.intakeSource} />
                  </td>
                  <td className="px-2 py-2.5">
                    <StatusBadge
                      status={submission.status}
                      label={COI_STATUS_LABELS[submission.status]}
                    />
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
                        ) : null}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">No job</span>
                    )}
                  </td>
                  <td className="px-2 py-2.5 text-muted-foreground">
                    {formatDate(submission.createdAt)}
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
                      <CoiDeleteButton
                        documentId={document.id}
                        fileName={document.fileName}
                      />
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
