import type {
  AgentStep,
  AiRun,
  CoiDocument,
  CoiJob,
  CoiVersion,
  OutboundEmail,
  Sender,
} from "@prisma/client";
import { EMAIL_TEMPLATE_LABELS } from "@/lib/constants/email-templates";
import { JOB_STATUS_LABELS } from "@/lib/constants/job-status";
import {
  TENANT_ACTIVITY_KIND_LABELS,
  type TenantActivityEventKind,
} from "@/lib/constants/tenant-activity";

export type { TenantActivityEventKind } from "@/lib/constants/tenant-activity";
import { COI_STATUS_LABELS } from "@/lib/services/version-labels";
import { prisma } from "@/lib/prisma";
import { withDbRetry } from "@/lib/utils/db-retry";

export interface TenantActivityEvent {
  id: string;
  kind: TenantActivityEventKind;
  timestamp: string;
  title: string;
  description: string;
  versionNumber: number;
  coiDocumentId: string;
  coiVersionId: string;
  fileName?: string;
  meta?: Record<string, string | number | boolean | null>;
}

export interface TenantSummary {
  id: string;
  email: string;
  displayName: string | null;
  versionCount: number;
  emailCount: number;
  lastActivityAt: string | null;
  latestVersionNumber: number | null;
  latestStatus: string | null;
}

export interface TenantActivityDetail {
  sender: {
    id: string;
    email: string;
    displayName: string | null;
    createdAt: string;
  };
  summary: {
    versionCount: number;
    emailSentCount: number;
    emailFailedCount: number;
    acceptedCount: number;
    rejectedCount: number;
  };
  events: TenantActivityEvent[];
  versions: Array<{
    id: string;
    versionNumber: number;
    status: string;
    coiDocumentId: string;
    fileName: string;
    createdAt: string;
    emailCount: number;
    agentStepCount: number;
  }>;
}

type VersionBundle = CoiVersion & {
  coiDocument: CoiDocument;
  jobs: CoiJob[];
  aiRuns: (AiRun & { steps: AgentStep[] })[];
  outboundEmails: OutboundEmail[];
};

function templateLabel(key: string): string {
  return (EMAIL_TEMPLATE_LABELS as Record<string, string>)[key] ?? key.replace(/_/g, " ");
}

function pushEvent(
  events: TenantActivityEvent[],
  event: Omit<TenantActivityEvent, "id"> & { id?: string }
) {
  events.push({
    ...event,
    id: event.id ?? `${event.kind}-${event.timestamp}-${events.length}`,
  });
}

