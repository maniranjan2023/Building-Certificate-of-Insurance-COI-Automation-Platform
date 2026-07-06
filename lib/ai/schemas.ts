import { z } from "zod";

export const checklistItemStatusSchema = z.enum(["PASS", "FAIL", "MISSING"]);

/** LLMs often return nested objects for string fields — coerce to string|null. */
export function coerceNullableString(val: unknown): string | null {
  if (val === null || val === undefined) return null;
  if (typeof val === "string") {
    const trimmed = val.trim();
    return trimmed.length ? trimmed : null;
  }
  if (typeof val === "number" || typeof val === "boolean") {
    return String(val);
  }
  if (Array.isArray(val)) {
    const joined = val
      .map((item) => coerceNullableString(item))
      .filter((item): item is string => Boolean(item))
      .join(", ");
    return joined.length ? joined : null;
  }
  if (typeof val === "object") {
    const record = val as Record<string, unknown>;
    const parts = [record.name, record.company, record.address, record.value, record.text]
      .map((part) => coerceNullableString(part))
      .filter((part): part is string => Boolean(part));
    if (parts.length) return parts.join(" — ");
    try {
      return JSON.stringify(val);
    } catch {
      return null;
    }
  }
  return null;
}

export function coerceStringArray(val: unknown): string[] {
  if (!Array.isArray(val)) return [];
  return val
    .map((item) => coerceNullableString(item))
    .filter((item): item is string => Boolean(item));
}

function coerceChecklistStatus(val: unknown): "PASS" | "FAIL" | "MISSING" {
  const raw = String(val ?? "FAIL").toUpperCase();
  if (raw === "PASS" || raw === "FAIL" || raw === "MISSING") return raw;
  return "FAIL";
}

/** Risk agent often returns mandatoryFailures as strings — normalize to objects. */
export function coerceRiskMandatoryFailures(
  val: unknown
): Array<{ item: string; status: "PASS" | "FAIL" | "MISSING"; blocksAcceptance: boolean }> {
  if (!Array.isArray(val)) return [];

  return val
    .map((entry) => {
      if (typeof entry === "string") {
        const item = entry.trim();
        if (!item) return null;
        return { item, status: "FAIL" as const, blocksAcceptance: true };
      }
      if (typeof entry === "object" && entry !== null) {
        const record = entry as Record<string, unknown>;
        const item =
          coerceNullableString(record.item ?? record.label ?? record.name) ?? "";
        if (!item) return null;
        return {
          item,
          status: coerceChecklistStatus(record.status),
          blocksAcceptance: record.blocksAcceptance !== false,
        };
      }
      return null;
    })
    .filter(
      (
        entry
      ): entry is {
        item: string;
        status: "PASS" | "FAIL" | "MISSING";
        blocksAcceptance: boolean;
      } => entry !== null
    );
}

function coerceRiskLevel(val: unknown): "low" | "medium" | "high" {
  const raw = String(val ?? "medium").toLowerCase();
  if (raw === "low" || raw === "medium" || raw === "high") return raw;
  return "medium";
}

function coerceRecommendationHint(val: unknown): "accept" | "reject" | "manual_review" {
  const raw = String(val ?? "manual_review").toLowerCase();
  if (raw === "accept" || raw === "reject" || raw === "manual_review") return raw;
  if (raw.includes("reject")) return "reject";
  if (raw.includes("accept")) return "accept";
  return "manual_review";
}

function coerceConfidenceScore(val: unknown): number {
  if (typeof val === "number" && !Number.isNaN(val)) {
    return Math.min(1, Math.max(0, val));
  }
  if (typeof val === "string") {
    const parsed = Number.parseFloat(val);
    if (!Number.isNaN(parsed)) return Math.min(1, Math.max(0, parsed));
  }
  return 0.75;
}

