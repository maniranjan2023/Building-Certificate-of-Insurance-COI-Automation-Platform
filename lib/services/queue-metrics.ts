import type { Queue } from "bullmq";
import { getEnv } from "@/lib/env";
import { getCoiDlqQueue, getCoiQueue } from "@/lib/queue/coi-queue";
import { getReminderDlqQueue, getReminderQueue } from "@/lib/queue/reminder-queue";
import { prisma } from "@/lib/prisma";
import { JobStatus } from "@prisma/client";

export interface QueueCounts {
  queueName: string;
  waiting: number;
  active: number;
  delayed: number;
  failed: number;
  completed: number;
  paused: number;
}

export interface QueueMetricsSnapshot {
  generatedAt: string;
  queues: QueueCounts[];
  database: {
    queued: number;
    processing: number;
    failed: number;
    dlq: number;
    reminderDlq: number;
  };
}

async function readQueueCounts(queueName: string, queue: Queue): Promise<QueueCounts> {
  const counts = await queue.getJobCounts();

  return {
    queueName,
    waiting: counts.waiting ?? 0,
    active: counts.active ?? 0,
    delayed: counts.delayed ?? 0,
    failed: counts.failed ?? 0,
    completed: counts.completed ?? 0,
    paused: counts.paused ?? 0,
  };
}

export async function getQueueMetricsSnapshot(): Promise<QueueMetricsSnapshot> {
  const env = getEnv();

  const [coiJobs, coiDlq, reminderJobs, reminderDlq, dbQueued, dbProcessing, dbFailed, dbDlq, dbReminderDlq] =
    await Promise.all([
      readQueueCounts(env.BULLMQ_COI_QUEUE, getCoiQueue()),
      readQueueCounts(env.BULLMQ_COI_DLQ, getCoiDlqQueue()),
      readQueueCounts(env.BULLMQ_REMINDER_QUEUE, getReminderQueue()),
      readQueueCounts(env.BULLMQ_REMINDER_DLQ, getReminderDlqQueue()),
      prisma.coiJob.count({ where: { status: JobStatus.QUEUED } }),
      prisma.coiJob.count({ where: { status: JobStatus.PROCESSING } }),
      prisma.coiJob.count({ where: { status: JobStatus.FAILED } }),
      prisma.coiJob.count({
        where: {
          status: JobStatus.DLQ,
          NOT: { queueName: { contains: "reminder" } },
        },
      }),
      prisma.coiJob.count({
        where: {
          status: JobStatus.DLQ,
          queueName: { contains: "reminder" },
        },
      }),
    ]);

  return {
    generatedAt: new Date().toISOString(),
    queues: [coiJobs, coiDlq, reminderJobs, reminderDlq],
    database: {
      queued: dbQueued,
      processing: dbProcessing,
      failed: dbFailed,
      dlq: dbDlq,
      reminderDlq: dbReminderDlq,
    },
  };
}
