import { computePlatformMetrics } from "@/lib/services/metrics";
import { jsonError, jsonOk } from "@/lib/api-response";

export async function GET() {
  try {
    const metrics = await computePlatformMetrics();
    return jsonOk(metrics);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load metrics.";
    return jsonError(message, 500);
  }
}
