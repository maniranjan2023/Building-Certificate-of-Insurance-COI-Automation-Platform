import { jsonError, jsonOk } from "@/lib/api-response";
import { listTenantSummaries } from "@/lib/services/tenant-activity";
import { jsonInternalError } from "@/lib/api/handle-route-error";
import {
  isSessionResponse,
  requireApiSession,
} from "@/lib/api/require-api-session";

export async function GET() {
  const session = await requireApiSession();
  if (isSessionResponse(session)) return session;
  try {
    const tenants = await listTenantSummaries();
    return jsonOk(tenants);
  } catch (error) {
    return jsonInternalError(error, "tenants");
  }
}
