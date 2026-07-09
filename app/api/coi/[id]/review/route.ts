import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api-response";
import { getReviewContext } from "@/lib/services/review-actions";
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
    const review = await getReviewContext(id);
    return jsonOk({
      eligibility: review.eligibility,
      suggestedTemplate: review.suggestedTemplate,
      recipientEmail: review.recipientEmail,
      status: review.version.status,
      draftReport: review.version.draftReport,
    });
  } catch (error) {
    return jsonInternalError(error, "coi.[id].review");
  }
}
