import { z } from "zod";
import {
  ChecklistValidationError,
  deleteChecklistItem,
  getChecklistItemById,
  updateChecklistItem,
} from "@/lib/services/checklist";
import { jsonError, jsonOk } from "@/lib/api-response";

const updateSchema = z.object({
  requirement: z.string().min(1).optional(),
  expectedValue: z.string().min(1).optional(),
  mandatory: z.boolean().optional(),
  category: z.string().min(1).optional(),
  sortOrder: z.number().int().optional(),
  enabled: z.boolean().optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const item = await getChecklistItemById(id);
    if (!item) {
      return jsonError("Checklist item not found.", 404);
    }
    return jsonOk(item);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load checklist item.";
    return jsonError(message, 500);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = updateSchema.parse(await request.json());
    const item = await updateChecklistItem(id, body);
    return jsonOk(item);
  } catch (error) {
    if (error instanceof ChecklistValidationError) {
      return jsonError(error.message, 400);
    }
    if (error instanceof z.ZodError) {
      return jsonError(error.errors[0]?.message ?? "Invalid request.", 400);
    }
    const message =
      error instanceof Error ? error.message : "Failed to update checklist item.";
    return jsonError(message, 500);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const item = await deleteChecklistItem(id);
    return jsonOk(item);
  } catch (error) {
    if (error instanceof ChecklistValidationError) {
      return jsonError(error.message, 400);
    }
    const message =
      error instanceof Error ? error.message : "Failed to delete checklist item.";
    return jsonError(message, 500);
  }
}
