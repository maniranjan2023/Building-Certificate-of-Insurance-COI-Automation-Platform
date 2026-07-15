import { CoiPdfViewer } from "@/components/coi/coi-pdf-viewer-dynamic";
import { CoiPipelinePanel } from "@/components/coi/coi-pipeline-panel";
import { CoiDetailHeader } from "@/components/coi/coi-detail-header";
import { parseChecklistResults } from "@/components/coi/checklist-results-table";
import { LiveChecklistResults } from "@/components/coi/live-checklist-results";
import { LiveAiResults } from "@/components/coi/live-ai-results";
import { getPipelineStatusForDocument } from "@/lib/services/pipeline-status";
import { notFound } from "next/navigation";
import { getCoiDocumentByIdWithLatestJob } from "@/lib/services/coi";
import { listVersionsForDocument } from "@/lib/services/version";
import { VersionHistory } from "@/components/coi/version-history";
import { ReviewActionsPanel } from "@/components/coi/review-actions-panel";
import { ResubmitForm } from "@/components/coi/resubmit-form";
import { DocumentActivityPanel } from "@/components/tenants/document-activity-panel";
import { resolveSenderIdForDocument } from "@/lib/services/tenant-activity";
import { FileImage, UploadCloud } from "lucide-react";
import type { ReportAgentOutput } from "@/lib/ai/schemas";
import { JobStatus } from "@prisma/client";
import { coiAssetApiPath } from "@/lib/coi-asset-path";

interface CoiDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CoiDetailPage({ params }: CoiDetailPageProps) {
  const { id } = await params;
  const document = await getCoiDocumentByIdWithLatestJob(id);

  if (!document) {
    notFound();
  }

  const versions = document.version ? await listVersionsForDocument(id) : [];

  const pipelineStatus = await getPipelineStatusForDocument(id);
  const senderRef = await resolveSenderIdForDocument(id);

  const isPdf = document.mimeType === "application/pdf";
  const jobReady = document.latestJob?.status === JobStatus.READY_FOR_REVIEW;
  const draftReport = document.version
    ? asReport(document.version.draftReport)
    : null;
  const checklist = document.version
    ? parseChecklistResults(document.version.checklistResults)
    : null;
  const recipientEmail =
    document.senderEmail ?? document.sender?.email ?? null;

  return (
    <div className="mx-auto min-w-0 max-w-6xl space-y-6 overflow-x-hidden">
      <CoiDetailHeader
        documentId={id}
        fileName={document.fileName}
        createdAt={document.createdAt}
        fileSizeBytes={document.fileSizeBytes}
        mimeType={document.mimeType}
        intakeSource={document.intakeSource}
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

      {/* Top row: upload (left) + PDF preview (right) */}
      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <section className="min-w-0 overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="border-b px-4 py-3 md:px-5">
            <h2 className="font-semibold tracking-tight">Upload / resubmit</h2>
            <p className="text-xs text-muted-foreground">
              Replace this COI with a corrected version for the same tenant
            </p>
          </div>
          <div className="p-4 md:p-5">
            {document.senderEmail ? (
              <ResubmitForm
                documentId={id}
                senderEmail={document.senderEmail}
                embedded
              />
            ) : (
              <div className="rounded-xl border border-dashed px-4 py-10 text-center">
                <UploadCloud className="mx-auto size-8 text-muted-foreground" />
                <p className="mt-3 text-sm font-medium">No tenant email on file</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Resubmit is available once a sender email is linked to this
                  submission.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="min-w-0 overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="border-b px-4 py-3 md:px-5">
            <h2 className="font-semibold tracking-tight">Document preview</h2>
            <p className="text-xs text-muted-foreground">
              Scroll inside the viewer — page layout stays fixed
            </p>
          </div>
          <div className="min-w-0 overflow-x-hidden p-4 md:p-5">
            {isPdf ? (
              <CoiPdfViewer
                pdfUrl={`/api/coi/${id}/pdf`}
                fileName={document.fileName}
              />
            ) : (
              <div className="overflow-hidden rounded-xl border bg-muted/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coiAssetApiPath(id)}
                  alt={document.fileName}
                  className="max-h-[70vh] w-full object-contain"
                />
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Full-width stacked analysis sections */}
      <div className="flex min-w-0 flex-col gap-4 overflow-x-hidden">
        {document.version && pipelineStatus ? (
          <CoiPipelinePanel
            documentId={id}
            initialStatus={pipelineStatus}
            showAiResults={false}
          />
        ) : (
          <section className="rounded-2xl border border-dashed bg-card/50 px-6 py-10 text-center">
            <FileImage className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">No version linked yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Processing metadata will appear once the submission is versioned.
            </p>
          </section>
        )}

        {document.version ? (
          <LiveAiResults
            documentId={id}
            initialStatus={pipelineStatus}
            isPipelineActive={pipelineStatus?.isActive ?? false}
          />
        ) : null}

        {document.version ? (
          <LiveChecklistResults
            documentId={id}
            initialChecklist={checklist}
            isPipelineActive={pipelineStatus?.isActive ?? false}
          />
        ) : null}

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
  );
}

function asReport(value: unknown): ReportAgentOutput | null {
  if (!value || typeof value !== "object") return null;
  return value as ReportAgentOutput;
}
