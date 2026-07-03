import { Worker } from "bullmq";
import { getEnv } from "@/lib/env";
import { handleExhaustedJobFailure } from "@/lib/queue/dlq-handler";
import { getQueueConnection } from "@/lib/queue/connection";
import {
  PROCESS_COI_JOB_NAME,
  type ProcessCoiJobData,
} from "@/lib/queue/coi-queue";
import {
  handleProcessCoiJob,
  markJobProcessing,
} from "@/lib/workers/process-coi";

const WORKER_ID = `worker-${process.pid}`;

export function createCoiWorker(): Worker<ProcessCoiJobData> {
  const env = getEnv();
  const worker = new Worker<ProcessCoiJobData>(
    env.BULLMQ_COI_QUEUE,
    async (job) => {
      if (job.name !== PROCESS_COI_JOB_NAME) {
        throw new Error(`Unsupported job name: ${job.name}`);
      }

      console.log(
        `[${WORKER_ID}] processing job ${job.id} (forceFail=${Boolean(job.data.forceFail)}, attempt ${job.attemptsMade + 1}/${job.opts.attempts ?? env.JOB_MAX_ATTEMPTS})`
      );

      await markJobProcessing(job.data.coiJobId);
      await handleProcessCoiJob(job.data);
    },
    {
      connection: getQueueConnection(),
      concurrency: 1,
    }
  );

  worker.on("active", (job) => {
    console.log(`[${WORKER_ID}] active job ${job.id}`);
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
