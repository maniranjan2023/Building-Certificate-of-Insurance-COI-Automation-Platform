import { CoiStatus } from "@prisma/client";
import { z } from "zod";
import {
  ReviewActionError,
  acceptCoiVersion,
  rejectCoiVersion,
} from "@/lib/services/review-actions";
import {
  VersionValidationError,
  getVersionById,
  updateVersionStatus,
} from "@/lib/services/version";
import { jsonError, jsonOk } from "@/lib/api-response";
import { jsonInternalError } from "@/lib/api/handle-route-error";
import {
  isSessionResponse,
  requireApiSession,
} from "@/lib/api/require-api-session";

const patchSchema = z.object({
  status: z.nativeEnum(CoiStatus),
  rejectionReason: z.string().optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await requireApiSession();
  if (isSessionResponse(session)) return session;
  try {
    const { id } = await context.params;
    const body = patchSchema.parse(await request.json());

    const existing = await getVersionById(id);
    if (!existing) {
      return jsonError("Version not found.", 404);
    }

    if (body.status === CoiStatus.ACCEPTED) {
      const result = await acceptCoiVersion(existing.coiDocumentId, {});
      return jsonOk(result.version);
    }

    if (body.status === CoiStatus.REJECTED) {
      const result = await rejectCoiVersion(
        existing.coiDocumentId,
        body.rejectionReason ?? ""
      );
      return jsonOk(result.version);
    }

    const version = await updateVersionStatus(
      id,
      body.status,
      body.rejectionReason
    );

    return jsonOk(version);
  } catch (error) {
    if (error instanceof ReviewActionError) {
      return jsonError(error.message, 400);
    }
    if (error instanceof VersionValidationError) {
      return jsonError(error.message, 400);
    }
    if (error instanceof z.ZodError) {
      return jsonError(error.issues[0]?.message ?? "Invalid request.", 400);
    }
    return jsonInternalError(error, "versions.[id]");
  }
}
