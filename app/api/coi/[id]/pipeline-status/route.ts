import { jsonError, jsonOk } from "@/lib/api-response";
import { getPipelineStatusForDocument } from "@/lib/services/pipeline-status";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const status = await getPipelineStatusForDocument(id);

    if (!status) {
      return jsonError("COI document not found.", 404);
    }

    return jsonOk(status);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load pipeline status.";
    return jsonError(message, 500);
  }
}
