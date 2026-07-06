import { chatWithGroqFallback } from "@/lib/ai/groq-client";
import { ruleBasedInjectionGuard, llmSafetyGuard } from "@/lib/ai/guardrails";

export class AdminOutboundGuardrailError extends Error {
  readonly reasons: string[];

  constructor(reasons: string[]) {
    super(reasons.join(" "));
    this.name = "AdminOutboundGuardrailError";
    this.reasons = reasons;
  }
}

const UNRESOLVED_PLACEHOLDER = /\{\{\s*[a-z_]+\s*\}\}/i;

const INTERNAL_LEAK_PATTERNS = [
  /\bdraftreport\b/i,
  /\bagent\s*[1-5]\b/i,
  /\btripwire\b/i,
  /\bguardrail\b/i,
  /\bbullmq\b/i,
  /\bprisma\b/i,
  /\[your name\]/i,
  /\[your title\]/i,
  /\[company\]/i,
];

function checkUnresolvedPlaceholders(text: string): string | null {
  const match = text.match(UNRESOLVED_PLACEHOLDER);
  if (!match) return null;
  return `Unresolved template placeholder in outbound email: ${match[0]}`;
}

function checkInternalLeaks(text: string): string | null {
  for (const pattern of INTERNAL_LEAK_PATTERNS) {
    if (pattern.test(text)) {
      return `Outbound email may contain internal-only content (matched: ${pattern.source}).`;
    }
  }
  return null;
}

async function llmTenantEmailGuard(text: string): Promise<string | null> {
  const sample = text.slice(0, 6000);
  const { content } = await chatWithGroqFallback({
    messages: [
      {
        role: "system",
        content:
          'You review outbound tenant emails for a property COI compliance platform. Flag unsafe, abusive, off-topic, or clearly internal-only content. Reply JSON only: {"unsafe":boolean,"reason":string}',
      },
      { role: "user", content: sample },
    ],
    responseFormat: "json_object",
  });

  try {
    const parsed = JSON.parse(content) as { unsafe?: boolean; reason?: string };
    if (parsed.unsafe) {
      return parsed.reason ?? "Outbound email failed tenant safety review.";
    }
  } catch {
    // Non-blocking parse failure — rule checks already ran
  }
  return null;
}

export interface ValidateOutboundEmailOptions {
  subject: string;
  body: string;
  /** True when admin supplied customBody (stricter LLM check). */
  isAdminEdited?: boolean;
}

/**
 * Phase 5 — output guardrail on final rendered tenant email before AgentMail send.
 */
export async function validateOutboundEmailContent(
  options: ValidateOutboundEmailOptions
): Promise<void> {
  const subject = options.subject.trim();
  const body = options.body.trim();
  const combined = `Subject: ${subject}\n\n${body}`;
  const reasons: string[] = [];

  if (!body) {
    reasons.push("Email body is empty.");
  }

  if (!subject) {
    reasons.push("Email subject is empty.");
  }

  const injection = ruleBasedInjectionGuard(combined);
  if (injection.tripwireTriggered) {
    reasons.push(String(injection.outputInfo));
  }

  const placeholderIssue =
    checkUnresolvedPlaceholders(subject) ?? checkUnresolvedPlaceholders(body);
  if (placeholderIssue) reasons.push(placeholderIssue);

  const leakIssue =
    checkInternalLeaks(subject) ?? checkInternalLeaks(body);
  if (leakIssue) reasons.push(leakIssue);

  if (options.isAdminEdited && body.length > 0) {
    const llmReason = await llmTenantEmailGuard(combined);
    if (llmReason) reasons.push(llmReason);
  } else if (body.length > 400) {
    const safety = await llmSafetyGuard(combined);
    if (safety.tripwireTriggered) {
      reasons.push(String(safety.outputInfo));
    }
  }

  if (reasons.length > 0) {
    throw new AdminOutboundGuardrailError(reasons);
  }
}
