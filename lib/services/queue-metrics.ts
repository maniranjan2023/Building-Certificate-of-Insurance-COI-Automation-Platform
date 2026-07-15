import { JobStatus } from "@prisma/client";
import { countDlqEntries } from "@/lib/dlq/redis-dlq";
import { prisma } from "@/lib/prisma";

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
  redisDlqCount: number;
}

export async function getQueueMetricsSnapshot(): Promise<QueueMetricsSnapshot> {
  const [
    dbQueued,
    dbProcessing,
    dbFailed,
    dbDlq,
    dbReminderDlq,
    redisDlqCount,
  ] = await Promise.all([
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
    countDlqEntries().catch(() => 0),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    queues: [
      {
        queueName: "inngest",
        waiting: dbQueued,
        active: dbProcessing,
        delayed: 0,
        failed: dbFailed,
        completed: 0,
        paused: 0,
      },
      {
        queueName: "redis-dlq",
        waiting: 0,
        active: 0,
        delayed: 0,
        failed: redisDlqCount,
        completed: 0,
        paused: 0,
      },
    ],
    database: {
      queued: dbQueued,
      processing: dbProcessing,
      failed: dbFailed,
      dlq: dbDlq,
      reminderDlq: dbReminderDlq,
    },
    redisDlqCount,
  };
}
