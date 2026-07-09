import type { Job } from "bullmq";
import { JobStatus } from "@prisma/client";
import {
  SEND_REMINDER_JOB_NAME,
  getReminderDlqQueue,
  type SendReminderJobData,
} from "@/lib/queue/reminder-queue";
import { updateCoiJobStatus } from "@/lib/services/jobs";

function getMaxAttempts(job: Job<SendReminderJobData>, fallback: number): number {
  const attempts = job.opts.attempts ?? fallback;
  return typeof attempts === "number" ? attempts : Number(attempts);
}

export async function handleExhaustedReminderJobFailure(
  job: Job<SendReminderJobData>,
  error: Error,
  fallbackMaxAttempts: number
): Promise<void> {
  if (job.name !== SEND_REMINDER_JOB_NAME) {
    return;
  }

  const maxAttempts = getMaxAttempts(job, fallbackMaxAttempts);
  const attemptsMade = job.attemptsMade;

  if (attemptsMade < maxAttempts) {
    await updateCoiJobStatus(job.data.coiJobId, {
      status: JobStatus.FAILED,
      attempts: attemptsMade,
      failureReason: error.message,
    });
    return;
  }

  const dlqQueue = getReminderDlqQueue();
  const dlqJobId = `dlq-${job.data.coiJobId}`;

  const dlqJob = await dlqQueue.add(
    job.name,
    {
      ...job.data,
      originalBullmqJobId: job.id,
      failureReason: error.message,
      failedAt: new Date().toISOString(),
    },
    {
      jobId: dlqJobId,
      removeOnComplete: 100,
      removeOnFail: false,
    }
  );

  await updateCoiJobStatus(job.data.coiJobId, {
    status: JobStatus.DLQ,
    attempts: attemptsMade,
    failureReason: error.message,
    dlqJobId: dlqJob.id ?? dlqJobId,
  });
}
