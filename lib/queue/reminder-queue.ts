import { Queue } from "bullmq";
import { getEnv } from "@/lib/env";
import { getQueueConnection } from "@/lib/queue/connection";
import { getDefaultJobOptions, getEnqueueJobOptions } from "@/lib/queue/job-options";

export const SEND_REMINDER_JOB_NAME = "send-reminder";

export interface SendReminderJobData {
  coiJobId: string;
  coiVersionId: string;
  coiDocumentId: string;
  daysBefore: number;
  toEmail: string;
  originalBullmqJobId?: string;
  failureReason?: string;
  failedAt?: string;
}

let reminderQueue: Queue | null = null;
let reminderDlqQueue: Queue | null = null;

export function getReminderQueue(): Queue<SendReminderJobData> {
  if (!reminderQueue) {
    const env = getEnv();
    reminderQueue = new Queue<SendReminderJobData>(env.BULLMQ_REMINDER_QUEUE, {
      connection: getQueueConnection(),
      defaultJobOptions: getDefaultJobOptions(),
    });
  }
  return reminderQueue as Queue<SendReminderJobData>;
}

export function getReminderDlqQueue(): Queue<SendReminderJobData> {
  if (!reminderDlqQueue) {
    const env = getEnv();
    reminderDlqQueue = new Queue<SendReminderJobData>(env.BULLMQ_REMINDER_DLQ, {
      connection: getQueueConnection(),
    });
  }
  return reminderDlqQueue as Queue<SendReminderJobData>;
}

/** Deterministic BullMQ job id — duplicate enqueue for same COI + window is ignored. */
export function buildReminderBullmqJobId(
  coiDocumentId: string,
  daysBefore: number
): string {
  return `reminder-${coiDocumentId}-${daysBefore}`;
}

export async function enqueueSendReminderJob(
  coiJobId: string,
  data: Omit<SendReminderJobData, "coiJobId">
): Promise<string> {
  const queue = getReminderQueue();
  const bullmqJobId = buildReminderBullmqJobId(data.coiDocumentId, data.daysBefore);
  const job = await queue.add(
    SEND_REMINDER_JOB_NAME,
    { coiJobId, ...data },
    {
      ...getEnqueueJobOptions(bullmqJobId),
      jobId: bullmqJobId,
    }
  );
  return job.id ?? bullmqJobId;
}

export async function enqueueSendReminderJobsBulk(
  jobs: Array<{ coiJobId: string } & Omit<SendReminderJobData, "coiJobId">>
): Promise<string[]> {
  if (!jobs.length) {
    return [];
  }

  const queue = getReminderQueue();
  const defaultOptions = getDefaultJobOptions();
  const added = await queue.addBulk(
    jobs.map((job) => {
      const bullmqJobId = buildReminderBullmqJobId(job.coiDocumentId, job.daysBefore);
      return {
        name: SEND_REMINDER_JOB_NAME,
        data: job,
        opts: {
          jobId: bullmqJobId,
          ...defaultOptions,
        },
      };
    })
  );

  return added.map(
    (job, index) =>
      job.id ??
      buildReminderBullmqJobId(jobs[index].coiDocumentId, jobs[index].daysBefore)
  );
}
