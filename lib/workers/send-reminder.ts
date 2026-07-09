import { JobStatus } from "@prisma/client";
import type { SendReminderJobData } from "@/lib/queue/reminder-queue";
import { sendTemplatedEmail } from "@/lib/services/email-send";
import { updateCoiJobStatus } from "@/lib/services/jobs";
import { prisma } from "@/lib/prisma";

export async function markReminderJobProcessing(coiJobId: string): Promise<void> {
  const existing = await prisma.coiJob.findUnique({ where: { id: coiJobId } });
  await updateCoiJobStatus(coiJobId, {
    status: JobStatus.PROCESSING,
    attempts: (existing?.attempts ?? 0) + 1,
  });
}

export async function handleSendReminderJob(
  data: SendReminderJobData
): Promise<void> {
  const version = await prisma.coiVersion.findUnique({
    where: { id: data.coiVersionId },
    include: { sender: true },
  });

  if (!version) {
    throw new Error(`CoiVersion ${data.coiVersionId} not found for reminder job.`);
  }

  const existingLog = await prisma.reminderLog.findUnique({
    where: {
      coiDocumentId_daysBefore: {
        coiDocumentId: data.coiDocumentId,
        daysBefore: data.daysBefore,
      },
    },
  });

  if (existingLog) {
    await updateCoiJobStatus(data.coiJobId, {
      status: JobStatus.READY_FOR_REVIEW,
      failureReason: null,
    });
    return;
  }

  await sendTemplatedEmail({
    version,
    templateKey: "renewal_reminder",
    toEmail: data.toEmail,
  });

  await prisma.reminderLog.create({
    data: {
      coiDocumentId: data.coiDocumentId,
      coiVersionId: data.coiVersionId,
      daysBefore: data.daysBefore,
      coiJobId: data.coiJobId,
    },
  });

  await updateCoiJobStatus(data.coiJobId, {
    status: JobStatus.READY_FOR_REVIEW,
    failureReason: null,
  });
}
