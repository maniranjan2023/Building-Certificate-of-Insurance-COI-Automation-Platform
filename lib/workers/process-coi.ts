import { JobStatus } from "@prisma/client";
import { runCoiAiPipeline } from "@/lib/ai/pipeline";
import { isDlqTestMode } from "@/lib/env";
import type { ProcessCoiJobData } from "@/lib/queue/coi-queue";
import { sendAutoIntakeEmail } from "@/lib/services/intake-email";
import { enqueueSendTemplateEmailJob } from "@/lib/services/jobs";
import { updateCoiJobStatus } from "@/lib/services/jobs";
import { logError, logInfo } from "@/lib/observability/logfire.node";

function shouldForceFail(data: ProcessCoiJobData): boolean {
  if (data.forceFail === true) {
    return true;
  }
  return isDlqTestMode();
}

async function notifyProcessingError(data: ProcessCoiJobData): Promise<void> {
  const email = data.senderEmail?.trim();
  if (!email) {
    return;
  }

  try {
    await sendAutoIntakeEmail({
      template: "processing_error",
      to: email,
      context: { senderEmail: email },
      replyToMessageId: data.agentMailMessageId ?? undefined,
      inboxId: data.agentMailInboxId ?? undefined,
    });
  } catch (error) {
    logError("process-coi.processing_error_email_failed", error, {
      coiJobId: data.coiJobId,
    });
  }
}

async function notifyGuardrailBlockEmail(data: ProcessCoiJobData): Promise<void> {
  const email = data.senderEmail?.trim();
  if (!email || !data.coiVersionId) {
    return;
  }

  try {
    await enqueueSendTemplateEmailJob({
      coiVersionId: data.coiVersionId,
      coiDocumentId: data.coiDocumentId,
      templateKey: "guardrail_blocked",
      toEmail: email,
      agentMailMessageId: data.agentMailMessageId ?? undefined,
      agentMailInboxId: data.agentMailInboxId ?? undefined,
    });
    logInfo("process-coi.guardrail_email_queued", {
      coiJobId: data.coiJobId,
      to: email,
    });
  } catch (error) {
    logError("process-coi.guardrail_email_failed", error, {
      coiJobId: data.coiJobId,
    });
  }
}

export async function handleProcessCoiJob(
  data: ProcessCoiJobData
): Promise<void> {
  if (shouldForceFail(data)) {
    throw new Error("Forced failure for DLQ testing (forceFail enabled).");
  }

  try {
    const result = await runCoiAiPipeline(data);

    if (result.exitReason === "document_deleted") {
      return;
    }

    if (result.guardrailBlocked) {
      await notifyGuardrailBlockEmail(data);
      await updateCoiJobStatus(data.coiJobId, {
        status: JobStatus.READY_FOR_REVIEW,
        failureReason: result.exitReason ?? "Guardrail blocked automated review",
      });
      return;
    }

    await updateCoiJobStatus(data.coiJobId, {
      status: JobStatus.READY_FOR_REVIEW,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "COI processing failed";
    const isOcrOrParse =
      message.toLowerCase().includes("llamaparse") ||
      message.toLowerCase().includes("empty content") ||
      message.toLowerCase().includes("download coi");

    if (isOcrOrParse) {
      await notifyProcessingError(data);
    }

    throw error instanceof Error ? error : new Error(message);
  }
}

export async function markJobProcessing(coiJobId: string): Promise<void> {
  await updateCoiJobStatus(coiJobId, { status: JobStatus.PROCESSING });
}

export async function notifyProcessingErrorForJob(
  data: ProcessCoiJobData
): Promise<void> {
  await notifyProcessingError(data);
}
