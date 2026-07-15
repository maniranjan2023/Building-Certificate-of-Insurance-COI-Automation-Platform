import { JobStatus } from "@prisma/client";
import { writeDlqEntry, type DlqEntry } from "@/lib/dlq/redis-dlq";
import { updateCoiJobStatus } from "@/lib/services/jobs";
import { notifyProcessingErrorForJob } from "@/lib/workers/process-coi";
import type { ProcessCoiJobData } from "@/lib/jobs/types";
import { logError, logInfo } from "@/lib/observability/logfire";
import { structuredLog } from "@/lib/observability/structured-log";

function toProcessCoiPayload(
  payload: Record<string, unknown>
): ProcessCoiJobData | null {
  if (
    typeof payload.coiJobId !== "string" ||
    typeof payload.coiDocumentId !== "string" ||
    typeof payload.coiVersionId !== "string"
  ) {
    return null;
  }

  return {
    coiJobId: payload.coiJobId,
    coiDocumentId: payload.coiDocumentId,
    coiVersionId: payload.coiVersionId,
    forceFail: typeof payload.forceFail === "boolean" ? payload.forceFail : undefined,
    emailBodyText:
      typeof payload.emailBodyText === "string" || payload.emailBodyText === null
        ? (payload.emailBodyText as string | null)
        : undefined,
    agentMailMessageId:
      typeof payload.agentMailMessageId === "string" ||
      payload.agentMailMessageId === null
        ? (payload.agentMailMessageId as string | null)
        : undefined,
    agentMailInboxId:
      typeof payload.agentMailInboxId === "string" ||
      payload.agentMailInboxId === null
        ? (payload.agentMailInboxId as string | null)
        : undefined,
    senderEmail:
      typeof payload.senderEmail === "string" || payload.senderEmail === null
        ? (payload.senderEmail as string | null)
        : undefined,
  };
}

export async function recordPermanentJobFailure(input: {
  eventName: string;
  payload: Record<string, unknown>;
  error: Error | { message?: string; name?: string; stack?: string };
  executionId: string;
  retryCount: number;
  metadata?: Record<string, unknown>;
}): Promise<DlqEntry> {
  const coiJobId =
    typeof input.payload.coiJobId === "string"
      ? input.payload.coiJobId
      : `unknown-${input.executionId}`;

  const errorMessage =
    input.error instanceof Error
      ? input.error.message
      : input.error.message ?? "Unknown error";
  const stack =
    input.error instanceof Error
      ? input.error.stack
      : typeof input.error.stack === "string"
        ? input.error.stack
        : undefined;

  const entry: DlqEntry = {
    id: coiJobId,
    eventName: input.eventName,
    payload: input.payload,
    error: errorMessage,
    stack,
    failedAt: new Date().toISOString(),
    retryCount: input.retryCount,
    executionId: input.executionId,
    metadata: input.metadata,
  };

  logInfo("inngest.job.permanent_failure", {
    id: entry.id,
    eventName: entry.eventName,
    executionId: entry.executionId,
    retryCount: entry.retryCount,
    error: entry.error,
    timestamp: entry.failedAt,
  });

  structuredLog({
    event: "inngest.job.permanent_failure",
    level: "error",
    coiJobId: entry.id,
    error: entry.error,
    message: `eventName=${entry.eventName} executionId=${entry.executionId} retryCount=${entry.retryCount} stack=${entry.stack ?? ""} payload=${JSON.stringify(entry.payload)}`,
  });

  try {
    await writeDlqEntry(entry);
  } catch (error) {
    logError("dlq.write_failed", error, { id: entry.id });
  }

  try {
    await updateCoiJobStatus(coiJobId, {
      status: JobStatus.DLQ,
      failureReason: errorMessage,
      dlqJobId: entry.id,
      attempts: input.retryCount,
    });
  } catch (error) {
    logError("dlq.db_status_failed", error, { id: entry.id });
  }

  if (input.eventName === "coi/process.requested") {
    const processPayload = toProcessCoiPayload(input.payload);
    if (processPayload) {
      try {
        await notifyProcessingErrorForJob(processPayload);
      } catch (error) {
        logError("dlq.processing_error_email_failed", error, { id: entry.id });
      }
    }
  }

  return entry;
}