function buildEventsFromVersion(version: VersionBundle): TenantActivityEvent[] {
  const events: TenantActivityEvent[] = [];
  const base = {
    versionNumber: version.versionNumber,
    coiDocumentId: version.coiDocumentId,
    coiVersionId: version.id,
    fileName: version.coiDocument.fileName,
  };

  pushEvent(events, {
    kind: "coi_uploaded",
    timestamp: version.coiDocument.createdAt.toISOString(),
    title: `COI v${version.versionNumber} uploaded`,
    description: `${version.coiDocument.fileName} via ${version.coiDocument.intakeSource.toLowerCase()}`,
    ...base,
    meta: {
      intakeSource: version.coiDocument.intakeSource,
      mimeType: version.coiDocument.mimeType,
      fileSizeBytes: version.coiDocument.fileSizeBytes,
    },
  });

  for (const job of version.jobs) {
    pushEvent(events, {
      kind: "job_update",
      timestamp: job.updatedAt.toISOString(),
      title: `Job ${JOB_STATUS_LABELS[job.status]}`,
      description: `BullMQ ${job.type.replace(/_/g, " ").toLowerCase()} — ${job.status}`,
      ...base,
      meta: {
        jobId: job.id,
        jobStatus: job.status,
        failureReason: job.failureReason,
      },
    });

    if (job.createdAt.getTime() !== job.updatedAt.getTime()) {
      pushEvent(events, {
        kind: "job_update",
        timestamp: job.createdAt.toISOString(),
        title: "Job queued",
        description: `Processing queued for v${version.versionNumber}`,
        ...base,
        meta: { jobId: job.id, jobStatus: "QUEUED" },
      });
    }
  }

  for (const run of version.aiRuns) {
    pushEvent(events, {
      kind: "ai_run",
      timestamp: run.startedAt.toISOString(),
      title: `AI run started`,
      description: `Pipeline run for v${version.versionNumber}`,
      ...base,
      meta: { aiRunId: run.id, status: run.status },
    });

    for (const step of run.steps) {
      const failed = step.guardrailPassed === false || Boolean(step.tripwireReason);
      pushEvent(events, {
        kind: "agent_step",
        timestamp: step.createdAt.toISOString(),
        title: step.agentName ?? step.kind,
        description: failed
          ? (step.tripwireReason ?? "Agent step failed")
          : step.modelUsed
            ? `Completed (${step.modelUsed}, ${step.durationMs ?? 0}ms)`
            : "Step recorded",
        ...base,
        meta: {
          stepOrder: step.stepOrder,
          agentName: step.agentName,
          guardrailPassed: step.guardrailPassed,
          tripwireReason: step.tripwireReason,
        },
      });
    }

    if (run.completedAt) {
      pushEvent(events, {
        kind: "ai_run",
        timestamp: run.completedAt.toISOString(),
        title: `AI run ${run.status.replace(/_/g, " ").toLowerCase()}`,
        description: run.exitReason ?? run.suggestedTemplate ?? "Pipeline finished",
        ...base,
        meta: {
          aiRunId: run.id,
          status: run.status,
          suggestedTemplate: run.suggestedTemplate,
        },
      });
    }
  }

  for (const email of version.outboundEmails) {
    const kind =
      email.status === "SENT"
        ? "email_sent"
        : email.status === "FAILED"
          ? "email_failed"
          : "email_sent";
    const title =
      email.status === "SENT"
        ? `Email sent — ${templateLabel(email.templateKey)}`
        : email.status === "FAILED"
          ? `Email failed — ${templateLabel(email.templateKey)}`
          : `Email queued — ${templateLabel(email.templateKey)}`;

    pushEvent(events, {
      kind,
      timestamp: (email.sentAt ?? email.createdAt).toISOString(),
      title,
      description: email.subject,
      ...base,
      meta: {
        templateKey: email.templateKey,
        toEmail: email.toEmail,
        status: email.status,
        errorMessage: email.errorMessage,
      },
    });
  }

  if (version.status === "ACCEPTED") {
    pushEvent(events, {
      kind: "version_accepted",
      timestamp: version.updatedAt.toISOString(),
      title: `COI v${version.versionNumber} accepted`,
      description: COI_STATUS_LABELS.ACCEPTED,
      ...base,
    });
  }

  if (version.status === "REJECTED") {
    pushEvent(events, {
      kind: "version_rejected",
      timestamp: version.updatedAt.toISOString(),
      title: `COI v${version.versionNumber} rejected`,
      description: version.rejectionReason ?? COI_STATUS_LABELS.REJECTED,
      ...base,
      meta: { rejectionReason: version.rejectionReason },
    });
  }

  return events;
}

