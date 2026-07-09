import { z } from "zod";
import { isEmailTemplateKey } from "@/lib/constants/email-templates";
import { jsonError, jsonOk } from "@/lib/api-response";
import { AdminOutboundGuardrailError } from "@/lib/services/admin-outbound-guardrail";
import { jsonInternalError } from "@/lib/api/handle-route-error";
import {
  isSessionResponse,
  requireApiSession,
} from "@/lib/api/require-api-session";
import {
  ReviewActionError,
  sendSuggestedComplianceEmail,
} from "@/lib/services/review-actions";
const bodySchema = z.object({
  templateKey: z.string().optional(),
  customBody: z.string().optional(),
  customSubject: z.string().optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  const session = await requireApiSession();
  if (isSessionResponse(session)) return session;
  try {
    const { id } = await context.params;
    const body = bodySchema.parse(await request.json().catch(() => ({})));

    if (body.templateKey && !isEmailTemplateKey(body.templateKey)) {
      return jsonError(`Unknown template: ${body.templateKey}`, 400);
    }

    const result = await sendSuggestedComplianceEmail(id, body);
    return jsonOk(result);
  } catch (error) {
    if (error instanceof AdminOutboundGuardrailError) {
      return jsonError(error.message, 400);
    }
    if (error instanceof ReviewActionError) {
      return jsonError(error.message, 400);
    }
    if (error instanceof z.ZodError) {
      return jsonError(error.issues[0]?.message ?? "Invalid request.", 400);
    }
    return jsonInternalError(error, "coi.[id].send-email");
  }
}
