import { checkRedisHealth } from "@/lib/services/health-check";
import { jsonOk } from "@/lib/api-response";

export async function GET() {
  const result = await checkRedisHealth();
  const status = result.status === "error" ? 503 : 200;
  return jsonOk(result, { status });
}
