import type { ChecklistItem } from "@prisma/client";
import type {
  ChecklistAgentOutput,
  ExtractionAgentOutput,
} from "@/lib/ai/schemas";

const LANDLORD_NAME = "oakwood property management";

const NEGATIVE_ADDITIONAL_INSURED = [
  /additional insured:\s*none/i,
  /no additional insured/i,
  /does not add[^.\n]{0,160}additional insured/i,
  /not[^.\n]{0,60}additional insured/i,
  /without[^.\n]{0,60}additional insured/i,
];

const MIN_OCCURRENCE = 1_000_000;
const MIN_AGGREGATE = 2_000_000;
const MIN_POLICY_DAYS = 300;

/** Collapse OCR line breaks so phrase matching works across wrapped text. */
function normalizeMatchText(text: string): string {
  return text.replace(/\s+/g, " ").trim().toLowerCase();
}

function parseMoney(value: string | null | undefined): number | null {
  if (!value?.trim()) return null;
  const normalized = value.replace(/,/g, "").match(/\$?\s*(\d+(?:\.\d+)?)/);
  if (!normalized) return null;
  return Math.round(parseFloat(normalized[1]));
}

function parseDate(value: string | null | undefined): Date | null {
  if (!value?.trim()) return null;
  const us = value.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (us) {
    const year = us[3].length === 2 ? 2000 + parseInt(us[3], 10) : parseInt(us[3], 10);
    return new Date(year, parseInt(us[1], 10) - 1, parseInt(us[2], 10));
  }
  const iso = Date.parse(value);
  return Number.isNaN(iso) ? null : new Date(iso);
}

