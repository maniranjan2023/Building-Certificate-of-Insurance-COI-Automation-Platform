import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getCoiDocumentByIdWithLatestJob } from "@/lib/services/coi";
import { listVersionsForDocument } from "@/lib/services/version";
import { JOB_STATUS_LABELS } from "@/lib/constants/job-status";
import { COI_STATUS_LABELS } from "@/lib/services/version-labels";
import { INTAKE_SOURCE_DESCRIPTIONS } from "@/lib/constants/intake-source";
import { formatBytes, formatDate } from "@/lib/utils";
import { IntakeSourceBadge } from "@/components/ui/intake-source-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { JobStatusBadge } from "@/components/ui/job-status-badge";
import { VersionBadge } from "@/components/ui/version-badge";
import { VersionHistory } from "@/components/coi/version-history";
import { VersionActions } from "@/components/coi/version-actions";
import { ResubmitForm } from "@/components/coi/resubmit-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface CoiDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CoiDetailPage({ params }: CoiDetailPageProps) {
  const { id } = await params;
  const document = await getCoiDocumentByIdWithLatestJob(id);

  if (!document) {
    notFound();
  }

  const versions = document.version
    ? await listVersionsForDocument(id)
    : [];

  const isPdf = document.mimeType === "application/pdf";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-1 h-8 px-0 text-sm">
            <Link href="/dashboard">
              <ArrowLeft className="size-3" />
              Back to dashboard
            </Link>
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {document.fileName}
            </h1>
            {document.version ? (
              <VersionBadge versionNumber={document.version.versionNumber} />
            ) : null}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Uploaded {formatDate(document.createdAt)}
            {document.senderEmail ? ` · ${document.senderEmail}` : ""}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <IntakeSourceBadge source={document.intakeSource} />
          {document.latestJob ? (
            <JobStatusBadge
              status={document.latestJob.status}
              label={JOB_STATUS_LABELS[document.latestJob.status]}
            />
          ) : null}
          {document.status ? (
            <StatusBadge
              status={document.status}
              label={COI_STATUS_LABELS[document.status]}
            />
          ) : null}
        </div>
      </div>

      {document.version ? (
        <VersionHistory versions={versions} currentDocumentId={id} />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <div className="space-y-4">
          <Card className="gap-3 py-4">
            <CardHeader className="gap-1 px-4 pb-0">
              <CardTitle className="text-lg">Document details</CardTitle>
              <CardDescription className="text-sm">Stored immutably in Cloudinary</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 px-4 pb-4 text-sm">
              <div>
                <p className="text-muted-foreground">Intake source</p>
                <div className="mt-1">
                  <IntakeSourceBadge source={document.intakeSource} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {INTAKE_SOURCE_DESCRIPTIONS[document.intakeSource]}
                </p>
              </div>
              {document.senderEmail ? (
                <div>
                  <p className="text-muted-foreground">Tenant email</p>
                  <p className="font-medium">{document.senderEmail}</p>
                </div>
              ) : null}
              {document.version ? (
                <div>
                  <p className="text-muted-foreground">Version</p>
                  <VersionBadge versionNumber={document.version.versionNumber} />
                </div>
              ) : null}
              {document.version?.rejectionReason ? (
                <div>
                  <p className="text-muted-foreground">Rejection reason</p>
                  <p className="font-medium text-red-400">
                    {document.version.rejectionReason}
                  </p>
                </div>
              ) : null}
              <div>
                <p className="text-muted-foreground">File name</p>
                <p className="font-medium">{document.fileName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">MIME type</p>
                <p className="font-medium">{document.mimeType}</p>
              </div>
              <div>
                <p className="text-muted-foreground">File size</p>
                <p className="font-medium">{formatBytes(document.fileSizeBytes)}</p>
              </div>
              <Button asChild size="sm" className="w-full">
                <a
                  href={document.cloudinaryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="size-3.5" />
                  Open in Cloudinary
                </a>
              </Button>
            </CardContent>
          </Card>

          {document.version ? (
            <VersionActions
              versionId={document.version.id}
              currentStatus={document.version.status}
            />
          ) : null}
        </div>

        <Card className="gap-3 overflow-hidden py-4">
          <CardHeader className="gap-1 px-4 pb-0">
            <CardTitle className="text-lg">Document preview</CardTitle>
            <CardDescription className="text-sm">
              {isPdf ? "PDF preview" : "Image preview"}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {isPdf ? (
              <iframe
                src={document.cloudinaryUrl}
                title={document.fileName}
                className="h-[70vh] w-full rounded-lg border bg-muted"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={document.cloudinaryUrl}
                alt={document.fileName}
                className="max-h-[70vh] w-full rounded-lg border object-contain bg-muted"
              />
            )}
          </CardContent>
        </Card>
      </div>

      {document.senderEmail ? (
        <ResubmitForm documentId={id} senderEmail={document.senderEmail} />
      ) : null}
    </div>
  );
}
