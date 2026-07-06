import { CoiStatus } from "@prisma/client";
import type { ReportAgentOutput } from "@/lib/ai/schemas";
import { isEmailTemplateKey } from "@/lib/constants/email-templates";
import { evaluateAcceptanceEligibility } from "@/lib/services/acceptance-gates";
import { enqueueSendTemplateEmailJob, type SendTemplateEmailEnqueueData } from "@/lib/services/jobs";
import { sendTemplatedEmail } from "@/lib/services/email-send";
import { prisma } from "@/lib/prisma";
import { VersionValidationError } from "@/lib/services/version";

export class ReviewActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReviewActionError";
  }
}

async function getVersionForDocument(documentId: string) {
  const version = await prisma.coiVersion.findUnique({
    where: { coiDocumentId: documentId },
    include: {
      sender: true,
      coiDocument: true,
    },
  });

  if (!version) {
    throw new ReviewActionError("COI version not found for this document.");
  }

  return version;
}

function resolveRecipientEmail(version: {
  sender: { email: string };
  coiDocument: { senderEmail: string | null };
}): string {
  return version.coiDocument.senderEmail ?? version.sender.email;
}

export async function getReviewContext(documentId: string) {
  const version = await getVersionForDocument(documentId);
  const eligibility = evaluateAcceptanceEligibility({
    checklistResults: version.checklistResults,
    extractedFields: version.extractedFields,
  });

  return {
    version,
    eligibility,
    suggestedTemplate: version.aiSuggestedTemplate,
    recipientEmail: resolveRecipientEmail(version),
  };
}

export async function updateDraftReport(
  documentId: string,
  draft: Partial<ReportAgentOutput>
) {
  const version = await getVersionForDocument(documentId);
  const existing =
    version.draftReport && typeof version.draftReport === "object"
      ? (version.draftReport as ReportAgentOutput)
      : ({} as Partial<ReportAgentOutput>);

  const merged: ReportAgentOutput = {
    summary: draft.summary ?? existing.summary ?? "",
    recommendation: draft.recommendation ?? existing.recommendation ?? "manual_review",
    recommendationReason:
      draft.recommendationReason ?? existing.recommendationReason ?? "",
    missingItems: draft.missingItems ?? existing.missingItems ?? [],
    matchedItems: draft.matchedItems ?? existing.matchedItems ?? [],
    citations: draft.citations ?? existing.citations ?? [],
    suggestedEmailBody:
      draft.suggestedEmailBody ?? existing.suggestedEmailBody ?? "",
    confidenceScore: draft.confidenceScore ?? existing.confidenceScore ?? 0,
  };

  return prisma.coiVersion.update({
    where: { id: version.id },
    data: { draftReport: merged },
  });
}

async function deliverComplianceEmail(data: SendTemplateEmailEnqueueData) {
  const version = await prisma.coiVersion.findUnique({
    where: { id: data.coiVersionId },
    include: { sender: true },
  });

  if (!version) {
    throw new ReviewActionError("Version not found for email send.");
  }

  await sendTemplatedEmail({
    version,
    templateKey: data.templateKey,
    toEmail: data.toEmail,
    customBody: data.customBody,
    customSubject: data.customSubject,
    rejectionReason: data.rejectionReason,
    replyToMessageId: data.agentMailMessageId,
    inboxId: data.agentMailInboxId,
  });
}

export async function enqueueComplianceEmail(options: {
  documentId: string;
  templateKey: string;
  customBody?: string;
  customSubject?: string;
  rejectionReason?: string;
  agentMailMessageId?: string | null;
  agentMailInboxId?: string | null;
  async?: boolean;
}) {
  if (!isEmailTemplateKey(options.templateKey)) {
    throw new ReviewActionError(`Unknown template: ${options.templateKey}`);
  }

  const version = await getVersionForDocument(options.documentId);
  const toEmail = resolveRecipientEmail(version);

  if (!toEmail) {
    throw new ReviewActionError("No tenant email on file for this COI.");
  }

  const payload: SendTemplateEmailEnqueueData = {
    coiVersionId: version.id,
    coiDocumentId: version.coiDocumentId,
    templateKey: options.templateKey,
    toEmail,
    customBody: options.customBody,
    customSubject: options.customSubject,
    rejectionReason: options.rejectionReason,
    agentMailMessageId: options.agentMailMessageId ?? undefined,
    agentMailInboxId: options.agentMailInboxId ?? undefined,
  };

  if (options.async) {
    return enqueueSendTemplateEmailJob(payload);
  }

  await deliverComplianceEmail(payload);
  return { sent: true, toEmail, templateKey: options.templateKey };
}

export async function acceptCoiVersion(documentId: string, options?: { customBody?: string }) {
  const { version, eligibility } = await getReviewContext(documentId);

  if (version.status === CoiStatus.ACCEPTED) {
    throw new ReviewActionError("This version is already accepted.");
  }

  if (!eligibility.canAccept) {
    throw new ReviewActionError(eligibility.blockers.join(" "));
  }

  await prisma.coiVersion.update({
    where: { id: version.id },
    data: {
      status: CoiStatus.ACCEPTED,
      rejectionReason: null,
    },
  });

  await enqueueComplianceEmail({
    documentId,
    templateKey: "approved",
    customBody: options?.customBody,
    async: false,
  });

  return prisma.coiVersion.findUnique({
    where: { id: version.id },
    include: { sender: true, coiDocument: true },
  });
}

export async function rejectCoiVersion(
  documentId: string,
  rejectionReason: string,
  options?: { customBody?: string }
) {
  if (!rejectionReason?.trim()) {
    throw new VersionValidationError(
      "A rejection reason is required when rejecting a COI."
    );
  }

  await getVersionForDocument(documentId);

  await prisma.coiVersion.update({
    where: { coiDocumentId: documentId },
    data: {
      status: CoiStatus.REJECTED,
      rejectionReason: rejectionReason.trim(),
    },
  });

  await enqueueComplianceEmail({
    documentId,
    templateKey: "rejected",
    rejectionReason: rejectionReason.trim(),
    customBody: options?.customBody,
    async: false,
  });

  return prisma.coiVersion.findUnique({
    where: { coiDocumentId: documentId },
    include: { sender: true, coiDocument: true },
  });
}

export async function sendSuggestedComplianceEmail(
  documentId: string,
  options?: {
    templateKey?: string;
    customBody?: string;
    customSubject?: string;
  }
) {
  const { version, suggestedTemplate } = await getReviewContext(documentId);
  const templateKey =
    options?.templateKey ??
    (suggestedTemplate && isEmailTemplateKey(suggestedTemplate)
      ? suggestedTemplate
      : "clauses_missing");

  const draft = version.draftReport as ReportAgentOutput | null;
  const body = options?.customBody ?? draft?.suggestedEmailBody;

  await enqueueComplianceEmail({
    documentId,
    templateKey,
    customBody: body,
    customSubject: options?.customSubject,
    async: false,
  });

  return { templateKey, sent: true };
}
