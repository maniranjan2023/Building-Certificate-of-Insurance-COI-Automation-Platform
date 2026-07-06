import { describe, expect, it } from "vitest";
import {
  buildGuardrailCitationFromStep,
  formatGuardrailCitationsForEmail,
} from "./guardrail-email";
import type { AgentStep } from "@prisma/client";

describe("guardrail-email", () => {
  it("formats tenant citation from tripwire reason", () => {
    const step = {
      agentName: "document-agent",
      tripwireReason:
        '[input] coi_prompt_injection: Potential prompt injection detected: "ignore previous instructions"',
    } as AgentStep;

    const citation = buildGuardrailCitationFromStep(step);
    expect(citation?.citation).toContain("ignore previous instructions");
    expect(formatGuardrailCitationsForEmail([citation!])).toContain(
      "document-agent"
    );
  });
});
