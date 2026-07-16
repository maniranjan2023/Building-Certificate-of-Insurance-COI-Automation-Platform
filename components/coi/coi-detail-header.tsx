import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  History,
  ShieldCheck,
} from "lucide-react";
import type { CoiStatus, IntakeSource, JobStatus } from "@prisma/client";
import { JOB_STATUS_LABELS } from "@/lib/constants/job-status";
import { COI_STATUS_LABELS } from "@/lib/services/version-labels";
import { formatBytes, formatDate } from "@/lib/utils";
import { getInitials } from "@/lib/navigation";
import { IntakeSourceBadge } from "@/components/ui/intake-source-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { JobStatusBadge } from "@/components/ui/job-status-badge";
import { VersionBadge } from "@/components/ui/version-badge";
import { Button } from "@/components/ui/button";
import { CoiDeleteButton } from "@/components/coi/coi-delete-button";
import { AuditExportButton } from "@/components/coi/audit-export-button";
import { ExpandableText } from "@/components/ui/expandable-text";
import { coiAssetApiPath } from "@/lib/coi-asset-path";

interface CoiDetailHeaderProps {
  documentId: string;
  fileName: string;
  createdAt: Date;
  fileSizeBytes: number;
  mimeType: string;
  intakeSource: IntakeSource;
  senderEmail: string | null;
  senderId: string | null;
  versionNumber: number | null;
  coiStatus: CoiStatus | null;
  jobStatus: JobStatus | null;
  rejectionReason: string | null;
}

export function CoiDetailHeader({
  documentId,
  fileName,
  createdAt,
  fileSizeBytes,
  mimeType,
  intakeSource,
  senderEmail,
  senderId,
  versionNumber,
  coiStatus,
  jobStatus,
  rejectionReason,
}: CoiDetailHeaderProps) {
  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="p-5 md:p-6">
        <Button asChild variant="ghost" size="sm" className="mb-4 h-8 px-0 text-sm">
          <Link href="/dashboard">
            <ArrowLeft className="size-3.5" />
            Back to portfolio
          </Link>
        </Button>

        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 flex-1 gap-4">
            <div
              className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm md:size-14"
              aria-hidden
            >
              <ShieldCheck className="size-7 md:size-8" strokeWidth={2} />
            </div>

            <div className="min-w-0 flex-1 space-y-3">
              <p className="text-xs font-medium uppercase tracking-wide text-blue-600 dark:text-blue-400">
                Certificate of Insurance
              </p>

              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <h1 className="min-w-0 text-2xl font-semibold tracking-tight md:text-3xl">
                  <ExpandableText
                    text={fileName}
                    title="File name"
                    clampClassName="line-clamp-1"
                    className="font-semibold"
                  />
                </h1>
                {versionNumber != null ? (
                  <VersionBadge versionNumber={versionNumber} />
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
                <span>Uploaded {formatDate(createdAt)}</span>
                <span>{formatBytes(fileSizeBytes)}</span>
                <span className="break-all">{mimeType}</span>
              </div>

              {senderEmail ? (
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-lg border border-blue-600/20 bg-blue-600/10 text-[10px] font-semibold uppercase text-blue-700 dark:text-blue-300">
                    {getInitials(senderEmail)}
                  </div>
                  {senderId ? (
                    <Link
                      href={`/tenants/${senderId}`}
                      className="text-sm font-medium hover:text-blue-600 hover:underline"
                    >
                      {senderEmail}
                    </Link>
                  ) : (
                    <span className="text-sm font-medium">{senderEmail}</span>
                  )}
                  {senderId ? (
                    <Button asChild variant="outline" size="sm" className="h-7 text-xs">
                      <Link href={`/tenants/${senderId}`}>
                        <History className="size-3" />
                        Tenant history
                      </Link>
                    </Button>
                  ) : null}
                </div>
              ) : null}

              {rejectionReason ? (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
                  <p className="font-medium">Rejection reason</p>
                  <ExpandableText
                    text={rejectionReason}
                    title="Rejection reason"
                    clampClassName="line-clamp-2"
                    className="mt-1 text-red-600 dark:text-red-400"
                  />
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-start gap-2 lg:items-end">
            <div className="flex flex-wrap gap-2">
              <IntakeSourceBadge source={intakeSource} />
              {jobStatus ? (
                <JobStatusBadge
                  status={jobStatus}
                  label={JOB_STATUS_LABELS[jobStatus]}
                />
              ) : null}
              {coiStatus ? (
                <StatusBadge
                  status={coiStatus}
                  label={COI_STATUS_LABELS[coiStatus]}
                />
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline">
                <a href={coiAssetApiPath(documentId)} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-3.5" />
                  Open file
                </a>
              </Button>
              <AuditExportButton documentId={documentId} />
              <CoiDeleteButton
                documentId={documentId}
                fileName={fileName}
                redirectTo="/dashboard"
                variant="destructive"
                size="sm"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
