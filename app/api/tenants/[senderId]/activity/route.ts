import { jsonError, jsonOk } from "@/lib/api-response";
import { getTenantActivityBySenderId } from "@/lib/services/tenant-activity";

interface RouteParams {
  params: Promise<{ senderId: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { senderId } = await params;
    const activity = await getTenantActivityBySenderId(senderId);

    if (!activity) {
      return jsonError("Tenant not found.", 404);
    }

    return jsonOk(activity);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load tenant activity.";
    return jsonError(message, 500);
  }
}
