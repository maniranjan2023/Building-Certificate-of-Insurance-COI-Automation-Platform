import type { FieldBoundingBox } from "@/lib/types/field-bboxes";

function normalizeBox(raw: Record<string, unknown>): FieldBoundingBox | null {
  if (typeof raw.fieldKey !== "string" || typeof raw.pageNumber !== "number") {
    return null;
  }

  const width =
    typeof raw.width === "number"
      ? raw.width
      : typeof raw.w === "number"
        ? raw.w
        : null;
  const height =
    typeof raw.height === "number"
      ? raw.height
      : typeof raw.h === "number"
        ? raw.h
        : null;

  if (width === null || height === null) return null;

  return {
    fieldKey: raw.fieldKey,
    label: String(raw.label ?? raw.fieldKey),
    mandatory: Boolean(raw.mandatory),
    status: (raw.status as FieldBoundingBox["status"]) ?? "MISSING",
    pageNumber: raw.pageNumber,
    pageWidth: Number(raw.pageWidth ?? 612),
    pageHeight: Number(raw.pageHeight ?? 792),
    x: Number(raw.x ?? 0),
    y: Number(raw.y ?? 0),
    width,
    height,
    matchedText: String(raw.matchedText ?? ""),
  };
}

export function parseFieldBoundingBoxes(value: unknown): FieldBoundingBox[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) =>
      typeof item === "object" && item !== null
        ? normalizeBox(item as Record<string, unknown>)
        : null
    )
    .filter((item): item is FieldBoundingBox => item !== null);
}