const riskMandatoryFailures = z.preprocess(
  coerceRiskMandatoryFailures,
  z.array(
    z.object({
      item: z.string(),
      status: checklistItemStatusSchema,
      blocksAcceptance: z.boolean(),
    })
  )
);

const nullableString = z.preprocess(coerceNullableString, z.string().nullable());
const stringArray = z.preprocess(coerceStringArray, z.array(z.string()));

export const documentAgentOutputSchema = z.object({
  isCoi: z.boolean(),
  documentType: z.string(),
  confidence: z.number().min(0).max(1),
  cleanText: z.string(),
  notes: z.string().optional(),
});

export const extractionAgentOutputSchema = z.object({
  carrierName: nullableString,
  policyNumber: nullableString,
  namedInsured: nullableString,
  additionalInsured: nullableString,
  certificateHolder: nullableString,
  effectiveDate: nullableString,
  expirationDate: nullableString,
  generalLiabilityLimit: nullableString,
  endorsements: stringArray,
  rawFields: z.preprocess(
    (val) => {
      if (typeof val !== "object" || val === null || Array.isArray(val)) {
        return undefined;
      }
      const out: Record<string, string> = {};
      for (const [key, value] of Object.entries(val as Record<string, unknown>)) {
        const coerced = coerceNullableString(value);
        if (coerced) out[key] = coerced;
      }
      return Object.keys(out).length ? out : undefined;
    },
    z.record(z.string()).optional()
  ),
});

export const checklistResultItemSchema = z.object({
  checklistItemId: z.string(),
  label: z.string(),
  status: checklistItemStatusSchema,
  evidence: z.string().nullable(),
  mandatory: z.boolean(),
});

export const checklistAgentOutputSchema = z.object({
  items: z.array(checklistResultItemSchema),
  mandatoryFailures: z.array(z.string()),
  allPassed: z.boolean(),
});

export const riskAgentOutputSchema = z.object({
  overallRisk: z.preprocess(coerceRiskLevel, z.enum(["low", "medium", "high"])),
  mandatoryFailures: riskMandatoryFailures,
  optionalIssues: z.preprocess(coerceStringArray, z.array(z.string())).default([]),
  lowConfidenceFields: z.preprocess(coerceStringArray, z.array(z.string())).default([]),
  recommendationHint: z.preprocess(
    coerceRecommendationHint,
    z.enum(["accept", "reject", "manual_review"])
  ),
  confidenceScore: z.preprocess(coerceConfidenceScore, z.number().min(0).max(1)),
});

export const reportCitationSchema = z.object({
  claim: z.string(),
  quote: z.string(),
});

export const reportAgentOutputSchema = z.object({
  summary: z.string(),
  recommendation: z.enum(["accept", "reject", "manual_review"]),
  recommendationReason: z.string(),
  missingItems: z.array(z.string()),
  matchedItems: z.array(z.string()),
  citations: z.array(reportCitationSchema),
  suggestedEmailBody: z.string(),
  confidenceScore: z.number().min(0).max(1),
});

export type DocumentAgentOutput = z.infer<typeof documentAgentOutputSchema>;
export type ExtractionAgentOutput = z.infer<typeof extractionAgentOutputSchema>;
export type ChecklistAgentOutput = z.infer<typeof checklistAgentOutputSchema>;
export type RiskAgentOutput = z.infer<typeof riskAgentOutputSchema>;
export type ReportAgentOutput = z.infer<typeof reportAgentOutputSchema>;

export function parseAgentJson<T>(
  schema: z.ZodSchema<T>,
  raw: string
): { success: true; data: T } | { success: false; error: string } {
  try {
    const parsed = JSON.parse(raw);
    const result = schema.safeParse(parsed);
    if (!result.success) {
      return {
        success: false,
        error: result.error.issues.map((i) => i.message).join("; "),
      };
    }
    return { success: true, data: result.data };
  } catch {
    return { success: false, error: "Invalid JSON from agent" };
  }
}
