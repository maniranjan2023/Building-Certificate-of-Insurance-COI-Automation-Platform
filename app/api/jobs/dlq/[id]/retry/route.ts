import { retryJobFromDlq } from "@/lib/services/jobs";
import { jsonError, jsonOk } from "@/lib/api-response";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const job = await retryJobFromDlq(id);
    return jsonOk(job);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to retry DLQ job.";
    return jsonError(message, 400);
  }
}
