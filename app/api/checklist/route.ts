import { z } from "zod";
import {
  ChecklistValidationError,
  createChecklistItem,
  listChecklistItems,
} from "@/lib/services/checklist";
import { jsonError, jsonOk } from "@/lib/api-response";
import { jsonInternalError } from "@/lib/api/handle-route-error";
import {
  isSessionResponse,
  requireApiSession,
} from "@/lib/api/require-api-session";

const createSchema = z.object({
  requirement: z.string().min(1),
  expectedValue: z.string().min(1),
  mandatory: z.boolean().optional(),
  category: z.string().min(1),
  sortOrder: z.number().int().optional(),
});

export async function GET() {
  const session = await requireApiSession();
  if (isSessionResponse(session)) return session;
  try {
    const items = await listChecklistItems(true);
    return jsonOk(items);
  } catch (error) {
    return jsonInternalError(error, "checklist");
  }
}

export async function POST(request: Request) {
  const session = await requireApiSession();
  if (isSessionResponse(session)) return session;
  try {
    const body = createSchema.parse(await request.json());
    const item = await createChecklistItem(body);
    return jsonOk(item, { status: 201 });
  } catch (error) {
    if (error instanceof ChecklistValidationError) {
      return jsonError(error.message, 400);
    }
    if (error instanceof z.ZodError) {
      return jsonError(error.issues[0]?.message ?? "Invalid request.", 400);
    }
    return jsonInternalError(error, "checklist");
  }
}
