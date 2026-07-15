import type { DlqEntry } from "@/lib/dlq/redis-dlq";

export function extractErrorDetails(error: unknown): {
  message: string;
  stack?: string;
  name?: string;
} {
  if (error instanceof Error) {
    return {
      message: error.message || error.name || "Unknown error",
      stack: error.stack,
      name: error.name,
    };
  }

  if (typeof error === "object" && error !== null) {
    const record = error as Record<string, unknown>;
    const message =
      typeof record.message === "string" && record.message.trim()
        ? record.message
        : typeof record.error === "string"
          ? record.error
          : JSON.stringify(error);
    const stack = typeof record.stack === "string" ? record.stack : undefined;
    const name = typeof record.name === "string" ? record.name : undefined;
    return { message, stack, name };
  }

  return { message: String(error ?? "Unknown error") };
}

/**
 * Normalize Inngest onFailure args (v4 function.failed payload shapes vary).
 */
export function extractInngestFailureContext(input: {
  error: unknown;
  event: { data?: unknown };
}): {
  eventName: string;
  payload: Record<string, unknown>;
  executionId: string;
  functionId?: string;
  errorMessage: string;
  stack?: string;
  errorName?: string;
} {
  const root =
    input.event && typeof input.event === "object"
      ? ((input.event as { data?: unknown }).data ?? {})
      : {};
  const data = (typeof root === "object" && root !== null ? root : {}) as Record<
    string,
    unknown
  >;

  const originalRaw = data.event;
  const original =
    typeof originalRaw === "object" && originalRaw !== null
      ? (originalRaw as Record<string, unknown>)
      : {};

  const payloadRaw = original.data;
  const payload =
    typeof payloadRaw === "object" && payloadRaw !== null
      ? (payloadRaw as Record<string, unknown>)
      : {};

  const eventName =
    (typeof original.name === "string" && original.name) ||
    (typeof data.event_name === "string" && data.event_name) ||
    "unknown";

  const executionId =
    (typeof data.run_id === "string" && data.run_id) ||
    (typeof data.runId === "string" && data.runId) ||
    "unknown-run";

  const functionId =
    (typeof data.function_id === "string" && data.function_id) ||
    (typeof data.functionId === "string" && data.functionId) ||
    undefined;

  const fromArg = extractErrorDetails(input.error);
  const fromEvent = extractErrorDetails(data.error);
  const message =
    fromArg.message && fromArg.message !== "Unknown error"
      ? fromArg.message
      : fromEvent.message;
  const stack = fromArg.stack ?? fromEvent.stack;
  const errorName = fromArg.name ?? fromEvent.name;

  return {
    eventName,
    payload,
    executionId,
    functionId,
    errorMessage: message,
    stack,
    errorName,
  };
}

export function buildFailureReason(input: {
  message: string;
  executionId?: string;
  attempt?: number;
  maxAttempts?: number;
}): string {
  const parts = [input.message.trim() || "Job failed"];
  if (input.executionId && input.executionId !== "unknown-run") {
    parts.push(`run=${input.executionId}`);
  }
  if (typeof input.attempt === "number") {
    const max =
      typeof input.maxAttempts === "number"
        ? `/${input.maxAttempts}`
        : "";
    parts.push(`attempt=${input.attempt + 1}${max}`);
  }
  return parts.join(" | ").slice(0, 1900);
}

export function buildDlqMetadata(input: {
  functionId?: string;
  errorName?: string;
  attempt?: number;
  maxAttempts?: number;
  extra?: Record<string, unknown>;
}): NonNullable<DlqEntry["metadata"]> {
  return {
    ...(input.functionId ? { functionId: input.functionId } : {}),
    ...(input.errorName ? { errorName: input.errorName } : {}),
    ...(typeof input.attempt === "number" ? { attempt: input.attempt } : {}),
    ...(typeof input.maxAttempts === "number"
      ? { maxAttempts: input.maxAttempts }
      : {}),
    ...(input.extra ?? {}),
  };
}
