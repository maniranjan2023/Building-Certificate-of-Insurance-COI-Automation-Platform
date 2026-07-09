import {
  CoiValidationError,
  createResubmissionWithJob,
} from "@/lib/services/coi";
import { listVersionsForDocument } from "@/lib/services/version";
import { CloudinaryUploadError } from "@/lib/services/cloudinary";
import { jsonError, jsonOk } from "@/lib/api-response";
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
    const versions = await listVersionsForDocument(id);
    return jsonOk(versions);
  } catch (error) {
    return jsonInternalError(error, "coi.[id].versions");
  }
}

export async function POST(request: Request, context: RouteContext) {
  const session = await requireApiSession();
  if (isSessionResponse(session)) return session;
  try {
    const { id } = await context.params;
    const formData = await request.formData();
    const file = formData.get("file");
    const senderEmail = formData.get("senderEmail");

    if (!(file instanceof File)) {
      return jsonError("A COI file is required.");
    }

    const existingVersions = await listVersionsForDocument(id);
    const resolvedEmail =
      typeof senderEmail === "string" && senderEmail.trim()
        ? senderEmail.trim()
        : existingVersions[0]?.sender.email;

    if (!resolvedEmail) {
      return jsonError("Sender email is required for a new version.");
    }

    const { document, version, job } = await createResubmissionWithJob(
      file,
      resolvedEmail
    );

    return jsonOk({ document, version, job }, { status: 201 });
  } catch (error) {
    if (error instanceof CoiValidationError) {
      return jsonError(error.message, 400);
    }
    if (error instanceof CloudinaryUploadError) {
      return jsonError(error.message, 502);
    }
    return jsonInternalError(error, "coi.[id].versions");
  }
}
