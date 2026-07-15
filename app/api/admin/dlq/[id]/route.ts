import {
  deleteDlqEntry,
  getDlqEntry,
} from "@/lib/dlq/redis-dlq";
import { jsonError, jsonOk } from "@/lib/api-response";
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
    const entry = await getDlqEntry(id);
    if (!entry) return jsonError("DLQ entry not found.", 404);
    return jsonOk(entry);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load DLQ entry.";
    return jsonError(message, 500);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await requireApiSession();
  if (isSessionResponse(session)) return session;

  try {
    const { id } = await context.params;
    const deleted = await deleteDlqEntry(id);
    if (!deleted) return jsonError("DLQ entry not found.", 404);
    return jsonOk({ id, deleted: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete DLQ entry.";
    return jsonError(message, 500);
  }
}
