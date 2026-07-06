import type { Job } from "bullmq";
import { JobStatus } from "@prisma/client";
import {
  PROCESS_COI_JOB_NAME,
  getCoiDlqQueue,
  type ProcessCoiJobData,
} from "@/lib/queue/coi-queue";
import { updateCoiJobStatus } from "@/lib/services/jobs";
import { notifyProcessingErrorForJob } from "@/lib/workers/process-coi";

function getMaxAttempts(job: Job<ProcessCoiJobData>, fallback: number): number {
  const attempts = job.opts.attempts ?? fallback;
  return typeof attempts === "number" ? attempts : Number(attempts);
}

/**
 * BullMQ failed-event handler: after all retries are exhausted, copy the job
 * to the DLQ queue and mark the CoiJob row as DLQ.
 * @see https://docs.bullmq.io/guide/workers
 * @see https://docs.bullmq.io/guide/retrying-failing-jobs
 */
export async function handleExhaustedJobFailure(
  job: Job<ProcessCoiJobData>,
  error: Error,
  fallbackMaxAttempts: number
): Promise<void> {
  if (job.name !== PROCESS_COI_JOB_NAME) {
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

  const dlqQueue = getCoiDlqQueue();
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

  await notifyProcessingErrorForJob(job.data);
}
