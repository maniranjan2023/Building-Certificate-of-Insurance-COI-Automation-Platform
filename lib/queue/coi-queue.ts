import { Queue } from "bullmq";
import { getEnv, isDlqTestMode } from "@/lib/env";
import { getQueueConnection } from "@/lib/queue/connection";
import { getDefaultJobOptions, getEnqueueJobOptions } from "@/lib/queue/job-options";

export const PROCESS_COI_JOB_NAME = "process-coi";

export interface ProcessCoiJobData {
  coiJobId: string;
  coiDocumentId: string;
  coiVersionId: string;
  /** Set at enqueue when WORKER_FORCE_FAIL=true — survives worker restarts/retries */
  forceFail?: boolean;
  emailBodyText?: string | null;
  agentMailMessageId?: string | null;
  agentMailInboxId?: string | null;
  senderEmail?: string | null;
  originalBullmqJobId?: string;
  failureReason?: string;
  failedAt?: string;
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

export interface EnqueueProcessCoiOptions {
  forceFail?: boolean;
  bullmqJobId?: string;
  emailBodyText?: string | null;
  agentMailMessageId?: string | null;
  agentMailInboxId?: string | null;
  senderEmail?: string | null;
}

export async function enqueueProcessCoiJob(
  coiJobId: string,
  coiDocumentId: string,
  coiVersionId: string,
  options?: EnqueueProcessCoiOptions
): Promise<string> {
  const forceFail = options?.forceFail ?? isDlqTestMode();
  const bullmqJobId = options?.bullmqJobId ?? coiJobId;
  const queue = getCoiQueue();
  const job = await queue.add(
    PROCESS_COI_JOB_NAME,
    {
      coiJobId,
      coiDocumentId,
      coiVersionId,
      ...(forceFail ? { forceFail: true } : {}),
      ...(options?.emailBodyText ? { emailBodyText: options.emailBodyText } : {}),
      ...(options?.agentMailMessageId
        ? { agentMailMessageId: options.agentMailMessageId }
        : {}),
      ...(options?.agentMailInboxId
        ? { agentMailInboxId: options.agentMailInboxId }
        : {}),
      ...(options?.senderEmail ? { senderEmail: options.senderEmail } : {}),
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

/** Remove pending/active BullMQ jobs when a COI document is deleted. */
export async function removeCoiJobsFromQueues(
  jobs: Array<{ id: string; bullmqJobId: string | null; dlqJobId: string | null }>
): Promise<void> {
  if (!jobs.length) return;

  const queue = getCoiQueue();
  const dlq = getCoiDlqQueue();

  for (const job of jobs) {
    const candidateIds = new Set(
      [job.bullmqJobId, job.id, job.dlqJobId, `dlq-${job.id}`].filter(
        (value): value is string => Boolean(value)
      )
    );

    for (const bullId of candidateIds) {
      try {
        const active = await queue.getJob(bullId);
        if (active) await active.remove();
      } catch {
        // Queue entry may already be gone.
      }

      try {
        const dead = await dlq.getJob(bullId);
        if (dead) await dead.remove();
      } catch {
        // DLQ entry may already be gone.
      }
    }
  }
}
