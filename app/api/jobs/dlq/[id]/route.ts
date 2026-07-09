import { dismissDlqJob } from "@/lib/services/jobs";
import { jsonError, jsonOk } from "@/lib/api-response";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const job = await dismissDlqJob(id);
    return jsonOk(job);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to dismiss DLQ job.";
    return jsonError(message, 400);
  }
}
