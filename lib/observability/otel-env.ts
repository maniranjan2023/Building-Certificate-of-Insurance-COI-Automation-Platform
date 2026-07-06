import { getLogfireToken } from "@/lib/env";

/** Set OTLP exporter env vars for @vercel/otel → Logfire (no logfire-node import). */
export function applyLogfireOtelEnv(): boolean {
  const token = getLogfireToken();
  if (!token) {
    return false;
  }

  const endpoint =
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT?.trim() ||
    "https://logfire-api.pydantic.dev";

  process.env.OTEL_EXPORTER_OTLP_ENDPOINT = endpoint;
  process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT =
    process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT?.trim() ||
    `${endpoint.replace(/\/$/, "")}/v1/traces`;
  process.env.OTEL_EXPORTER_OTLP_HEADERS =
    process.env.OTEL_EXPORTER_OTLP_HEADERS?.trim() ||
    `Authorization=${token}`;

  return true;
}
