import {
  ensureLogfireConfigured,
  getLogfireModule,
} from "@/lib/observability/configure-logfire.node";

export type SpanAttributes = Record<string, string | number | boolean | undefined>;

export async function withSpan<T>(
  name: string,
  attributes: SpanAttributes,
  fn: () => Promise<T>
): Promise<T> {
  const logfire = getLogfireModule();
  if (!logfire) {
    return fn();
  }

  const cleaned = Object.fromEntries(
    Object.entries(attributes).filter(([, value]) => value !== undefined)
  ) as Record<string, string | number | boolean>;

  return logfire.span(name, {
    attributes: cleaned,
    callback: fn,
  });
}

export function logInfo(message: string, attributes?: SpanAttributes): void {
  const logfire = getLogfireModule();
  if (!logfire) return;
  logfire.info(message, attributes);
}

export function logError(message: string, error: unknown, attributes?: SpanAttributes): void {
  const logfire = getLogfireModule();
  if (!logfire) return;
  logfire.error(message, {
    ...attributes,
    error: error instanceof Error ? error.message : String(error),
  });
}

export async function flushLogfire(): Promise<void> {
  if (!ensureLogfireConfigured()) return;
  const logfire = getLogfireModule();
  if (!logfire) return;
  await logfire.forceFlush({ timeoutMillis: 5000 });
}
