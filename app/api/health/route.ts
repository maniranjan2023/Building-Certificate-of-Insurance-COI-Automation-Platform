import { getFullHealthReport } from "@/lib/services/health-check";
import { jsonOk } from "@/lib/api-response";

export async function GET() {
  const report = await getFullHealthReport();
  const status = report.status === "error" ? 503 : 200;
  return jsonOk(report, { status });
}
