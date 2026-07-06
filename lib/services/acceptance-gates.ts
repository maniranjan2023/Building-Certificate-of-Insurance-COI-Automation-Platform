import type { ChecklistAgentOutput, ExtractionAgentOutput } from "@/lib/ai/schemas";
import { MIN_POLICY_DAYS } from "@/lib/services/acceptance-gates-shared";

export interface AcceptanceEligibility {
  canAccept: boolean;
  blockers: string[];
  checklistPassed: boolean;
  expiryValid: boolean;
  expirationDate: Date | null;
}

function asChecklist(value: unknown): ChecklistAgentOutput | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<ChecklistAgentOutput>;
  if (!Array.isArray(raw.items)) return null;
  return {
    items: raw.items,
    mandatoryFailures: Array.isArray(raw.mandatoryFailures) ? raw.mandatoryFailures : [],
    allPassed: raw.allPassed ?? false,
  };
}

function asExtraction(value: unknown): ExtractionAgentOutput | null {
  return value && typeof value === "object" ? (value as ExtractionAgentOutput) : null;
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

export function evaluateAcceptanceEligibility(options: {
  checklistResults: unknown;
  extractedFields: unknown;
}): AcceptanceEligibility {
  const blockers: string[] = [];
  const checklist = asChecklist(options.checklistResults);
  const extraction = asExtraction(options.extractedFields);

  if (!checklist?.items?.length) {
    blockers.push("Checklist results are not available. Wait for AI processing to finish.");
    return {
      canAccept: false,
      blockers,
      checklistPassed: false,
      expiryValid: false,
      expirationDate: null,
    };
  }

  const checklistPassed = checklist.allPassed === true;
  if (!checklistPassed) {
    const failed = checklist.mandatoryFailures.length
      ? checklist.mandatoryFailures
      : checklist.items.filter((i) => i.mandatory && i.status !== "PASS").map((i) => i.label);
    blockers.push(
      `All mandatory checklist items must pass before acceptance. Outstanding: ${failed.join(", ")}`
    );
  }

  const expiration = parseDate(extraction?.expirationDate);
  const effective = parseDate(extraction?.effectiveDate);
  let expiryValid = false;

  if (!expiration) {
    blockers.push("A valid policy expiration date is required before acceptance.");
  } else {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (expiration < today) {
      blockers.push(
        `Policy is expired (${extraction?.expirationDate}). Tenant must submit a renewed COI with a future expiration date.`
      );
    } else if (effective) {
      const termDays = daysBetween(effective, expiration);
      if (termDays < MIN_POLICY_DAYS) {
        blockers.push(
          `Policy term is ${termDays} days; minimum ${MIN_POLICY_DAYS} days required for full lease term.`
        );
      } else {
        expiryValid = true;
      }
    } else {
      expiryValid = true;
    }
  }

  const expirationItem = checklist.items.find((i) =>
    i.label.toLowerCase().includes("expiration date")
  );
  if (expirationItem && expirationItem.status !== "PASS") {
    blockers.push(`Expiration checklist item failed: ${expirationItem.evidence}`);
    expiryValid = false;
  }

  return {
    canAccept: blockers.length === 0,
    blockers,
    checklistPassed,
    expiryValid,
    expirationDate: expiration,
  };
}
