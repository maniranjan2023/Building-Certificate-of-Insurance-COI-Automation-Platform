import { CoiPdfViewer } from "@/components/coi/coi-pdf-viewer-dynamic";
import { CoiPipelinePanel } from "@/components/coi/coi-pipeline-panel";
import { CoiDetailHeader } from "@/components/coi/coi-detail-header";
import { getPipelineStatusForDocument } from "@/lib/services/pipeline-status";
import { notFound } from "next/navigation";
import { getCoiDocumentByIdWithLatestJob } from "@/lib/services/coi";
import { listVersionsForDocument } from "@/lib/services/version";
import { VersionHistory } from "@/components/coi/version-history";
import { ReviewActionsPanel } from "@/components/coi/review-actions-panel";
import { ResubmitForm } from "@/components/coi/resubmit-form";
import { DocumentActivityPanel } from "@/components/tenants/document-activity-panel";
import { resolveSenderIdForDocument } from "@/lib/services/tenant-activity";
import { FileImage } from "lucide-react";
import type { ReportAgentOutput } from "@/lib/ai/schemas";
import { JobStatus } from "@prisma/client";

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

  const pipelineStatus = await getPipelineStatusForDocument(id);
  const senderRef = await resolveSenderIdForDocument(id);

  const isPdf = document.mimeType === "application/pdf";
  const jobReady = document.latestJob?.status === JobStatus.READY_FOR_REVIEW;
  const draftReport = document.version
    ? asReport(document.version.draftReport)
    : null;
  const recipientEmail =
    document.senderEmail ?? document.sender?.email ?? null;

  return (
    <div className="min-w-0 space-y-6">
      <CoiDetailHeader
        documentId={id}
        fileName={document.fileName}
        createdAt={document.createdAt}
        fileSizeBytes={document.fileSizeBytes}
        mimeType={document.mimeType}
        intakeSource={document.intakeSource}
        cloudinaryUrl={document.cloudinaryUrl}
        senderEmail={document.senderEmail}
        senderId={senderRef?.senderId ?? null}
        versionNumber={document.version?.versionNumber ?? null}
        coiStatus={document.status}
        jobStatus={document.latestJob?.status ?? null}
        rejectionReason={document.version?.rejectionReason ?? null}
      />

      {document.version ? (
        <VersionHistory versions={versions} currentDocumentId={id} />
      ) : null}

      <div className="grid min-w-0 gap-6 xl:grid-cols-12">
        <div className="min-w-0 space-y-4 xl:col-span-5 xl:sticky xl:top-20 xl:self-start">
          <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="border-b px-4 py-3 md:px-5">
              <h2 className="font-semibold tracking-tight">Document preview</h2>
              <p className="text-xs text-muted-foreground">
                Scroll inside the viewer — page layout stays fixed
              </p>
            </div>
            <div className="min-w-0 p-4 md:p-5">
              {isPdf ? (
                <CoiPdfViewer
                  pdfUrl={`/api/coi/${id}/pdf`}
                  fileName={document.fileName}
                />
              ) : (
                <div className="overflow-hidden rounded-xl border bg-muted/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={document.cloudinaryUrl}
                    alt={document.fileName}
                    className="max-h-[70vh] w-full object-contain"
                  />
                </div>
              )}
            </div>
          </section>

          {document.senderEmail ? (
            <ResubmitForm documentId={id} senderEmail={document.senderEmail} />
          ) : null}
        </div>

        <div className="min-w-0 space-y-4 xl:col-span-7">
          {document.version && pipelineStatus ? (
            <CoiPipelinePanel documentId={id} initialStatus={pipelineStatus} />
          ) : (
            <section className="rounded-2xl border border-dashed bg-card/50 px-6 py-10 text-center">
              <FileImage className="mx-auto size-8 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium">No version linked yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Processing metadata will appear once the submission is versioned.
              </p>
            </section>
          )}

          {document.version ? <DocumentActivityPanel coiDocumentId={id} /> : null}

          {document.version ? (
            <ReviewActionsPanel
              documentId={id}
              versionId={document.version.id}
              currentStatus={document.version.status}
              initialDraft={draftReport}
              suggestedTemplate={document.version.aiSuggestedTemplate}
              recipientEmail={recipientEmail}
              jobReady={jobReady}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function asReport(value: unknown): ReportAgentOutput | null {
  if (!value || typeof value !== "object") return null;
  return value as ReportAgentOutput;
}
