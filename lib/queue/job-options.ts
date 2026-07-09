import type { JobsOptions, WorkerOptions } from "bullmq";
import { getEnv } from "@/lib/env";
import { createBackoffStrategy } from "@/lib/queue/backoff";

export function getDefaultJobOptions(): JobsOptions {
  const env = getEnv();
  return {
    attempts: env.JOB_MAX_ATTEMPTS,
    backoff: {
      type: "exponential",
      delay: env.JOB_BACKOFF_DELAY_MS,
    },
    removeOnComplete: 100,
    removeOnFail: false,
  };
}

/** Per-job options passed to Queue.add (BullMQ merges with queue defaults). */
export function getEnqueueJobOptions(jobId: string): JobsOptions {
  return {
    jobId,
    ...getDefaultJobOptions(),
  };
}

/** Worker-level jitter backoff to spread retries and avoid spikes. */
export function getWorkerBackoffSettings(): WorkerOptions["settings"] {
  return {
    backoffStrategy: createBackoffStrategy(),
  };
}

export function getReminderWorkerLimiter(): WorkerOptions["limiter"] {
  const env = getEnv();
  return {
    max: env.REMINDER_EMAIL_RATE_LIMIT_MAX,
    duration: env.REMINDER_EMAIL_RATE_LIMIT_MS,
  };
}
