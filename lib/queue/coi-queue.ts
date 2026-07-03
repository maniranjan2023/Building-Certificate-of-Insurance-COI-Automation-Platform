import { Queue } from "bullmq";
import { getEnv, isDlqTestMode } from "@/lib/env";
import { getQueueConnection } from "@/lib/queue/connection";
import { getDefaultJobOptions, getEnqueueJobOptions } from "@/lib/queue/job-options";

export const PROCESS_COI_JOB_NAME = "process-coi";

export interface ProcessCoiJobData {
  coiJobId: string;
  coiDocumentId: string;
  /** Set at enqueue when WORKER_FORCE_FAIL=true — survives worker restarts/retries */
  forceFail?: boolean;
}

let coiQueue: Queue | null = null;
let coiDlqQueue: Queue | null = null;

export function getCoiQueue(): Queue<ProcessCoiJobData> {
  if (!coiQueue) {
    const env = getEnv();
    coiQueue = new Queue<ProcessCoiJobData>(env.BULLMQ_COI_QUEUE, {
      connection: getQueueConnection(),
      defaultJobOptions: getDefaultJobOptions(),
    }) as Queue<ProcessCoiJobData>;
  }
  return coiQueue as Queue<ProcessCoiJobData>;
}

export function getCoiDlqQueue(): Queue<ProcessCoiJobData> {
  if (!coiDlqQueue) {
    const env = getEnv();
    coiDlqQueue = new Queue<ProcessCoiJobData>(env.BULLMQ_COI_DLQ, {
      connection: getQueueConnection(),
    }) as Queue<ProcessCoiJobData>;
  }
  return coiDlqQueue as Queue<ProcessCoiJobData>;
}

export async function enqueueProcessCoiJob(
  coiJobId: string,
  coiDocumentId: string,
  options?: { forceFail?: boolean; bullmqJobId?: string }
): Promise<string> {
  const forceFail = options?.forceFail ?? isDlqTestMode();
  const bullmqJobId = options?.bullmqJobId ?? coiJobId;
  const queue = getCoiQueue();
  const job = await queue.add(
    PROCESS_COI_JOB_NAME,
    {
      coiJobId,
      coiDocumentId,
      ...(forceFail ? { forceFail: true } : {}),
    },
    getEnqueueJobOptions(bullmqJobId)
  );

  if (forceFail) {
    console.log(
      `[queue] enqueued ${coiJobId} forceFail=true attempts=${getDefaultJobOptions().attempts}`
    );
  }

  return job.id ?? coiJobId;
}
