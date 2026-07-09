import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api-response";
import { jsonInternalError } from "@/lib/api/handle-route-error";
import {
  isSessionResponse,
  requireApiSession,
} from "@/lib/api/require-api-session";
import {
  ReviewActionError,
  updateDraftReport,
} from "@/lib/services/review-actions";

const citationSchema = z.object({
  claim: z.string(),
  quote: z.string(),
});

const draftSchema = z.object({
  summary: z.string().optional(),
  recommendationReason: z.string().optional(),
  missingItems: z.array(z.string()).optional(),
  matchedItems: z.array(z.string()).optional(),
  citations: z.array(citationSchema).optional(),
  suggestedEmailBody: z.string().optional(),
});
interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await requireApiSession();
  if (isSessionResponse(session)) return session;
  try {
    const { id } = await context.params;
    const body = draftSchema.parse(await request.json());
    const version = await updateDraftReport(id, body);
    return jsonOk(version);
  } catch (error) {
    if (error instanceof ReviewActionError) {
      return jsonError(error.message, 400);
    }
    if (error instanceof z.ZodError) {
      return jsonError(error.issues[0]?.message ?? "Invalid request.", 400);
    }
    return jsonInternalError(error, "coi.[id].draft-report");
  }
}
