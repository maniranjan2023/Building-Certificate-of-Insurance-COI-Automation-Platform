import { Queue } from "bullmq";
import { getEnv, isDlqTestMode } from "@/lib/env";
import { getQueueConnection } from "@/lib/queue/connection";
import { getDefaultJobOptions, getEnqueueJobOptions } from "@/lib/queue/job-options";

export const PROCESS_COI_JOB_NAME = "process-coi";
export const SEND_TEMPLATE_EMAIL_JOB_NAME = "send-template-email";

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

export interface SendTemplateEmailJobData {
  coiJobId: string;
  coiVersionId: string;
  coiDocumentId: string;
  templateKey: string;
  toEmail: string;
  customBody?: string;
  customSubject?: string;
  rejectionReason?: string;
  agentMailMessageId?: string | null;
  agentMailInboxId?: string | null;
}

export type CoiQueueJobData = ProcessCoiJobData | SendTemplateEmailJobData;

let coiQueue: Queue | null = null;
let coiDlqQueue: Queue | null = null;

export function getCoiQueue(): Queue<CoiQueueJobData> {
  if (!coiQueue) {
    const env = getEnv();
    coiQueue = new Queue<CoiQueueJobData>(env.BULLMQ_COI_QUEUE, {
      connection: getQueueConnection(),
      defaultJobOptions: getDefaultJobOptions(),
    }) as Queue<CoiQueueJobData>;
  }
  return coiQueue as Queue<CoiQueueJobData>;
}

export function getCoiDlqQueue(): Queue<CoiQueueJobData> {
  if (!coiDlqQueue) {
    const env = getEnv();
    coiDlqQueue = new Queue<CoiQueueJobData>(env.BULLMQ_COI_DLQ, {
      connection: getQueueConnection(),
    }) as Queue<CoiQueueJobData>;
  }
  return coiDlqQueue as Queue<CoiQueueJobData>;
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

export async function enqueueSendTemplateEmailJob(
  coiJobId: string,
  data: Omit<SendTemplateEmailJobData, "coiJobId">
): Promise<string> {
  const queue = getCoiQueue();
  const job = await queue.add(
    SEND_TEMPLATE_EMAIL_JOB_NAME,
    { coiJobId, ...data },
    getEnqueueJobOptions(coiJobId)
  );
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
