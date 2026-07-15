import { getDlqEntry, deleteDlqEntry } from "@/lib/dlq/redis-dlq";
import { inngest } from "@/inngest/client";
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
import { getCoiJobById, retryJobFromDlq } from "@/lib/services/jobs";
import { JobStatus } from "@prisma/client";
import { z } from "zod";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const payloadSchema = z.record(z.string(), z.unknown());

/**
 * Admin DLQ retry:
 * 1. Read payload from Redis
 * 2. Validate
 * 3. inngest.send(...)
 * 4. Remove from Redis on success
 *
 * If a matching CoiJob row is still in DLQ, prefer retryJobFromDlq
 * (keeps DB + Redis + typed events aligned).
 */
export async function POST(request: Request, context: RouteContext) {
  const session = await requireApiSession();
  if (isSessionResponse(session)) return session;

  try {
    const { id } = await context.params;
    const ip = getClientIp(request);
    await assertDlqRetryAllowed(ip, id);

    const existingJob = await getCoiJobById(id);
    if (existingJob?.status === JobStatus.DLQ) {
      const job = await retryJobFromDlq(id);
      return jsonOk({ retried: true, job });
    }

    const entry = await getDlqEntry(id);
    if (!entry) {
      return jsonError("DLQ entry not found.", 404);
    }

    const parsed = payloadSchema.safeParse(entry.payload);
    if (!parsed.success) {
      return jsonError("Invalid DLQ payload.", 400);
    }

    if (!entry.eventName || typeof entry.eventName !== "string") {
      return jsonError("Invalid DLQ event name.", 400);
    }

    await inngest.send({
      name: entry.eventName,
      data: parsed.data,
    });

    await deleteDlqEntry(id);

    return jsonOk({ retried: true, id, eventName: entry.eventName });
  } catch (error) {
    if (error instanceof DlqRateLimitError) {
      return jsonError(error.message, 429);
    }
    const message =
      error instanceof Error ? error.message : "Failed to retry DLQ entry.";
    return jsonError(message, 400);
  }
}
