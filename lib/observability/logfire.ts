/** Next.js-safe logging — no @pydantic/logfire-node (uses node:fs). Traces go via @vercel/otel. */

export type SpanAttributes = Record<string, string | number | boolean | undefined>;

export async function withSpan<T>(
  name: string,
  attributes: SpanAttributes,
  fn: () => Promise<T>
): Promise<T> {
  return fn();
}

export function logInfo(message: string, attributes?: SpanAttributes): void {
  if (attributes && Object.keys(attributes).length > 0) {
    console.log(`[logfire] ${message}`, attributes);
  } else {
    console.log(`[logfire] ${message}`);
  }
}

export function logError(message: string, error: unknown, attributes?: SpanAttributes): void {
  console.error(`[logfire] ${message}`, {
    ...attributes,
    error: error instanceof Error ? error.message : String(error),
  });
}

export async function flushLogfire(): Promise<void> {
  // No-op in Next.js — OTLP export is handled by @vercel/otel.
}
