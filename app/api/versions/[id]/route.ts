import { CoiStatus } from "@prisma/client";
import { z } from "zod";
import {
  VersionValidationError,
  getVersionById,
  updateVersionStatus,
} from "@/lib/services/version";
import { jsonError, jsonOk } from "@/lib/api-response";

const patchSchema = z.object({
  status: z.nativeEnum(CoiStatus),
  rejectionReason: z.string().optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = patchSchema.parse(await request.json());

    const existing = await getVersionById(id);
    if (!existing) {
      return jsonError("Version not found.", 404);
    }

    const version = await updateVersionStatus(
      id,
      body.status,
      body.rejectionReason
    );

    return jsonOk(version);
  } catch (error) {
    if (error instanceof VersionValidationError) {
      return jsonError(error.message, 400);
    }
    if (error instanceof z.ZodError) {
      return jsonError(error.issues[0]?.message ?? "Invalid request.", 400);
    }
    const message =
      error instanceof Error ? error.message : "Failed to update version.";
    return jsonError(message, 500);
  }
}
