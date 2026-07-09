import { Worker } from "bullmq";
import { getEnv } from "@/lib/env";
import { handleExhaustedReminderJobFailure } from "@/lib/queue/reminder-dlq-handler";
import { getQueueConnection } from "@/lib/queue/connection";
import {
  getReminderWorkerLimiter,
  getWorkerBackoffSettings,
} from "@/lib/queue/job-options";
import {
  SEND_REMINDER_JOB_NAME,
  type SendReminderJobData,
} from "@/lib/queue/reminder-queue";
import { structuredLog } from "@/lib/observability/structured-log";
import {
  handleSendReminderJob,
  markReminderJobProcessing,
} from "@/lib/workers/send-reminder";

const WORKER_ID = `reminder-worker-${process.pid}`;

export function createReminderWorker(): Worker<SendReminderJobData> {
  const env = getEnv();
  const worker = new Worker<SendReminderJobData>(
    env.BULLMQ_REMINDER_QUEUE,
    async (job) => {
      if (job.name !== SEND_REMINDER_JOB_NAME) {
        throw new Error(`Unsupported reminder job name: ${job.name}`);
      }

      const data = job.data;
      const started = Date.now();
      const maxAttempts = job.opts.attempts ?? env.JOB_MAX_ATTEMPTS;

      structuredLog({
        event: "reminder.job.started",
        workerId: WORKER_ID,
        bullmqJobId: job.id,
        coiJobId: data.coiJobId,
        coiDocumentId: data.coiDocumentId,
        coiVersionId: data.coiVersionId,
        daysBefore: data.daysBefore,
        queueName: env.BULLMQ_REMINDER_QUEUE,
        attempt: job.attemptsMade + 1,
        maxAttempts,
      });

      await markReminderJobProcessing(data.coiJobId);
      await handleSendReminderJob(data);

      structuredLog({
        event: "reminder.job.completed",
        workerId: WORKER_ID,
        bullmqJobId: job.id,
        coiJobId: data.coiJobId,
        coiDocumentId: data.coiDocumentId,
        coiVersionId: data.coiVersionId,
        daysBefore: data.daysBefore,
        durationMs: Date.now() - started,
      });
    },
    {
      connection: getQueueConnection(),
      concurrency: env.WORKER_REMINDER_CONCURRENCY,
      limiter: getReminderWorkerLimiter(),
      settings: getWorkerBackoffSettings(),
    }
  );

  worker.on("failed", async (job, error) => {
    if (!job) return;

    const maxAttempts = job.opts.attempts ?? env.JOB_MAX_ATTEMPTS;
    structuredLog({
      event: "reminder.job.failed",
      level: "error",
      workerId: WORKER_ID,
      bullmqJobId: job.id,
      coiJobId: job.data.coiJobId,
      coiDocumentId: job.data.coiDocumentId,
      daysBefore: job.data.daysBefore,
      attempt: job.attemptsMade,
      maxAttempts,
      error: error.message,
    });

    try {
      await handleExhaustedReminderJobFailure(job, error, env.JOB_MAX_ATTEMPTS);
      if (job.attemptsMade >= maxAttempts) {
        structuredLog({
          event: "reminder.job.dlq",
          level: "warn",
          workerId: WORKER_ID,
          bullmqJobId: job.id,
          coiJobId: job.data.coiJobId,
          coiDocumentId: job.data.coiDocumentId,
          daysBefore: job.data.daysBefore,
        });
      }
    } catch (handlerError) {
      structuredLog({
        event: "reminder.job.failure_handler_error",
        level: "error",
        workerId: WORKER_ID,
        bullmqJobId: job.id,
        error:
          handlerError instanceof Error ? handlerError.message : "Unknown handler error",
      });
    }
  });

  return worker;
}
