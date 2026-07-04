import {
  CoiValidationError,
  createCoiFromUploadWithJob,
  listCoiDocuments,
} from "@/lib/services/coi";
import { CloudinaryUploadError } from "@/lib/services/cloudinary";
import { jsonError, jsonOk } from "@/lib/api-response";

export async function GET() {
  try {
    const documents = await listCoiDocuments();
    return jsonOk(documents);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load COI documents.";
    return jsonError(message, 500);
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return jsonError("A COI file is required.");
    }

    const senderEmail = formData.get("senderEmail");
    if (typeof senderEmail !== "string" || !senderEmail.trim()) {
      return jsonError("Tenant email is required for version tracking.");
    }

    const { document, version, job } = await createCoiFromUploadWithJob(
      file,
      senderEmail
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
      error instanceof Error ? error.message : "Failed to upload COI.";
    return jsonError(message, 500);
  }
}
