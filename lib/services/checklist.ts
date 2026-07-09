import type { ChecklistItem, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  CHECKLIST_CATEGORIES,
  DEFAULT_CHECKLIST_ITEMS,
} from "@/lib/constants/checklist-categories";
import {
  ChecklistSecurityError,
  validateChecklistFieldSecurity,
} from "@/lib/security/checklist-sanitize";

export class ChecklistValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ChecklistValidationError";
  }
}

export type ChecklistItemInput = {
  requirement: string;
  expectedValue: string;
  mandatory?: boolean;
  category: string;
  sortOrder?: number;
};

function validateCategory(category: string): void {
  if (!CHECKLIST_CATEGORIES.includes(category as (typeof CHECKLIST_CATEGORIES)[number])) {
    throw new ChecklistValidationError(
      `Invalid category. Use one of: ${CHECKLIST_CATEGORIES.join(", ")}`
    );
  }
}

function validateItemInput(input: ChecklistItemInput): void {
  try {
    validateChecklistFieldSecurity("Requirement", input.requirement);
    validateChecklistFieldSecurity("Expected value", input.expectedValue);
  } catch (error) {
    if (error instanceof ChecklistSecurityError) {
      throw new ChecklistValidationError(error.message);
    }
    throw error;
  }
  validateCategory(input.category);
}

export async function seedDefaultChecklistIfEmpty(): Promise<number> {
  const count = await prisma.checklistItem.count();
  if (count > 0) {
    return ensureDefaultChecklistItems();
  }

  await prisma.checklistItem.createMany({
    data: DEFAULT_CHECKLIST_ITEMS,
  });

  return DEFAULT_CHECKLIST_ITEMS.length;
}

/** Re-create or re-enable any default items that were deleted by mistake. */
export async function ensureDefaultChecklistItems(): Promise<number> {
  let restored = 0;

  for (const defaults of DEFAULT_CHECKLIST_ITEMS) {
    const existing = await prisma.checklistItem.findFirst({
      where: {
        requirement: {
          equals: defaults.requirement,
          mode: "insensitive",
        },
      },
    });

    if (!existing) {
      await prisma.checklistItem.create({ data: defaults });
      restored += 1;
      continue;
    }

    if (!existing.enabled) {
      await prisma.checklistItem.update({
        where: { id: existing.id },
        data: {
          enabled: true,
          expectedValue: defaults.expectedValue,
          mandatory: defaults.mandatory,
          category: defaults.category,
          sortOrder: defaults.sortOrder,
        },
      });
      restored += 1;
    }
  }

  return restored;
}

export async function listChecklistItems(includeDisabled = false) {
  await ensureDefaultChecklistItems();

  return prisma.checklistItem.findMany({
    where: includeDisabled ? undefined : { enabled: true },
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
  });
}

export async function getChecklistItemById(id: string): Promise<ChecklistItem | null> {
  return prisma.checklistItem.findUnique({ where: { id } });
}

export async function createChecklistItem(
  input: ChecklistItemInput
): Promise<ChecklistItem> {
  validateItemInput(input);

  const maxSort = await prisma.checklistItem.aggregate({
    where: { category: input.category },
    _max: { sortOrder: true },
  });

  return prisma.checklistItem.create({
    data: {
      requirement: validateChecklistFieldSecurity("Requirement", input.requirement),
      expectedValue: validateChecklistFieldSecurity(
        "Expected value",
        input.expectedValue
      ),
      mandatory: input.mandatory ?? true,
      category: input.category,
      sortOrder: input.sortOrder ?? (maxSort._max.sortOrder ?? 0) + 1,
    },
  });
}

export async function updateChecklistItem(
  id: string,
  input: Partial<ChecklistItemInput> & { enabled?: boolean }
): Promise<ChecklistItem> {
  const existing = await prisma.checklistItem.findUnique({ where: { id } });
  if (!existing) {
    throw new ChecklistValidationError("Checklist item not found.");
  }

  const merged: ChecklistItemInput = {
    requirement: input.requirement ?? existing.requirement,
    expectedValue: input.expectedValue ?? existing.expectedValue,
    mandatory: input.mandatory ?? existing.mandatory,
    category: input.category ?? existing.category,
    sortOrder: input.sortOrder ?? existing.sortOrder,
  };

  validateItemInput(merged);

  return prisma.checklistItem.update({
    where: { id },
    data: {
      requirement: validateChecklistFieldSecurity("Requirement", merged.requirement),
      expectedValue: validateChecklistFieldSecurity(
        "Expected value",
        merged.expectedValue
      ),
      mandatory: merged.mandatory,
      category: merged.category,
      sortOrder: merged.sortOrder,
      ...(input.enabled !== undefined ? { enabled: input.enabled } : {}),
    },
  });
}

export async function deleteChecklistItem(id: string): Promise<ChecklistItem> {
  const existing = await prisma.checklistItem.findUnique({ where: { id } });
  if (!existing) {
    throw new ChecklistValidationError("Checklist item not found.");
  }

  return prisma.checklistItem.update({
    where: { id },
    data: { enabled: false },
  });
}

export function groupChecklistByCategory(
  items: ChecklistItem[]
): Record<string, ChecklistItem[]> {
  return items.reduce<Record<string, ChecklistItem[]>>((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});
}

export { CHECKLIST_CATEGORIES };
