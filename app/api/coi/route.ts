import {
  CoiValidationError,
  createCoiFromUpload,
  listCoiDocuments,
} from "@/lib/services/coi";
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

    const document = await createCoiFromUpload(file);
    return jsonOk(document, { status: 201 });
  } catch (error) {
    if (error instanceof CoiValidationError) {
      return jsonError(error.message, 400);
    }

    const message =
      error instanceof Error ? error.message : "Failed to upload COI.";
    return jsonError(message, 500);
  }
}
