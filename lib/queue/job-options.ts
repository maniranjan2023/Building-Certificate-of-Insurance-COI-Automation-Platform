import type { JobsOptions } from "bullmq";
import { getEnv } from "@/lib/env";

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
