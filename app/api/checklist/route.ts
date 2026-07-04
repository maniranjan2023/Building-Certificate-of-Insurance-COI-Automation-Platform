import { z } from "zod";
import {
  ChecklistValidationError,
  createChecklistItem,
  listChecklistItems,
} from "@/lib/services/checklist";
import { jsonError, jsonOk } from "@/lib/api-response";

const createSchema = z.object({
  requirement: z.string().min(1),
  expectedValue: z.string().min(1),
  mandatory: z.boolean().optional(),
  category: z.string().min(1),
  sortOrder: z.number().int().optional(),
});

export async function GET() {
  try {
    const items = await listChecklistItems(true);
    return jsonOk(items);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load checklist.";
    return jsonError(message, 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = createSchema.parse(await request.json());
    const item = await createChecklistItem(body);
    return jsonOk(item, { status: 201 });
  } catch (error) {
    if (error instanceof ChecklistValidationError) {
      return jsonError(error.message, 400);
    }
    if (error instanceof z.ZodError) {
      return jsonError(error.errors[0]?.message ?? "Invalid request.", 400);
    }
    const message =
      error instanceof Error ? error.message : "Failed to create checklist item.";
    return jsonError(message, 500);
  }
}
