import { getEnv, getLogfireToken, shouldSendToLogfire } from "@/lib/env";
import { applyLogfireOtelEnv } from "@/lib/observability/otel-env";

type LogfireModule = typeof import("@pydantic/logfire-node");

let configured = false;
let loadFailed = false;
let logfireModule: LogfireModule | null = null;

function loadLogfireModule(): LogfireModule | null {
  if (loadFailed) {
    return null;
  }
  if (!logfireModule) {
    try {
      // Optional Node-only telemetrics. Never let ESM/CJS mismatches crash Inngest/Vercel.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      logfireModule = require("@pydantic/logfire-node") as LogfireModule;
    } catch (error) {
      loadFailed = true;
      console.warn(
        "[logfire] @pydantic/logfire-node unavailable — using console logging.",
        error instanceof Error ? error.message : error
      );
      return null;
    }
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
  if (!logfire) {
    return false;
  }

  try {
    logfire.configure({
      token,
      serviceName,
      environment: env.LOGFIRE_ENVIRONMENT,
      sendToLogfire: true,
      console: env.LOGFIRE_CONSOLE === "true",
    });
  } catch (error) {
    loadFailed = true;
    console.warn(
      "[logfire] configure failed — using console logging.",
      error instanceof Error ? error.message : error
    );
    return false;
  }

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
