import { Worker } from "bullmq";
import { getEnv } from "@/lib/env";
import { handleExhaustedJobFailure } from "@/lib/queue/dlq-handler";
import { getQueueConnection } from "@/lib/queue/connection";
import { getWorkerBackoffSettings } from "@/lib/queue/job-options";
import {
  PROCESS_COI_JOB_NAME,
  SEND_TEMPLATE_EMAIL_JOB_NAME,
  type CoiQueueJobData,
  type ProcessCoiJobData,
  type SendTemplateEmailJobData,
} from "@/lib/queue/coi-queue";
import {
  handleProcessCoiJob,
  markJobProcessing,
} from "@/lib/workers/process-coi";
import {
  handleSendTemplateEmailJob,
  markEmailJobProcessing,
} from "@/lib/workers/send-template-email";

const WORKER_ID = `worker-${process.pid}`;

export function createCoiWorker(): Worker<CoiQueueJobData> {
  const env = getEnv();
  const worker = new Worker<CoiQueueJobData>(
    env.BULLMQ_COI_QUEUE,
    async (job) => {
      if (job.name === PROCESS_COI_JOB_NAME) {
        const data = job.data as ProcessCoiJobData;
        console.log(
          `[${WORKER_ID}] processing ${job.name} ${job.id} (attempt ${job.attemptsMade + 1}/${job.opts.attempts ?? env.JOB_MAX_ATTEMPTS})`
        );
        await markJobProcessing(data.coiJobId);
        await handleProcessCoiJob(data);
        return;
      }

      if (job.name === SEND_TEMPLATE_EMAIL_JOB_NAME) {
        const data = job.data as SendTemplateEmailJobData;
        console.log(`[${WORKER_ID}] processing ${job.name} ${job.id}`);
        await markEmailJobProcessing(data.coiJobId);
        await handleSendTemplateEmailJob(data);
        return;
      }

      throw new Error(`Unsupported job name: ${job.name}`);
    },
    {
      connection: getQueueConnection(),
      concurrency: env.WORKER_COI_CONCURRENCY,
      settings: getWorkerBackoffSettings(),
    }
  );

  worker.on("active", (job) => {
    console.log(`[${WORKER_ID}] active job ${job.id} (${job.name})`);
  });

  worker.on("failed", async (job, error) => {
    if (!job) {
      return;
    }

    const maxAttempts = job.opts.attempts ?? env.JOB_MAX_ATTEMPTS;
    console.error(
      `[${WORKER_ID}] job ${job.id} failed (${job.attemptsMade}/${maxAttempts}):`,
      error.message
    );

    try {
      await handleExhaustedJobFailure(job, error, env.JOB_MAX_ATTEMPTS);

      if (job.attemptsMade >= maxAttempts) {
        console.log(`[${WORKER_ID}] job ${job.id} moved to DLQ`);
      }
    } catch (handlerError) {
      console.error(
        `[${WORKER_ID}] failed to handle job failure for ${job.id}:`,
        handlerError
      );
    }
  });

  return worker;
}