function daysBetween(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

function findLargestAmountAfterLabel(text: string, labelPattern: RegExp): number | null {
  const section = text.match(labelPattern);
  if (!section) return null;
  const chunk = section[0];
  const dollarAmounts = [...chunk.matchAll(/\$\s*([\d,]+(?:\.\d+)?)/g)]
    .map((m) => parseMoney(m[0]))
    .filter((n): n is number => n !== null);
  const plainAmounts = [...chunk.matchAll(/(?:^|\s)([\d,]{4,})(?:\s|$)/g)]
    .map((m) => parseMoney(m[1]))
    .filter((n): n is number => n !== null);
  const amounts = [...dollarAmounts, ...plainAmounts];
  return amounts.length ? Math.max(...amounts) : null;
}

/** Prefer OCR/document text; LLM extraction is fallback only. */
function pickConservativeLimit(
  fromText: number | null,
  fromField: number | null
): number | null {
  if (fromText !== null && fromField !== null) {
    return Math.min(fromText, fromField);
  }
  return fromText ?? fromField;
}

function extractOccurrenceLimit(extraction: ExtractionAgentOutput, text: string): number | null {
  const fromText = findLargestAmountAfterLabel(text, /each occurrence[\s\S]{0,120}/i);
  const fromField = parseMoney(extraction.generalLiabilityLimit);
  return pickConservativeLimit(fromText, fromField);
}

function extractAggregateLimit(_extraction: ExtractionAgentOutput, text: string): number | null {
  return findLargestAmountAfterLabel(text, /general aggregate[\s\S]{0,120}/i);
}

function extractCertificateHolderSection(text: string): string {
  return text.match(/certificate holder[\s\S]{0,280}/i)?.[0] ?? "";
}

function extractPolicyDatesFromText(text: string): {
  effective: Date | null;
  expiration: Date | null;
} {
  const eff =
    text.match(/(?:^|\s|eff(?:ective)?[\s(]*)(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/im)?.[1] ??
    text.match(/effective[^0-9]{0,20}(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i)?.[1];
  const exp =
    text.match(/(?:exp(?:iration)?[\s(]*)(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i)?.[1] ??
    text.match(/expiration[^0-9]{0,20}(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i)?.[1];

  const dates = [...text.matchAll(/\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/g)].map(
    (m) => parseDate(m[1])
  ).filter((d): d is Date => d !== null);

  return {
    effective: parseDate(eff) ?? dates[0] ?? null,
    expiration: parseDate(exp) ?? dates[1] ?? dates[dates.length - 1] ?? null,
  };
}

function resolvePolicyDates(
  extraction: ExtractionAgentOutput,
  text: string
): { effective: Date | null; expiration: Date | null; effectiveLabel: string | null; expirationLabel: string | null } {
  const fromText = extractPolicyDatesFromText(text);
  const effective = fromText.effective ?? parseDate(extraction.effectiveDate);
  const expiration = fromText.expiration ?? parseDate(extraction.expirationDate);
  return {
    effective,
    expiration,
    effectiveLabel: extraction.effectiveDate ?? (fromText.effective ? formatUsDate(fromText.effective) : null),
    expirationLabel: extraction.expirationDate ?? (fromText.expiration ? formatUsDate(fromText.expiration) : null),
  };
}

function formatUsDate(date: Date): string {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const y = date.getFullYear();
  return `${m}/${d}/${y}`;
}

function hasLandlordAdditionalInsured(text: string): boolean {
  const normalized = normalizeMatchText(text);
  if (NEGATIVE_ADDITIONAL_INSURED.some((p) => p.test(normalized))) return false;

  const positive = [
    /oakwood property management[^.]{0,160}additional insured/i,
    /additional insured[^.]{0,160}oakwood property management/i,
    /included as additional insured[^.]{0,160}oakwood/i,
    /oakwood property management[^.]{0,120}primary and non-contributory/i,
  ];
  return positive.some((p) => p.test(normalized));
}

function hasCertificateHolderMatch(text: string): boolean {
  const section = normalizeMatchText(extractCertificateHolderSection(text));
  if (!section) return false;
  if (section.includes("to whom it may concern")) return false;
  return section.includes(LANDLORD_NAME);
}

function hasEndorsement(text: string, patterns: RegExp[]): boolean {
  const normalized = normalizeMatchText(text);
  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (!match || match.index == null) continue;
    const start = Math.max(0, match.index - 24);
    const window = normalized.slice(start, match.index + match[0].length + 12);
    if (/\b(no|not|without|none)\b/.test(window)) continue;
    return true;
  }
  return false;
}

function hasAmBestRating(text: string): boolean {
  const match = text.match(/am\s*best[^A-Za-z0-9]*([A-F][+-]?)/i);
  if (!match) return false;
  const rating = match[1].toUpperCase();
  const order = ["A++", "A+", "A", "A-", "B++", "B+", "B", "B-"];
  const idx = order.indexOf(rating);
  const minIdx = order.indexOf("A-");
  return idx !== -1 && idx <= minIdx;
}

function evaluateItem(
  item: ChecklistItem,
  extraction: ExtractionAgentOutput,
  text: string
): { status: "PASS" | "FAIL" | "MISSING"; evidence: string } {
  const req = item.requirement.toLowerCase();

  if (req.includes("per occurrence")) {
    const limit = extractOccurrenceLimit(extraction, text);
    if (limit === null) {
      return { status: "MISSING", evidence: "Per occurrence limit not found in COI." };
    }
    if (limit < MIN_OCCURRENCE) {
      return {
        status: "FAIL",
        evidence: `Per occurrence limit is $${limit.toLocaleString()} (requires $${MIN_OCCURRENCE.toLocaleString()} minimum).`,
      };
    }
    return {
      status: "PASS",
      evidence: `Per occurrence limit is $${limit.toLocaleString()}.`,
    };
  }

  if (req.includes("aggregate")) {
    const limit = extractAggregateLimit(extraction, text);
    if (limit === null) {
      return { status: "MISSING", evidence: "General aggregate limit not found in COI." };
    }
    if (limit < MIN_AGGREGATE) {
      return {
        status: "FAIL",
        evidence: `General aggregate is $${limit.toLocaleString()} (requires $${MIN_AGGREGATE.toLocaleString()} minimum).`,
      };
    }
    return {
      status: "PASS",
      evidence: `General aggregate is $${limit.toLocaleString()}.`,
    };
  }

  if (req.includes("additional insured")) {
    if (hasLandlordAdditionalInsured(text)) {
      return {
        status: "PASS",
        evidence: "Oakwood Property Management appears as additional insured.",
      };
    }
    if (NEGATIVE_ADDITIONAL_INSURED.some((p) => p.test(normalizeMatchText(text)))) {
      return {
        status: "MISSING",
        evidence: "No landlord or property manager listed as additional insured.",
      };
    }
    if (!text.toLowerCase().includes("additional insured")) {
      return {
        status: "MISSING",
        evidence: "Additional insured section not found on certificate.",
      };
    }
    return {
      status: "FAIL",
      evidence: "Landlord (Oakwood Property Management) is not named as additional insured.",
    };
  }

  if (req.includes("effective date")) {
    const { effective, effectiveLabel } = resolvePolicyDates(extraction, text);
    if (!effective) {
      return { status: "MISSING", evidence: "Policy effective date not found." };
    }
    return {
      status: "PASS",
      evidence: `Policy effective date is ${effectiveLabel ?? formatUsDate(effective)}.`,
    };
  }

  if (req.includes("expiration date")) {
    const { effective, expiration, expirationLabel } = resolvePolicyDates(extraction, text);
    if (!expiration) {
      return { status: "MISSING", evidence: "Policy expiration date not found." };
    }
    if (effective) {
      const days = daysBetween(effective, expiration);
      if (days < MIN_POLICY_DAYS) {
        return {
          status: "FAIL",
          evidence: `Policy term is ${days} days (requires at least ${MIN_POLICY_DAYS} days for full lease term).`,
        };
      }
    }
    return {
      status: "PASS",
      evidence: `Policy expires ${expirationLabel ?? formatUsDate(expiration)}.`,
    };
  }

  if (req.includes("waiver of subrogation")) {
    const ok = hasEndorsement(text, [/waiver of subrogation/i, /subrogation.*waived/i]);
    return ok
      ? { status: "PASS", evidence: "Waiver of subrogation referenced on certificate." }
      : { status: "MISSING", evidence: "Waiver of subrogation not found." };
  }

  if (req.includes("primary and non-contributory") || req.includes("primary")) {
    const ok = hasEndorsement(text, [/primary and non-contributory/i, /primary.*non-contributory/i]);
    return ok
      ? { status: "PASS", evidence: "Primary and non-contributory language found." }
      : { status: "MISSING", evidence: "Primary and non-contributory not found." };
  }

  if (req.includes("am best")) {
    if (hasAmBestRating(text)) {
      return { status: "PASS", evidence: "Carrier AM Best rating of A- or better found." };
    }
    return { status: "MISSING", evidence: "No AM Best rating listed for carrier." };
  }

  if (req.includes("certificate holder")) {
    if (hasCertificateHolderMatch(text)) {
      return {
        status: "PASS",
        evidence: "Certificate holder matches Oakwood Property Management LLC.",
      };
    }
    const section = extractCertificateHolderSection(text).trim();
    const holder = section || "not listed in certificate holder block";
    return {
      status: section ? "FAIL" : "MISSING",
      evidence: `Certificate holder "${holder.slice(0, 100)}" does not match Oakwood Property Management LLC.`,
    };
  }

  return { status: "MISSING", evidence: "Could not evaluate this requirement from COI text." };
}

export function evaluateChecklistDeterministic(options: {
  extraction: ExtractionAgentOutput;
  checklist: ChecklistItem[];
  documentText: string;
  ocrText?: string;
}): ChecklistAgentOutput {
  const text = `${options.documentText}\n${options.ocrText ?? ""}`.trim();

  const items = options.checklist.map((item) => {
    const { status, evidence } = evaluateItem(item, options.extraction, text);
    return {
      checklistItemId: item.id,
      label: item.requirement,
      status,
      evidence,
      mandatory: item.mandatory,
    };
  });

  const mandatoryFailures = items
    .filter((i) => i.mandatory && i.status !== "PASS")
    .map((i) => i.label);

  const allPassed = items.length > 0 && mandatoryFailures.length === 0;

  return { items, mandatoryFailures, allPassed };
}

/**
 * Merge LLM checklist output with document-grounded verification.
 * Document text wins whenever the LLM marks PASS but OCR proves FAIL/MISSING.
 */
export function reconcileChecklistResults(options: {
  llmResult: ChecklistAgentOutput;
  extraction: ExtractionAgentOutput;
  checklist: ChecklistItem[];
  documentText: string;
}): ChecklistAgentOutput {
  if (options.checklist.length === 0) {
    return {
      items: [],
      mandatoryFailures: ["Checklist not configured"],
      allPassed: false,
    };
  }

  const verified = evaluateChecklistDeterministic({
    extraction: options.extraction,
    checklist: options.checklist,
    documentText: options.documentText,
  });

  const verifiedById = new Map(verified.items.map((i) => [i.checklistItemId, i]));
  const llmById = new Map(options.llmResult.items.map((i) => [i.checklistItemId, i]));

  const items = options.checklist.map((item) => {
    const ground = verifiedById.get(item.id)!;
    const llm = llmById.get(item.id);

    if (ground.status !== "PASS") {
      return {
        ...ground,
        evidence: llm?.evidence
          ? `${ground.evidence} (LLM noted: ${llm.evidence})`
          : ground.evidence,
      };
    }

    if (llm && llm.status !== "PASS") {
      return ground;
    }

    return {
      checklistItemId: item.id,
      label: item.requirement,
      status: "PASS" as const,
      evidence: llm?.evidence ?? ground.evidence,
      mandatory: item.mandatory,
    };
  });

  const mandatoryFailures = items
    .filter((i) => i.mandatory && i.status !== "PASS")
    .map((i) => i.label);

  return {
    items,
    mandatoryFailures,
    allPassed: options.checklist.length > 0 && mandatoryFailures.length === 0,
  };
}

export function buildRiskFromChecklist(
  checklistResult: ChecklistAgentOutput
): import("@/lib/ai/schemas").RiskAgentOutput {
  const mandatoryFailures = checklistResult.items
    .filter((i) => i.mandatory && i.status !== "PASS")
    .map((i) => ({
      item: i.label,
      status: i.status,
      blocksAcceptance: true,
    }));

  const optionalIssues = checklistResult.items
    .filter((i) => !i.mandatory && i.status !== "PASS")
    .map((i) => i.label);

  const hasMandatory = mandatoryFailures.length > 0;

  return {
    overallRisk: hasMandatory ? "high" : optionalIssues.length > 0 ? "medium" : "low",
    mandatoryFailures,
    optionalIssues,
    lowConfidenceFields: [],
    recommendationHint: hasMandatory ? "reject" : optionalIssues.length > 0 ? "manual_review" : "accept",
    confidenceScore: hasMandatory ? 0.92 : 0.85,
  };
}

export function buildReportFromChecklist(
  checklistResult: ChecklistAgentOutput,
  extraction: ExtractionAgentOutput
): import("@/lib/ai/schemas").ReportAgentOutput {
  const failed = checklistResult.items.filter((i) => i.status !== "PASS");
  const matched = checklistResult.items.filter((i) => i.status === "PASS");
  const hasMandatory = checklistResult.mandatoryFailures.length > 0;

  return {
    summary: hasMandatory
      ? `COI review found ${checklistResult.mandatoryFailures.length} mandatory compliance issue(s) requiring correction before acceptance.`
      : failed.length > 0
        ? `COI review found ${failed.length} optional issue(s) for admin review.`
        : "COI meets all mandatory checklist requirements.",
    recommendation: hasMandatory ? "reject" : failed.length > 0 ? "manual_review" : "accept",
    recommendationReason: hasMandatory
      ? `Mandatory checklist failures: ${checklistResult.mandatoryFailures.join("; ")}.`
      : failed.length > 0
        ? `Optional items need review: ${failed.map((i) => i.label).join("; ")}.`
        : "All mandatory checklist items passed.",
    missingItems: failed.filter((i) => i.mandatory).map((i) => i.label),
    matchedItems: matched.map((i) => i.label),
    citations: failed.slice(0, 3).map((i) => ({
      claim: i.label,
      quote: i.evidence ?? "See COI document",
    })),
    suggestedEmailBody: hasMandatory
      ? `Your certificate of insurance (${extraction.policyNumber ?? "attached"}) does not meet our requirements. Please update and resubmit. Issues: ${checklistResult.mandatoryFailures.join("; ")}.`
      : "Please review the attached COI feedback and resubmit if updates are needed.",
    confidenceScore: hasMandatory ? 0.9 : 0.85,
  };
}
