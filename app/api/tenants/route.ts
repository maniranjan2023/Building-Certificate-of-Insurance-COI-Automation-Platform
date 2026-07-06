import { jsonError, jsonOk } from "@/lib/api-response";
import { listTenantSummaries } from "@/lib/services/tenant-activity";

export async function GET() {
  try {
    const tenants = await listTenantSummaries();
    return jsonOk(tenants);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load tenants.";
    return jsonError(message, 500);
  }
}
