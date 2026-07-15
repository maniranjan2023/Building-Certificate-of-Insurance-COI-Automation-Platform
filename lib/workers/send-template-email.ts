import { JobStatus } from "@prisma/client";
import type { SendTemplateEmailJobData } from "@/lib/jobs/types";
import { sendTemplatedEmail } from "@/lib/services/email-send";
import { updateCoiJobStatus } from "@/lib/services/jobs";
import { prisma } from "@/lib/prisma";

export async function markEmailJobProcessing(coiJobId: string): Promise<void> {
  const existing = await prisma.coiJob.findUnique({ where: { id: coiJobId } });
  await updateCoiJobStatus(coiJobId, {
    status: JobStatus.PROCESSING,
    attempts: (existing?.attempts ?? 0) + 1,
  });
}

export async function handleSendTemplateEmailJob(
  data: SendTemplateEmailJobData
): Promise<void> {
  const version = await prisma.coiVersion.findUnique({
    where: { id: data.coiVersionId },
    include: { sender: true },
  });

  if (!version) {
    throw new Error(`CoiVersion ${data.coiVersionId} not found for email job.`);
  }

  await sendTemplatedEmail({
    version,
    templateKey: data.templateKey,
    toEmail: data.toEmail,
    customBody: data.customBody,
    customSubject: data.customSubject,
    rejectionReason: data.rejectionReason,
    replyToMessageId: data.agentMailMessageId,
    inboxId: data.agentMailInboxId,
  });

  await updateCoiJobStatus(data.coiJobId, {
    status: JobStatus.READY_FOR_REVIEW,
    failureReason: null,
  });
}
