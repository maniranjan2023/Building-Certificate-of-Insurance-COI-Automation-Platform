import type { ChecklistAgentOutput } from "@/lib/ai/schemas";
import { MIN_POLICY_DAYS } from "@/lib/services/acceptance-gates-shared";
import {
  asExtraction,
  daysBetween,
  parseCoiDate,
  startOfDay,
} from "@/lib/utils/coi-dates";

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

  const expiration = parseCoiDate(extraction?.expirationDate);
  const effective = parseCoiDate(extraction?.effectiveDate);
  let expiryValid = false;

  if (!expiration) {
    blockers.push("A valid policy expiration date is required before acceptance.");
  } else {
    const today = startOfDay(new Date());
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
