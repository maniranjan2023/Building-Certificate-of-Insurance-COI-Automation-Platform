import { checkQueuesHealth } from "@/lib/services/health-check";
import { jsonOk } from "@/lib/api-response";

export async function GET() {
  const result = await checkQueuesHealth();
  const status = result.status === "error" ? 503 : result.status === "degraded" ? 200 : 200;
  return jsonOk(result, { status });
}
