import type { AgentStep, AiRun, CoiJob, OutboundEmail, ReminderLog } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getDocumentActivityEvents } from "@/lib/services/tenant-activity";
import { resolveExpirationDate } from "@/lib/utils/coi-dates";

export interface CoiAuditExport {
  exportedAt: string;
  schemaVersion: "1.0";
  document: {
    id: string;
    fileName: string;
    cloudinaryUrl: string;
    mimeType: string;
    fileSizeBytes: number;
    intakeSource: string;
    senderEmail: string | null;
    createdAt: string;
    updatedAt: string;
  };
  version: {
    id: string;
    versionNumber: number;
    status: string;
    rejectionReason: string | null;
    notes: string | null;
    aiSuggestedTemplate: string | null;
    expirationDate: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
  sender: {
    id: string;
    email: string;
    displayName: string | null;
  } | null;
  immutableFile: {
    cloudinaryUrl: string;
    cloudinaryPublicId: string;
    storedAt: string;
    note: string;
  };
  aiRuns: Array<{
    id: string;
    status: string;
    exitReason: string | null;
    suggestedTemplate: string | null;
    startedAt: string;
    completedAt: string | null;
    steps: Array<{
      stepOrder: number;
      kind: string;
      agentName: string | null;
      modelUsed: string | null;
      guardrailPassed: boolean | null;
      tripwireReason: string | null;
      durationMs: number | null;
      createdAt: string;
      input: unknown;
      output: unknown;
    }>;
  }>;
  jobs: Array<{
    id: string;
    type: string;
    status: string;
    queueName: string;
    attempts: number;
    failureReason: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
  outboundEmails: Array<{
    id: string;
    templateKey: string;
    toEmail: string;
    subject: string;
    status: string;
    sentAt: string | null;
    errorMessage: string | null;
    createdAt: string;
  }>;
  reminderLogs: Array<{
    daysBefore: number;
    sentAt: string;
  }>;
  decisions: {
    acceptanceStatus: string | null;
    rejectionReason: string | null;
    lastUpdatedAt: string | null;
  };
  activityTimeline: Awaited<ReturnType<typeof getDocumentActivityEvents>>;
  complianceSnapshot: {
    extractedFields: unknown;
    checklistResults: unknown;
    draftReport: unknown;
    riskAnalysis: unknown;
  };
  documentChecklistItems: Array<{
    id: string;
    requirement: string;
    expectedValue: string;
    mandatory: boolean;
    category: string;
  }>;
}

type VersionBundle = NonNullable<
  Awaited<ReturnType<typeof prisma.coiVersion.findUnique>>
> & {
  sender: { id: string; email: string; displayName: string | null };
  jobs: CoiJob[];
  aiRuns: (AiRun & { steps: AgentStep[] })[];
  outboundEmails: OutboundEmail[];
};

export async function buildCoiAuditExport(
  coiDocumentId: string
): Promise<CoiAuditExport | null> {
  const document = await prisma.coiDocument.findUnique({
    where: { id: coiDocumentId },
    include: {
      reminderLogs: { orderBy: { sentAt: "asc" } },
      version: {
        include: {
          sender: true,
          jobs: { orderBy: { createdAt: "asc" } },
          aiRuns: {
            include: { steps: { orderBy: { stepOrder: "asc" } } },
            orderBy: { startedAt: "asc" },
          },
          outboundEmails: { orderBy: { createdAt: "asc" } },
        },
      },
    },
  });

  if (!document) return null;

  const [activityTimeline] = await Promise.all([
    getDocumentActivityEvents(coiDocumentId),
  ]);

  const version = document.version as VersionBundle | null;
  const expiration = version ? resolveExpirationDate(version) : null;

  const checklistItemIds = new Set<string>();
  const checklistResults = version?.checklistResults as
    | { items?: Array<{ checklistItemId?: string }> }
    | null
    | undefined;
  for (const item of checklistResults?.items ?? []) {
    if (item.checklistItemId) {
      checklistItemIds.add(item.checklistItemId);
    }
  }

  const documentChecklistItems =
    checklistItemIds.size > 0
      ? await prisma.checklistItem.findMany({
          where: { id: { in: [...checklistItemIds] } },
          orderBy: { sortOrder: "asc" },
        })
      : [];

  return {
    exportedAt: new Date().toISOString(),
    schemaVersion: "1.0",
    document: {
      id: document.id,
      fileName: document.fileName,
      cloudinaryUrl: "[redacted — use authenticated asset API]",
      mimeType: document.mimeType,
      fileSizeBytes: document.fileSizeBytes,
      intakeSource: document.intakeSource,
      senderEmail: document.senderEmail,
      createdAt: document.createdAt.toISOString(),
      updatedAt: document.updatedAt.toISOString(),
    },
    version: version
      ? {
          id: version.id,
          versionNumber: version.versionNumber,
          status: version.status,
          rejectionReason: version.rejectionReason,
          notes: version.notes,
          aiSuggestedTemplate: version.aiSuggestedTemplate,
          expirationDate: expiration?.toISOString().slice(0, 10) ?? null,
          createdAt: version.createdAt.toISOString(),
          updatedAt: version.updatedAt.toISOString(),
        }
      : null,
    sender: version
      ? {
          id: version.sender.id,
          email: version.sender.email,
          displayName: version.sender.displayName,
        }
      : null,
    immutableFile: {
      cloudinaryUrl: "[redacted — use authenticated asset API]",
      cloudinaryPublicId: document.cloudinaryPublicId,
      storedAt: document.createdAt.toISOString(),
      note: "Original upload stored immutably in Cloudinary at intake time.",
    },
    aiRuns: (version?.aiRuns ?? []).map((run) => ({
      id: run.id,
      status: run.status,
      exitReason: run.exitReason,
      suggestedTemplate: run.suggestedTemplate,
      startedAt: run.startedAt.toISOString(),
      completedAt: run.completedAt?.toISOString() ?? null,
      steps: run.steps.map((step) => ({
        stepOrder: step.stepOrder,
        kind: step.kind,
        agentName: step.agentName,
        modelUsed: step.modelUsed,
        guardrailPassed: step.guardrailPassed,
        tripwireReason: step.tripwireReason,
        durationMs: step.durationMs,
        createdAt: step.createdAt.toISOString(),
        input: step.input,
        output: step.output,
      })),
    })),
    jobs: (version?.jobs ?? []).map((job) => ({
      id: job.id,
      type: job.type,
      status: job.status,
      queueName: job.queueName,
      attempts: job.attempts,
      failureReason: job.failureReason,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
    })),
    outboundEmails: (version?.outboundEmails ?? []).map((email) => ({
      id: email.id,
      templateKey: email.templateKey,
      toEmail: email.toEmail,
      subject: email.subject,
      status: email.status,
      sentAt: email.sentAt?.toISOString() ?? null,
      errorMessage: email.errorMessage,
      createdAt: email.createdAt.toISOString(),
    })),
    reminderLogs: document.reminderLogs.map((log: ReminderLog) => ({
      daysBefore: log.daysBefore,
      sentAt: log.sentAt.toISOString(),
    })),
    decisions: {
      acceptanceStatus: version?.status ?? null,
      rejectionReason: version?.rejectionReason ?? null,
      lastUpdatedAt: version?.updatedAt.toISOString() ?? null,
    },
    activityTimeline,
    complianceSnapshot: {
      extractedFields: version?.extractedFields ?? null,
      checklistResults: version?.checklistResults ?? null,
      draftReport: version?.draftReport ?? null,
      riskAnalysis: version?.riskAnalysis ?? null,
    },
    documentChecklistItems: documentChecklistItems.map((item) => ({
      id: item.id,
      requirement: item.requirement,
      expectedValue: item.expectedValue,
      mandatory: item.mandatory,
      category: item.category,
    })),
  };
}
