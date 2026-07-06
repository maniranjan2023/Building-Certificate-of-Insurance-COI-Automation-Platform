/**
 * OpenAI Agents SDK guardrail helpers used by the COI pipeline.
 * @see https://openai.github.io/openai-agents-js/guides/guardrails/
 */
import {
  defineOutputGuardrail,
  InputGuardrailTripwireTriggered,
  OutputGuardrailTripwireTriggered,
  type GuardrailFunctionOutput,
  type InputGuardrailFunction,
  type InputGuardrailFunctionArgs,
  type InputGuardrailResult,
  type OutputGuardrailDefinition,
  type OutputGuardrailFunctionArgs,
  type OutputGuardrailResult,
} from "@openai/agents-core";

export {
  defineOutputGuardrail,
  InputGuardrailTripwireTriggered,
  OutputGuardrailTripwireTriggered,
  type GuardrailFunctionOutput,
  type InputGuardrailFunction,
  type InputGuardrailFunctionArgs,
  type InputGuardrailResult,
  type OutputGuardrailDefinition,
  type OutputGuardrailFunctionArgs,
  type OutputGuardrailResult,
};

/** Matches {@link https://openai.github.io/openai-agents-js/guides/guardrails/ SDK input guardrail definition}. */
export interface InputGuardrailDefinition {
  type: "input";
  name: string;
  runInParallel: boolean;
  guardrailFunction: InputGuardrailFunction;
  run(args: InputGuardrailFunctionArgs): Promise<InputGuardrailResult>;
}

/**
 * Mirrors `@openai/agents-core/dist/guardrail.mjs` — not re-exported from the package entry in 0.12.0.
 */
export function defineInputGuardrail({
  name,
  execute,
  runInParallel = true,
}: {
  name: string;
  execute: InputGuardrailFunction;
  runInParallel?: boolean;
}): InputGuardrailDefinition {
  return {
    type: "input",
    name,
    runInParallel,
    guardrailFunction: execute,
    async run(args) {
      return {
        guardrail: { type: "input", name },
        output: await execute(args),
      };
    },
  };
}
