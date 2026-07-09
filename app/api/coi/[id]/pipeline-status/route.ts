import { jsonError, jsonOk } from "@/lib/api-response";
import { getPipelineStatusForDocument } from "@/lib/services/pipeline-status";
import { jsonInternalError } from "@/lib/api/handle-route-error";
import {
  isSessionResponse,
  requireApiSession,
} from "@/lib/api/require-api-session";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const session = await requireApiSession();
  if (isSessionResponse(session)) return session;
  try {
    const { id } = await params;
    const status = await getPipelineStatusForDocument(id);

    if (!status) {
      return jsonError("COI document not found.", 404);
    }

    return jsonOk(status);
  } catch (error) {
    return jsonInternalError(error, "coi.[id].pipeline-status");
  }
}
