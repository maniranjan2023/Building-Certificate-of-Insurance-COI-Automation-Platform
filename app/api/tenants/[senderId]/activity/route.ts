import { jsonError, jsonOk } from "@/lib/api-response";
import { getTenantActivityBySenderId } from "@/lib/services/tenant-activity";
import { jsonInternalError } from "@/lib/api/handle-route-error";
import {
  isSessionResponse,
  requireApiSession,
} from "@/lib/api/require-api-session";

interface RouteParams {
  params: Promise<{ senderId: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const session = await requireApiSession();
  if (isSessionResponse(session)) return session;
  try {
    const { senderId } = await params;
    const activity = await getTenantActivityBySenderId(senderId);

    if (!activity) {
      return jsonError("Tenant not found.", 404);
    }

    return jsonOk(activity);
  } catch (error) {
    return jsonInternalError(error, "tenants.[senderId].activity");
  }
}
