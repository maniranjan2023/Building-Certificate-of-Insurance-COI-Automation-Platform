import {
  CoiValidationError,
  createResubmissionWithJob,
} from "@/lib/services/coi";
import { listVersionsForDocument } from "@/lib/services/version";
import { CloudinaryUploadError } from "@/lib/services/cloudinary";
import { jsonError, jsonOk } from "@/lib/api-response";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const versions = await listVersionsForDocument(id);
    return jsonOk(versions);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load version history.";
    return jsonError(message, 500);
  }
}

export async function POST(request: Request, context: RouteContext) {
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
    const message =
      error instanceof Error ? error.message : "Failed to create new version.";
    return jsonError(message, 500);
  }
}
