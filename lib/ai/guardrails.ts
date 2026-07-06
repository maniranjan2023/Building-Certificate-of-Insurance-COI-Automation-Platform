import { chatWithGroqFallback } from "@/lib/ai/groq-client";
import { getEnv } from "@/lib/env";
import type { z } from "zod";

export interface GuardrailFunctionOutput {
  tripwireTriggered: boolean;
  outputInfo: unknown;
}
const INJECTION_PATTERNS = [
  "ignore previous instructions",
  "ignore all previous",
  "you are now a",
  "forget everything above",
  "developer mode",
  "override safety",
  "disregard guidelines",
  "system prompt",
  "jailbreak",
];

export function ruleBasedInjectionGuard(input: string): GuardrailFunctionOutput {
  const lower = input.toLowerCase();
  const hit = INJECTION_PATTERNS.find((p) => lower.includes(p));
  return {
    tripwireTriggered: Boolean(hit),
    outputInfo: hit
      ? `Potential prompt injection detected: "${hit}"`
      : "No injection patterns detected",
  };
}

export async function llmSafetyGuard(input: string): Promise<GuardrailFunctionOutput> {
  const { content } = await chatWithGroqFallback({
    messages: [
      {
        role: "system",
        content:
          "You detect harmful or off-topic content in COI insurance document text. Reply JSON only: {\"unsafe\":boolean,\"reason\":string}",
      },
      {
        role: "user",
        content: input.slice(0, 8000),
      },
    ],
    responseFormat: "json_object",
  });

  try {
    const parsed = JSON.parse(content) as { unsafe?: boolean; reason?: string };
    return {
      tripwireTriggered: parsed.unsafe === true,
      outputInfo: parsed.reason ?? "LLM safety check complete",
    };
  } catch {
    return { tripwireTriggered: false, outputInfo: "Safety check parse skipped" };
  }
}

export function validateWithSchema<T>(
  schema: z.ZodSchema<T>,
  raw: string
): GuardrailFunctionOutput & { parsed?: T } {
  try {
    const data = JSON.parse(raw);
    const result = schema.safeParse(data);
    if (!result.success) {
      return {
        tripwireTriggered: true,
        outputInfo: result.error.issues.map((i) => i.message).join("; "),
      };
    }
    return {
      tripwireTriggered: false,
      outputInfo: "Schema validation passed",
      parsed: result.data,
    };
  } catch {
    return {
      tripwireTriggered: true,
      outputInfo: "Agent output is not valid JSON",
    };
  }
}

export function checklistOutputGuard(
  raw: string,
  expectedCount: number
): GuardrailFunctionOutput {
  try {
    const data = JSON.parse(raw) as {
      items?: Array<{ status?: string }>;
    };
    const items = data.items ?? [];
    if (expectedCount === 0) {
      return {
        tripwireTriggered: true,
        outputInfo: "No checklist items configured in database",
      };
    }
    if (items.length !== expectedCount) {
      return {
        tripwireTriggered: true,
        outputInfo: `Expected ${expectedCount} checklist items, got ${items.length}`,
      };
    }
    const invalid = items.find(
      (i) => !i.status || !["PASS", "FAIL", "MISSING"].includes(i.status)
    );
    if (invalid) {
      return {
        tripwireTriggered: true,
        outputInfo: "Checklist contains UNKNOWN or missing status",
      };
    }
    return { tripwireTriggered: false, outputInfo: "Checklist output valid" };
  } catch {
    return { tripwireTriggered: true, outputInfo: "Invalid checklist JSON" };
  }
}

export async function runInputGuardrails(
  input: string,
  options?: { skipLlm?: boolean }
): Promise<{ passed: boolean; reason?: string }> {
  const rule = ruleBasedInjectionGuard(input);
  if (rule.tripwireTriggered) {
    return { passed: false, reason: String(rule.outputInfo) };
  }
  if (!options?.skipLlm && input.length > 200) {
    const llm = await llmSafetyGuard(input);
    if (llm.tripwireTriggered) {
      return { passed: false, reason: String(llm.outputInfo) };
    }
  }
  return { passed: true };
}

export function getGuardrailModel(): string {
  return getEnv().GROQ_GUARDRAIL_MODEL;
}
