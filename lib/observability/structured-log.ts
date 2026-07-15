import { logError, logInfo } from "@/lib/observability/logfire";

export type LogLevel = "info" | "warn" | "error";

export interface StructuredLogPayload {
  event: string;
  level?: LogLevel;
  coiDocumentId?: string;
  coiVersionId?: string;
  coiJobId?: string;
  bullmqJobId?: string;
  daysBefore?: number;
  queueName?: string;
  workerId?: string;
  durationMs?: number;
  attempt?: number;
  maxAttempts?: number;
  error?: string;
  message?: string;
  [key: string]: string | number | boolean | null | undefined;
}

function formatLine(payload: StructuredLogPayload): string {
  const { event, level = "info", ...rest } = payload;
  const fields = Object.entries(rest)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${key}=${value}`)
    .join(" ");
  return `[${level}] ${event}${fields ? ` ${fields}` : ""}`;
}

function toSpanAttributes(
  payload: Record<string, string | number | boolean | null | undefined>
): Record<string, string | number | boolean | undefined> {
  return Object.fromEntries(
    Object.entries(payload).filter(
      (entry): entry is [string, string | number | boolean] =>
        entry[1] !== undefined && entry[1] !== null
    )
  );
}

export function structuredLog(payload: StructuredLogPayload): void {
  const line = formatLine(payload);
  const { event, level = "info", error, ...attributes } = payload;
  const spanAttributes = toSpanAttributes(attributes);

  if (level === "error") {
    console.error(line);
    logError(event, { ...spanAttributes, ...(error ? { error } : {}) });
    return;
  }

  console.log(line);
  logInfo(event, spanAttributes);
}
