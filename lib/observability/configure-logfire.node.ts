import { getEnv, getLogfireToken, shouldSendToLogfire } from "@/lib/env";
import { applyLogfireOtelEnv } from "@/lib/observability/otel-env";

type LogfireModule = typeof import("@pydantic/logfire-node");

let configured = false;
let logfireModule: LogfireModule | null = null;

function loadLogfireModule(): LogfireModule {
  if (!logfireModule) {
    // Worker-only module — never import this from Next.js app code.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    logfireModule = require("@pydantic/logfire-node") as LogfireModule;
  }
  return logfireModule;
}

export function configureLogfire(options?: {
  serviceName?: string;
}): boolean {
  if (configured) {
    return true;
  }

  if (!shouldSendToLogfire()) {
    return false;
  }

  const token = getLogfireToken();
  if (!token) {
    console.warn("[logfire] LOGFIRE_TOKEN is missing — telemetry disabled.");
    return false;
  }

  const env = getEnv();
  const serviceName = options?.serviceName ?? env.LOGFIRE_SERVICE_NAME;

  applyLogfireOtelEnv();

  const logfire = loadLogfireModule();
  logfire.configure({
    token,
    serviceName,
    environment: env.LOGFIRE_ENVIRONMENT,
    sendToLogfire: true,
    console: env.LOGFIRE_CONSOLE === "true",
  });

  configured = true;
  console.log(`[logfire] configured → ${serviceName} (${env.LOGFIRE_ENVIRONMENT})`);
  return true;
}

export function ensureLogfireConfigured(options?: {
  serviceName?: string;
}): boolean {
  return configureLogfire(options);
}

export function getLogfireModule(): LogfireModule | null {
  if (!ensureLogfireConfigured()) {
    return null;
  }
  return logfireModule;
}
