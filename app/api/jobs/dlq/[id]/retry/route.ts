import { retryJobFromDlq } from "@/lib/services/jobs";
import { jsonError, jsonOk } from "@/lib/api-response";
import {
  DlqRateLimitError,
  assertDlqRetryAllowed,
} from "@/lib/security/dlq-rate-limit";
import { getClientIp } from "@/lib/security/login-rate-limit";
import {
  isSessionResponse,
  requireApiSession,
} from "@/lib/api/require-api-session";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  const session = await requireApiSession();
  if (isSessionResponse(session)) return session;
  try {
    const { id } = await context.params;
    const ip = getClientIp(request);
    await assertDlqRetryAllowed(ip, id);
    const job = await retryJobFromDlq(id);
    return jsonOk(job);
  } catch (error) {
    if (error instanceof DlqRateLimitError) {
      return jsonError(error.message, 429);
    }
    const message =
      error instanceof Error ? error.message : "Failed to retry DLQ job.";
    return jsonError(message, 400);
  }
}
