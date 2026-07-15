import { JobStatus } from "@prisma/client";
import { writeDlqEntry, type DlqEntry } from "@/lib/dlq/redis-dlq";
import {
  buildDlqMetadata,
  buildFailureReason,
  extractErrorDetails,
  extractInngestFailureContext,
} from "@/lib/dlq/failure-context";
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

/** Persist a mid-retry failure so the dashboard leaves "Processing". */
export async function recordAttemptFailure(input: {
  coiJobId: string;
  error: unknown;
  attempt: number;
  runId?: string;
  maxAttempts?: number;
}): Promise<void> {
  const details = extractErrorDetails(input.error);
  const failureReason = buildFailureReason({
    message: details.message,
    executionId: input.runId,
    attempt: input.attempt,
    maxAttempts: input.maxAttempts,
  });

  try {
    await updateCoiJobStatus(input.coiJobId, {
      status: JobStatus.FAILED,
      attempts: input.attempt + 1,
      failureReason,
    });
  } catch (error) {
    logError("job.attempt_failure_status_failed", error, {
      id: input.coiJobId,
    });
  }

  structuredLog({
    event: "inngest.job.attempt_failed",
    level: "error",
    coiJobId: input.coiJobId,
    attempt: input.attempt + 1,
    error: details.message,
    message: failureReason,
  });
}

export async function recordPermanentJobFailure(input: {
  error: unknown;
  event: { data?: unknown };
  maxAttempts?: number;
}): Promise<DlqEntry> {
  const ctx = extractInngestFailureContext({
    error: input.error,
    event: input.event,
  });

  const maxAttempts =
    input.maxAttempts ?? Number(process.env.JOB_MAX_ATTEMPTS ?? "5");

  const coiJobId =
    typeof ctx.payload.coiJobId === "string"
      ? ctx.payload.coiJobId
      : `unknown-${ctx.executionId}`;

  const failureReason = buildFailureReason({
    message: ctx.errorMessage,
    executionId: ctx.executionId,
    attempt: Math.max(0, maxAttempts - 1),
    maxAttempts,
  });

  const entry: DlqEntry = {
    id: coiJobId,
    eventName: ctx.eventName,
    payload: ctx.payload,
    error: failureReason,
    stack: ctx.stack,
    failedAt: new Date().toISOString(),
    retryCount: maxAttempts,
    executionId: ctx.executionId,
    metadata: buildDlqMetadata({
      functionId: ctx.functionId,
      errorName: ctx.errorName,
      maxAttempts,
      extra: {
        rawError: ctx.errorMessage,
        eventName: ctx.eventName,
      },
    }),
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
      failureReason,
      dlqJobId: entry.id,
      attempts: maxAttempts,
    });
  } catch (error) {
    logError("dlq.db_status_failed", error, { id: entry.id });
  }

  if (ctx.eventName === "coi/process.requested") {
    const processPayload = toProcessCoiPayload(ctx.payload);
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
