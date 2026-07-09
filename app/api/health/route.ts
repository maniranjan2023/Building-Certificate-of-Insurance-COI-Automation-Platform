import { getFullHealthReport } from "@/lib/services/health-check";
import { jsonOk } from "@/lib/api-response";
import {
  requireHealthOrAdminSession,
} from "@/lib/api/require-api-session";

export async function GET(request: Request) {
  const auth = await requireHealthOrAdminSession(request);
  if (auth instanceof Response) return auth;
  const report = await getFullHealthReport();
  const status = report.status === "error" ? 503 : 200;
  return jsonOk(report, { status });
}
