import {
  InputGuardrailTripwireTriggered,
  OutputGuardrailTripwireTriggered,
  type InputGuardrailDefinition,
  type OutputGuardrailDefinition,
} from "@/lib/ai/agents-sdk";

/** Minimal agent stub — guardrail execute hooks only need a name on the agent. */
const GUARDRAIL_STUB_AGENT = { name: "coi-guardrail-stub" };

const GUARDRAIL_STUB_CONTEXT = { context: {} };

export function isGuardrailTripwireError(
  error: unknown
): error is InputGuardrailTripwireTriggered | OutputGuardrailTripwireTriggered {
  return (
    error instanceof InputGuardrailTripwireTriggered ||
    error instanceof OutputGuardrailTripwireTriggered
  );
}

export function guardrailTripwireKind(
  error: InputGuardrailTripwireTriggered | OutputGuardrailTripwireTriggered
): "input" | "output" {
  return error instanceof InputGuardrailTripwireTriggered ? "input" : "output";
}

export function guardrailTripwireMessage(
  error: InputGuardrailTripwireTriggered | OutputGuardrailTripwireTriggered
): string {
  const kind = guardrailTripwireKind(error);
  const name = error.result.guardrail.name;
  const info = error.result.output.outputInfo;
  const detail =
    typeof info === "string" ? info : JSON.stringify(info ?? error.message);
  return `[${kind}] ${name}: ${detail}`;
}

export function throwInputGuardrailTripwire(
  name: string,
  outputInfo: unknown
): never {
  throw new InputGuardrailTripwireTriggered(`Input guardrail triggered: ${name}`, {
    guardrail: { type: "input", name },
    output: { tripwireTriggered: true, outputInfo },
  });
}

/**
 * Run official SDK input guardrails (blocking, runInParallel: false per docs).
 * @see https://openai.github.io/openai-agents-js/guides/guardrails/
 */
export async function executeInputGuardrails(
  input: string,
  guardrails: InputGuardrailDefinition[]
): Promise<void> {
  if (!guardrails.length) return;

  const args = {
    agent: GUARDRAIL_STUB_AGENT,
    input,
    context: GUARDRAIL_STUB_CONTEXT,
  };

  for (const guardrail of guardrails) {
    const result = await guardrail.run(args);
    if (result.output.tripwireTriggered) {
      throw new InputGuardrailTripwireTriggered(
        `Input guardrail triggered: ${guardrail.name}`,
        result
      );
    }
  }
}

/**
 * Run official SDK output guardrails on raw agent JSON text.
 * @see https://openai.github.io/openai-agents-js/guides/guardrails/
 */
export async function executeOutputGuardrails(
  rawOutput: string,
  guardrails: OutputGuardrailDefinition[]
): Promise<void> {
  if (!guardrails.length) return;

  const args = {
    agent: GUARDRAIL_STUB_AGENT,
    agentOutput: rawOutput,
    context: GUARDRAIL_STUB_CONTEXT,
  };

  for (const guardrail of guardrails) {
    const result = await guardrail.run(args);
    if (result.output.tripwireTriggered) {
      throw new OutputGuardrailTripwireTriggered(
        `Output guardrail triggered: ${guardrail.name}`,
        result
      );
    }
  }
}
