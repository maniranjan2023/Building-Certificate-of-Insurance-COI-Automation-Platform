import { JobStatus, JobType, type CoiJob, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  enqueueProcessCoiJob,
  enqueueSendTemplateEmailJob as queueSendTemplateEmail,
  type EnqueueProcessCoiOptions,
} from "@/lib/queue/coi-queue";
import { enqueueSendReminderJob, getReminderDlqQueue } from "@/lib/queue/reminder-queue";
import { getCoiDlqQueue } from "@/lib/queue/coi-queue";
import { isReminderQueue } from "@/lib/constants/job-type";
import { getEnv } from "@/lib/env";

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

export async function createProcessCoiJob(
  coiVersionId: string,
  coiDocumentId: string,
  options?: EnqueueProcessCoiOptions
): Promise<CoiJob> {
  const env = getEnv();
  const job = await prisma.coiJob.create({
    data: {
      coiVersionId,
      coiDocumentId,
      queueName: env.BULLMQ_COI_QUEUE,
      type: JobType.PROCESS_COI,
      status: JobStatus.QUEUED,
    },
  });

  const bullmqJobId = await enqueueProcessCoiJob(
    job.id,
    coiDocumentId,
    coiVersionId,
    options
  );

  return prisma.coiJob.update({
    where: { id: job.id },
    data: { bullmqJobId },
  });
}

export async function enqueueSendTemplateEmailJob(
  data: SendTemplateEmailEnqueueData
): Promise<CoiJob> {
  const env = getEnv();
  const job = await prisma.coiJob.create({
    data: {
      coiVersionId: data.coiVersionId,
      coiDocumentId: data.coiDocumentId,
      queueName: env.BULLMQ_COI_QUEUE,
      type: JobType.SEND_TEMPLATE_EMAIL,
      status: JobStatus.QUEUED,
    },
  });

  const bullmqJobId = await queueSendTemplateEmail(job.id, data);

  return prisma.coiJob.update({
    where: { id: job.id },
    data: { bullmqJobId },
  });
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

export async function listDlqJobs(filter?: "all" | "coi" | "reminder"): Promise<CoiJobWithRelations[]> {
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

  const bullmqJobId = `${existing.id}-retry-${Date.now()}`;

  if (existing.type === JobType.SEND_REMINDER) {
    const version = await prisma.coiVersion.findUnique({
      where: { id: existing.coiVersionId },
      include: { sender: true, coiDocument: true },
    });

    if (!version) {
      throw new Error("COI version not found for reminder retry.");
    }

    const toEmail =
      version.coiDocument.senderEmail?.trim().toLowerCase() ?? version.sender.email;
    const daysBefore = await resolveReminderDaysBefore(existing);

    const enqueuedId = await enqueueSendReminderJob(existing.id, {
      coiVersionId: existing.coiVersionId,
      coiDocumentId: existing.coiDocumentId,
      daysBefore,
      toEmail,
    });

    return prisma.coiJob.update({
      where: { id: existing.id },
      data: {
        status: JobStatus.QUEUED,
        attempts: 0,
        failureReason: null,
        dlqJobId: null,
        bullmqJobId: enqueuedId,
      },
    });
  }

  const enqueuedId = await enqueueProcessCoiJob(
    existing.id,
    existing.coiDocumentId,
    existing.coiVersionId,
    { forceFail: false, bullmqJobId }
  );

  return prisma.coiJob.update({
    where: { id: existing.id },
    data: {
      status: JobStatus.QUEUED,
      attempts: 0,
      failureReason: null,
      dlqJobId: null,
      bullmqJobId: enqueuedId,
    },
  });
}

async function resolveReminderDaysBefore(job: CoiJob): Promise<number> {
  if (job.dlqJobId) {
    try {
      const dlq = getReminderDlqQueue();
      const dlqJob = await dlq.getJob(job.dlqJobId);
      const daysBefore = dlqJob?.data?.daysBefore;
      if (typeof daysBefore === "number" && daysBefore > 0) {
        return daysBefore;
      }
    } catch {
      // Fall through to default.
    }
  }

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

  const dlq = isReminderQueue(existing.queueName)
    ? getReminderDlqQueue()
    : getCoiDlqQueue();

  const candidateIds = new Set(
    [existing.dlqJobId, `dlq-${existing.id}`].filter((value): value is string =>
      Boolean(value)
    )
  );

  for (const bullId of candidateIds) {
    try {
      const dead = await dlq.getJob(bullId);
      if (dead) await dead.remove();
    } catch {
      // DLQ entry may already be gone.
    }
  }

  return prisma.coiJob.update({
    where: { id: existing.id },
    data: {
      status: JobStatus.FAILED,
      failureReason: `Dismissed by admin. ${existing.failureReason ?? ""}`.trim(),
      dlqJobId: null,
    },
  });
}
