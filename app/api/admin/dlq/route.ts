import { listDlqEntries } from "@/lib/dlq/redis-dlq";
import { jsonError, jsonOk } from "@/lib/api-response";
import {
  isSessionResponse,
  requireApiSession,
} from "@/lib/api/require-api-session";

export async function GET() {
  const session = await requireApiSession();
  if (isSessionResponse(session)) return session;

  try {
    const entries = await listDlqEntries({ limit: 200 });
    return jsonOk({ entries, count: entries.length });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to list DLQ.";
    return jsonError(message, 500);
  }
}
