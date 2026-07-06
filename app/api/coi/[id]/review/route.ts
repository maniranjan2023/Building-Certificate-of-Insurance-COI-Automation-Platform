import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api-response";
import { getReviewContext } from "@/lib/services/review-actions";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
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
    const message =
      error instanceof Error ? error.message : "Failed to load review context.";
    return jsonError(message, 500);
  }
}
