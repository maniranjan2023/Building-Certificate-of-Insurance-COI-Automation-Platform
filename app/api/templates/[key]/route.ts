import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api-response";
import { jsonInternalError } from "@/lib/api/handle-route-error";
import {
  isSessionResponse,
  requireApiSession,
} from "@/lib/api/require-api-session";
import {
  EmailTemplateValidationError,
  updateEmailTemplate,
} from "@/lib/services/email-templates";

const patchSchema = z.object({
  name: z.string().min(1),
  subject: z.string().min(1),
  body: z.string().min(1),
  enabled: z.boolean().optional(),
});

interface RouteContext {
  params: Promise<{ key: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await requireApiSession();
  if (isSessionResponse(session)) return session;
  try {
    const { key } = await context.params;
    const body = patchSchema.parse(await request.json());
    const template = await updateEmailTemplate(key, body);
    return jsonOk(template);
  } catch (error) {
    if (error instanceof EmailTemplateValidationError) {
      return jsonError(error.message, 400);
    }
    if (error instanceof z.ZodError) {
      return jsonError(error.issues[0]?.message ?? "Invalid request.", 400);
    }
    return jsonInternalError(error, "templates.[key]");
  }
}
