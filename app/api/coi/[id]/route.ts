import { getCoiDocumentById, deleteCoiDocumentById, CoiNotFoundError } from "@/lib/services/coi";
import { jsonError, jsonOk } from "@/lib/api-response";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const document = await getCoiDocumentById(id);

    if (!document) {
      return jsonError("COI document not found.", 404);
    }

    return jsonOk(document);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load COI document.";
    return jsonError(message, 500);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    await deleteCoiDocumentById(id);
    return jsonOk({ deleted: true });
  } catch (error) {
    if (error instanceof CoiNotFoundError) {
      return jsonError(error.message, 404);
    }
    const message =
      error instanceof Error ? error.message : "Failed to delete COI document.";
    return jsonError(message, 500);
  }
}
