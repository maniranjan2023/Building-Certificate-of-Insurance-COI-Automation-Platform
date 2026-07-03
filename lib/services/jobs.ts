import { JobStatus, JobType, type CoiJob, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { enqueueProcessCoiJob } from "@/lib/queue/coi-queue";
import { getEnv } from "@/lib/env";

export { JOB_STATUS_LABELS } from "@/lib/constants/job-status";

export type CoiJobWithDocument = Prisma.CoiJobGetPayload<{
  include: { coiDocument: true };
}>;

export async function createProcessCoiJob(
  coiDocumentId: string
): Promise<CoiJob> {
  const env = getEnv();
  const job = await prisma.coiJob.create({
    data: {
      coiDocumentId,
      queueName: env.BULLMQ_COI_QUEUE,
      type: JobType.PROCESS_COI,
      status: JobStatus.QUEUED,
    },
  });

  const bullmqJobId = await enqueueProcessCoiJob(job.id, coiDocumentId);

  return prisma.coiJob.update({
    where: { id: job.id },
    data: { bullmqJobId },
  });
}

export async function listCoiJobs(): Promise<CoiJobWithDocument[]> {
  return prisma.coiJob.findMany({
    include: { coiDocument: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function listDlqJobs(): Promise<CoiJobWithDocument[]> {
  return prisma.coiJob.findMany({
    where: { status: JobStatus.DLQ },
    include: { coiDocument: true },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getCoiJobById(id: string): Promise<CoiJob | null> {
  return prisma.coiJob.findUnique({ where: { id } });
}

export async function updateCoiJobStatus(
  id: string,
  data: Pick<Prisma.CoiJobUpdateInput, "status" | "attempts" | "failureReason" | "dlqJobId" | "bullmqJobId">
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

  const bullmqJobId = `${existing.id}-retry-${Date.now()}`;
  const enqueuedId = await enqueueProcessCoiJob(
    existing.id,
    existing.coiDocumentId,
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
