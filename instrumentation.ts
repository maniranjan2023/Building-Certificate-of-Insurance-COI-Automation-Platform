import { registerOTel } from "@vercel/otel";
import { applyLogfireOtelEnv } from "@/lib/observability/otel-env";
import { getEnv, shouldSendToLogfire } from "@/lib/env";

export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") {
    return;
  }

  if (shouldSendToLogfire()) {
    applyLogfireOtelEnv();
  }

  const env = getEnv();
  registerOTel({
    serviceName: `${env.LOGFIRE_SERVICE_NAME}-nextjs`,
  });
}
