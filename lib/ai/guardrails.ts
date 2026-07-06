import { chatWithGroqFallback } from "@/lib/ai/groq-client";
import { defineInputGuardrail, defineOutputGuardrail } from "@/lib/ai/agents-sdk";
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
  };
}

/** Official SDK input guardrail — prompt injection (runInParallel: false per docs). */
export const coiInjectionInputGuardrail = defineInputGuardrail({
  name: "coi_prompt_injection",
  runInParallel: false,
  execute: async ({ input }) => {
    const text = typeof input === "string" ? input : JSON.stringify(input);
    return ruleBasedInjectionGuard(text);
  },
});

/** Official SDK input guardrail — LLM safety check for OCR/document text. */
export const coiLlmSafetyInputGuardrail = defineInputGuardrail({
  name: "coi_llm_safety",
  runInParallel: false,
  execute: async ({ input }) => {
    const text = typeof input === "string" ? input : JSON.stringify(input);
    if (text.length <= 200) {
      return { tripwireTriggered: false, outputInfo: "Input too short for LLM safety check" };
    }
    return llmSafetyGuard(text);
  },
});

export function coiInputGuardrailSet(options: { includeLlmSafety?: boolean } = {}) {
  const guardrails = [coiInjectionInputGuardrail];
  if (options.includeLlmSafety) {
    guardrails.push(coiLlmSafetyInputGuardrail);
  }
  return guardrails;
}

/** Official SDK output guardrail — Zod JSON schema validation. */
export function zodJsonOutputGuardrail<T>(name: string, schema: z.ZodSchema<T>) {
  return defineOutputGuardrail({
    name: `zod_${name}`,
    execute: async ({ agentOutput }) => {
      const raw =
        typeof agentOutput === "string" ? agentOutput : JSON.stringify(agentOutput);
      return validateWithSchema(schema, raw);
    },
  });
}

/** Official SDK output guardrail — checklist PASS/FAIL/MISSING only. */
export function checklistItemsOutputGuardrail(expectedCount: number) {
  return defineOutputGuardrail({
    name: "checklist_items",
    execute: async ({ agentOutput }) => {
      const raw =
        typeof agentOutput === "string" ? agentOutput : JSON.stringify(agentOutput);
      return checklistOutputGuard(raw, expectedCount);
    },
  });
}

/** Official SDK output guardrail — report missingItems must match checklist labels. */
export function reportMissingItemsOutputGuardrail(allowedMissingLabels: string[]) {
  return defineOutputGuardrail({
    name: "report_missing_items",
    execute: async ({ agentOutput }) => {
      const raw =
        typeof agentOutput === "string" ? agentOutput : JSON.stringify(agentOutput);
      try {
        const data = JSON.parse(raw) as { missingItems?: string[] };
        const allowed = new Set(allowedMissingLabels.map((l) => l.trim().toLowerCase()));
        const invented = (data.missingItems ?? []).filter(
          (m) => !allowed.has(m.trim().toLowerCase())
        );
        if (invented.length > 0) {
          return {
            tripwireTriggered: true,
            outputInfo: `Report missingItems must use checklist requirement labels only. Unknown: ${invented.join(", ")}`,
          };
        }
        return { tripwireTriggered: false, outputInfo: "Report missingItems valid" };
      } catch {
        return {
          tripwireTriggered: true,
          outputInfo: "Report output is not valid JSON",
        };
      }
    },
  });
}
