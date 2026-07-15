import { JobStatus, JobType, type CoiJob, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { inngest } from "@/inngest/client";
import {
  processCoiRequested,
  sendReminderRequested,
  sendTemplateEmailRequested,
} from "@/inngest/events";
import {
  INNGEST_COI_QUEUE,
  type EnqueueProcessCoiOptions,
} from "@/lib/jobs/types";
import { isDlqTestMode } from "@/lib/env";
import { deleteDlqEntry, getDlqEntry } from "@/lib/dlq/redis-dlq";

export { JOB_STATUS_LABELS } from "@/lib/constants/job-status";

export interface SendTemplateEmailEnqueueData {
  coiVersionId: string;
  coiDocumentId: string;
  templateKey: string;
  toEmail: string;
  customBody?: string;
  customSubject?: string;
  rejectionReason?: string;
  agentMailMessageId?: string;
  agentMailInboxId?: string;
}

export type CoiJobWithRelations = Prisma.CoiJobGetPayload<{
  include: {
    coiDocument: true;
    coiVersion: { include: { sender: true } };
  };
}>;

function firstEventId(result: { ids?: string[] }, fallback: string): string {
  return result.ids?.[0] ?? fallback;
}

export async function createProcessCoiJob(
  coiVersionId: string,
  coiDocumentId: string,
  options?: EnqueueProcessCoiOptions
): Promise<CoiJob> {
  const job = await prisma.coiJob.create({
    data: {
      coiVersionId,
      coiDocumentId,
      queueName: INNGEST_COI_QUEUE,
      type: JobType.PROCESS_COI,
      status: JobStatus.QUEUED,
    },
  });

  const forceFail = options?.forceFail ?? isDlqTestMode();
  const event = processCoiRequested.create({
    coiJobId: job.id,
    coiDocumentId,
    coiVersionId,
    ...(forceFail ? { forceFail: true } : {}),
    ...(options?.emailBodyText ? { emailBodyText: options.emailBodyText } : {}),
    ...(options?.agentMailMessageId
      ? { agentMailMessageId: options.agentMailMessageId }
      : {}),
    ...(options?.agentMailInboxId
      ? { agentMailInboxId: options.agentMailInboxId }
      : {}),
    ...(options?.senderEmail ? { senderEmail: options.senderEmail } : {}),
  });

  const result = await inngest.send(event);

  return prisma.coiJob.update({
    where: { id: job.id },
    data: { bullmqJobId: firstEventId(result, job.id) },
  });
}

export async function enqueueSendTemplateEmailJob(
  data: SendTemplateEmailEnqueueData
): Promise<CoiJob> {
  const job = await prisma.coiJob.create({
    data: {
      coiVersionId: data.coiVersionId,
      coiDocumentId: data.coiDocumentId,
      queueName: INNGEST_COI_QUEUE,
      type: JobType.SEND_TEMPLATE_EMAIL,
      status: JobStatus.QUEUED,
    },
  });

  const event = sendTemplateEmailRequested.create({
    coiJobId: job.id,
    coiVersionId: data.coiVersionId,
    coiDocumentId: data.coiDocumentId,
    templateKey: data.templateKey,
    toEmail: data.toEmail,
    ...(data.customBody ? { customBody: data.customBody } : {}),
    ...(data.customSubject ? { customSubject: data.customSubject } : {}),
    ...(data.rejectionReason ? { rejectionReason: data.rejectionReason } : {}),
    ...(data.agentMailMessageId
      ? { agentMailMessageId: data.agentMailMessageId }
      : {}),
    ...(data.agentMailInboxId
      ? { agentMailInboxId: data.agentMailInboxId }
      : {}),
  });

  const result = await inngest.send(event);

  return prisma.coiJob.update({
    where: { id: job.id },
    data: { bullmqJobId: firstEventId(result, job.id) },
  });
}

export async function enqueueSendReminderJob(
  coiJobId: string,
  data: {
    coiVersionId: string;
    coiDocumentId: string;
    daysBefore: number;
    toEmail: string;
  }
): Promise<string> {
  const event = sendReminderRequested.create(
    {
      coiJobId,
      coiVersionId: data.coiVersionId,
      coiDocumentId: data.coiDocumentId,
      daysBefore: data.daysBefore,
      toEmail: data.toEmail,
    },
    { id: `reminder-${data.coiDocumentId}-${data.daysBefore}` }
  );

  const result = await inngest.send(event);
  return firstEventId(result, coiJobId);
}

export async function enqueueSendReminderJobsBulk(
  jobs: Array<{
    coiJobId: string;
    coiVersionId: string;
    coiDocumentId: string;
    daysBefore: number;
    toEmail: string;
  }>
): Promise<string[]> {
  if (!jobs.length) return [];

  const events = jobs.map((job) =>
    sendReminderRequested.create(
      {
        coiJobId: job.coiJobId,
        coiVersionId: job.coiVersionId,
        coiDocumentId: job.coiDocumentId,
        daysBefore: job.daysBefore,
        toEmail: job.toEmail,
      },
      { id: `reminder-${job.coiDocumentId}-${job.daysBefore}` }
    )
  );

  const result = await inngest.send(events);
  const ids = result.ids ?? [];
  return jobs.map((job, index) => ids[index] ?? job.coiJobId);
}

export async function listCoiJobs(): Promise<CoiJobWithRelations[]> {
  return prisma.coiJob.findMany({
    include: {
      coiDocument: true,
      coiVersion: { include: { sender: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function listDlqJobs(
  filter?: "all" | "coi" | "reminder"
): Promise<CoiJobWithRelations[]> {
  const where =
    filter === "reminder"
      ? { status: JobStatus.DLQ, queueName: { contains: "reminder" } }
      : filter === "coi"
        ? {
            status: JobStatus.DLQ,
            NOT: { queueName: { contains: "reminder" } },
          }
        : { status: JobStatus.DLQ };

  return prisma.coiJob.findMany({
    where,
    include: {
      coiDocument: true,
      coiVersion: { include: { sender: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getCoiJobById(id: string): Promise<CoiJob | null> {
  return prisma.coiJob.findUnique({ where: { id } });
}

export async function updateCoiJobStatus(
  id: string,
  data: Pick<
    Prisma.CoiJobUpdateInput,
    "status" | "attempts" | "failureReason" | "dlqJobId" | "bullmqJobId"
  >
): Promise<CoiJob> {
  return prisma.coiJob.update({
    where: { id },
    data,
  });
}

export async function retryJobFromDlq(coiJobId: string): Promise<CoiJob> {
  const existing = await prisma.coiJob.findUnique({
    where: { id: coiJobId },
  });

  if (!existing) {
    throw new Error("Job not found.");
  }

  if (existing.status !== JobStatus.DLQ) {
    throw new Error("Only DLQ jobs can be retried.");
  }

  if (!existing.coiVersionId) {
    throw new Error("Job is missing coiVersionId.");
  }

  const dlqEntry = await getDlqEntry(coiJobId);
  const payload = dlqEntry?.payload ?? {};

  let eventId = existing.id;

  if (existing.type === JobType.SEND_REMINDER) {
    const version = await prisma.coiVersion.findUnique({
      where: { id: existing.coiVersionId },
      include: { sender: true, coiDocument: true },
    });

    if (!version) {
      throw new Error("COI version not found for reminder retry.");
    }

    const toEmail =
      (typeof payload.toEmail === "string" && payload.toEmail) ||
      version.coiDocument.senderEmail?.trim().toLowerCase() ||
      version.sender.email;
    const daysBefore =
      typeof payload.daysBefore === "number" && payload.daysBefore > 0
        ? payload.daysBefore
        : await resolveReminderDaysBefore(existing);

    eventId = await enqueueSendReminderJob(existing.id, {
      coiVersionId: existing.coiVersionId,
      coiDocumentId: existing.coiDocumentId,
      daysBefore,
      toEmail,
    });
  } else if (existing.type === JobType.SEND_TEMPLATE_EMAIL) {
    const templateKey =
      typeof payload.templateKey === "string" ? payload.templateKey : null;
    const toEmail = typeof payload.toEmail === "string" ? payload.toEmail : null;

    if (!templateKey || !toEmail) {
      throw new Error("DLQ payload missing templateKey/toEmail for email retry.");
    }

    const event = sendTemplateEmailRequested.create({
      coiJobId: existing.id,
      coiVersionId: existing.coiVersionId,
      coiDocumentId: existing.coiDocumentId,
      templateKey,
      toEmail,
      ...(typeof payload.customBody === "string"
        ? { customBody: payload.customBody }
        : {}),
      ...(typeof payload.customSubject === "string"
        ? { customSubject: payload.customSubject }
        : {}),
      ...(typeof payload.rejectionReason === "string"
        ? { rejectionReason: payload.rejectionReason }
        : {}),
      ...(typeof payload.agentMailMessageId === "string"
        ? { agentMailMessageId: payload.agentMailMessageId }
        : {}),
      ...(typeof payload.agentMailInboxId === "string"
        ? { agentMailInboxId: payload.agentMailInboxId }
        : {}),
    });
    const result = await inngest.send(event);
    eventId = firstEventId(result, existing.id);
  } else {
    const event = processCoiRequested.create({
      coiJobId: existing.id,
      coiDocumentId: existing.coiDocumentId,
      coiVersionId: existing.coiVersionId,
      forceFail: false,
      ...(typeof payload.emailBodyText === "string"
        ? { emailBodyText: payload.emailBodyText }
        : {}),
      ...(typeof payload.agentMailMessageId === "string"
        ? { agentMailMessageId: payload.agentMailMessageId }
        : {}),
      ...(typeof payload.agentMailInboxId === "string"
        ? { agentMailInboxId: payload.agentMailInboxId }
        : {}),
      ...(typeof payload.senderEmail === "string"
        ? { senderEmail: payload.senderEmail }
        : {}),
    });
    const result = await inngest.send(event);
    eventId = firstEventId(result, existing.id);
  }

  await deleteDlqEntry(coiJobId);

  return prisma.coiJob.update({
    where: { id: existing.id },
    data: {
      status: JobStatus.QUEUED,
      attempts: 0,
      failureReason: null,
      dlqJobId: null,
      bullmqJobId: eventId,
    },
  });
}

async function resolveReminderDaysBefore(job: CoiJob): Promise<number> {
  const log = await prisma.reminderLog.findFirst({
    where: { coiJobId: job.id },
    select: { daysBefore: true },
  });
  if (log) return log.daysBefore;
  return 30;
}

export async function dismissDlqJob(coiJobId: string): Promise<CoiJob> {
  const existing = await prisma.coiJob.findUnique({ where: { id: coiJobId } });

  if (!existing) {
    throw new Error("Job not found.");
  }

  if (existing.status !== JobStatus.DLQ) {
    throw new Error("Only DLQ jobs can be dismissed.");
  }

  await deleteDlqEntry(coiJobId);

  return prisma.coiJob.update({
    where: { id: existing.id },
    data: {
      status: JobStatus.FAILED,
      failureReason: `Dismissed by admin. ${existing.failureReason ?? ""}`.trim(),
      dlqJobId: null,
    },
  });
}

/** Remove Redis DLQ entries when a COI document is deleted. */
export async function removeCoiJobsFromQueues(
  jobs: Array<{ id: string; bullmqJobId: string | null; dlqJobId: string | null }>
): Promise<void> {
  for (const job of jobs) {
    await deleteDlqEntry(job.id).catch(() => undefined);
    if (job.dlqJobId && job.dlqJobId !== job.id) {
      await deleteDlqEntry(job.dlqJobId).catch(() => undefined);
    }
  }
}
