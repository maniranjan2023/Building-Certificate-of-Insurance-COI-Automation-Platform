import { getCoiDocumentById, deleteCoiDocumentById, CoiNotFoundError } from "@/lib/services/coi";
import { jsonError, jsonOk } from "@/lib/api-response";
import { jsonInternalError } from "@/lib/api/handle-route-error";
import {
  isSessionResponse,
  requireApiSession,
} from "@/lib/api/require-api-session";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const session = await requireApiSession();
  if (isSessionResponse(session)) return session;
  try {
    const { id } = await context.params;
    const document = await getCoiDocumentById(id);

    if (!document) {
      return jsonError("COI document not found.", 404);
    }

    return jsonOk(document);
  } catch (error) {
    return jsonInternalError(error, "coi.[id]");
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await requireApiSession();
  if (isSessionResponse(session)) return session;
  try {
    const { id } = await context.params;
    await deleteCoiDocumentById(id);
    return jsonOk({ deleted: true });
  } catch (error) {
    if (error instanceof CoiNotFoundError) {
      return jsonError(error.message, 404);
    }
    return jsonInternalError(error, "coi.[id]");
  }
}
