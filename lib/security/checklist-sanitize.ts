import { ruleBasedInjectionGuard } from "@/lib/ai/guardrails";

export class ChecklistSecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ChecklistSecurityError";
  }
}

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export function sanitizeChecklistPromptField(value: string): string {
  return value
    .normalize("NFKC")
    .replace(CONTROL_CHARS, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 500);
}

export function validateChecklistFieldSecurity(
  fieldName: string,
  value: string
): string {
  const sanitized = sanitizeChecklistPromptField(value);
  if (!sanitized) {
    throw new ChecklistSecurityError(`${fieldName} is required.`);
  }

  const injection = ruleBasedInjectionGuard(sanitized);
  if (injection.tripwireTriggered) {
    throw new ChecklistSecurityError(
      `${fieldName} contains disallowed prompt-injection patterns.`
    );
  }

  return sanitized;
}
