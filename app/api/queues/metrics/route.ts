import { getQueueMetricsSnapshot } from "@/lib/services/queue-metrics";
import { jsonError, jsonOk } from "@/lib/api-response";

export async function GET() {
  try {
    const metrics = await getQueueMetricsSnapshot();
    return jsonOk(metrics);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load queue metrics.";
    return jsonError(message, 500);
  }
}
