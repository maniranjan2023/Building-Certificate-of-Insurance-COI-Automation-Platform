import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  History,
  Sparkles,
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

interface CoiDetailHeaderProps {
  documentId: string;
  fileName: string;
  createdAt: Date;
  fileSizeBytes: number;
  mimeType: string;
  intakeSource: IntakeSource;
  cloudinaryUrl: string;
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
  cloudinaryUrl,
  senderEmail,
  senderId,
  versionNumber,
  coiStatus,
  jobStatus,
  rejectionReason,
}: CoiDetailHeaderProps) {
  return (
    <section className="relative min-w-0 overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_75%_55%_at_0%_0%,oklch(0.62_0.19_255/0.14),transparent_55%),radial-gradient(ellipse_50%_40%_at_100%_100%,oklch(0.72_0.14_280/0.1),transparent_50%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 size-40 rounded-full bg-primary/10 blur-3xl"
      />

      <div className="relative p-5 md:p-6">
        <Button asChild variant="ghost" size="sm" className="mb-3 h-8 px-0 text-sm">
          <Link href="/dashboard">
            <ArrowLeft className="size-3.5" />
            Back to portfolio
          </Link>
        </Button>

        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="size-3.5" />
              COI review workspace
            </div>

            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h1 className="min-w-0 truncate text-2xl font-semibold tracking-tight md:text-3xl">
                {fileName}
              </h1>
              {versionNumber != null ? (
                <VersionBadge versionNumber={versionNumber} />
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
              <span>Uploaded {formatDate(createdAt)}</span>
              <span>{formatBytes(fileSizeBytes)}</span>
              <span className="truncate">{mimeType}</span>
            </div>

            {senderEmail ? (
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg border bg-muted/50 text-[10px] font-semibold uppercase">
                  {getInitials(senderEmail)}
                </div>
                {senderId ? (
                  <Link
                    href={`/tenants/${senderId}`}
                    className="text-sm font-medium hover:text-primary hover:underline"
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
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                Rejection reason: {rejectionReason}
              </p>
            ) : null}
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
                <a href={cloudinaryUrl} target="_blank" rel="noopener noreferrer">
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
