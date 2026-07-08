import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api-response";
import { AdminOutboundGuardrailError } from "@/lib/services/admin-outbound-guardrail";
import { acceptCoiVersion, ReviewActionError } from "@/lib/services/review-actions";
const bodySchema = z.object({
  customBody: z.string().optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = bodySchema.parse(await request.json().catch(() => ({})));
    const version = await acceptCoiVersion(id, { customBody: body.customBody });
    return jsonOk(version);
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
    const message =
      error instanceof Error ? error.message : "Failed to accept COI.";
    return jsonError(message, 500);
  }
}