function sortEvents(events: TenantActivityEvent[]): TenantActivityEvent[] {
  return [...events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export async function listTenantSummaries(): Promise<TenantSummary[]> {
  return withDbRetry(async () => {
    const senders = await prisma.sender.findMany({
      include: {
        versions: {
          include: {
            outboundEmails: { where: { status: "SENT" } },
            coiDocument: { select: { createdAt: true } },
          },
          orderBy: { versionNumber: "desc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const summaries = senders.map((sender) => {
      const emailCount = sender.versions.reduce(
        (sum, v) => sum + v.outboundEmails.length,
        0
      );
      const latest = sender.versions[0];
      const lastActivity = sender.versions.reduce<Date | null>((latestDate, v) => {
        const candidates = [
          v.updatedAt,
          v.createdAt,
          v.coiDocument.createdAt,
        ];
        const max = candidates.reduce(
          (m, d) => (d > m ? d : m),
          latestDate ?? v.updatedAt
        );
        return !latestDate || max > latestDate ? max : latestDate;
      }, null);

      return {
        id: sender.id,
        email: sender.email,
        displayName: sender.displayName,
        versionCount: sender.versions.length,
        emailCount,
        lastActivityAt: lastActivity?.toISOString() ?? null,
        latestVersionNumber: latest?.versionNumber ?? null,
        latestStatus: latest?.status ?? null,
      };
    });

    return summaries.sort((a, b) => {
      const aTime = a.lastActivityAt ? new Date(a.lastActivityAt).getTime() : 0;
      const bTime = b.lastActivityAt ? new Date(b.lastActivityAt).getTime() : 0;
      return bTime - aTime;
    });
  }, { label: "list tenant summaries" });
}

export async function getTenantActivityBySenderId(
  senderId: string
): Promise<TenantActivityDetail | null> {
  return withDbRetry(async () => {
    const sender = await prisma.sender.findUnique({
      where: { id: senderId },
      include: {
        versions: {
          include: {
            coiDocument: true,
            jobs: { orderBy: { createdAt: "asc" } },
            aiRuns: {
              include: { steps: { orderBy: { stepOrder: "asc" } } },
              orderBy: { startedAt: "asc" },
            },
            outboundEmails: { orderBy: { createdAt: "asc" } },
          },
          orderBy: { versionNumber: "asc" },
        },
      },
    });

    if (!sender) return null;

    const allEvents: TenantActivityEvent[] = [];
    for (const version of sender.versions) {
      allEvents.push(...buildEventsFromVersion(version as VersionBundle));
    }

    const emailSentCount = sender.versions.reduce(
      (n, v) => n + v.outboundEmails.filter((e) => e.status === "SENT").length,
      0
    );
    const emailFailedCount = sender.versions.reduce(
      (n, v) => n + v.outboundEmails.filter((e) => e.status === "FAILED").length,
      0
    );

    return {
      sender: {
        id: sender.id,
        email: sender.email,
        displayName: sender.displayName,
        createdAt: sender.createdAt.toISOString(),
      },
      summary: {
        versionCount: sender.versions.length,
        emailSentCount,
        emailFailedCount,
        acceptedCount: sender.versions.filter((v) => v.status === "ACCEPTED").length,
        rejectedCount: sender.versions.filter((v) => v.status === "REJECTED").length,
      },
      events: sortEvents(allEvents),
      versions: sender.versions.map((v) => ({
        id: v.id,
        versionNumber: v.versionNumber,
        status: v.status,
        coiDocumentId: v.coiDocumentId,
        fileName: v.coiDocument.fileName,
        createdAt: v.createdAt.toISOString(),
        emailCount: v.outboundEmails.length,
        agentStepCount: v.aiRuns.reduce((n, r) => n + r.steps.length, 0),
      })),
    };
  }, { label: "get tenant activity" });
}

export async function getTenantActivityByEmail(
  email: string
): Promise<TenantActivityDetail | null> {
  const sender = await prisma.sender.findUnique({ where: { email: email.toLowerCase() } });
  if (!sender) return null;
  return getTenantActivityBySenderId(sender.id);
}

export async function getDocumentActivityEvents(
  coiDocumentId: string
): Promise<TenantActivityEvent[]> {
  return withDbRetry(async () => {
    const version = await prisma.coiVersion.findUnique({
      where: { coiDocumentId },
      include: {
        coiDocument: true,
        jobs: { orderBy: { createdAt: "asc" } },
        aiRuns: {
          include: { steps: { orderBy: { stepOrder: "asc" } } },
          orderBy: { startedAt: "asc" },
        },
        outboundEmails: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!version) return [];
    return sortEvents(buildEventsFromVersion(version as VersionBundle));
  }, { label: "get document activity" });
}

export function getActivityKindLabel(kind: TenantActivityEventKind): string {
  return TENANT_ACTIVITY_KIND_LABELS[kind];
}

export async function resolveSenderIdForDocument(
  coiDocumentId: string
): Promise<{ senderId: string; senderEmail: string } | null> {
  const version = await prisma.coiVersion.findUnique({
    where: { coiDocumentId },
    include: { sender: true },
  });
  if (!version) return null;
  return { senderId: version.senderId, senderEmail: version.sender.email };
}
