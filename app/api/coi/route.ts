import {
  CoiValidationError,
  createCoiFromUploadWithJob,
  listCoiDocuments,
} from "@/lib/services/coi";
import { CloudinaryUploadError } from "@/lib/services/cloudinary";
import { jsonError, jsonOk } from "@/lib/api-response";
import { jsonInternalError } from "@/lib/api/handle-route-error";
import {
  isSessionResponse,
  requireApiSession,
} from "@/lib/api/require-api-session";

export async function GET() {
  const session = await requireApiSession();
  if (isSessionResponse(session)) return session;
  try {
    const documents = await listCoiDocuments();
    return jsonOk(documents);
  } catch (error) {
    return jsonInternalError(error, "coi");
  }
}

export async function POST(request: Request) {
  const session = await requireApiSession();
  if (isSessionResponse(session)) return session;
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
    return jsonInternalError(error, "coi");
  }
}
