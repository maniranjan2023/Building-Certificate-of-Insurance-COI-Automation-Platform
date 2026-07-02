import { getCoiDocumentById } from "@/lib/services/coi";
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
