import { buildRiskFromChecklist } from "@/lib/ai/checklist-rules";
import { chatWithGroqFallback } from "@/lib/ai/groq-client";
import {
  checklistOutputGuard,
  runInputGuardrails,
  validateWithSchema,
  type GuardrailFunctionOutput,
} from "@/lib/ai/guardrails";
import {
  checklistAgentOutputSchema,
  documentAgentOutputSchema,
  extractionAgentOutputSchema,
  reportAgentOutputSchema,
  riskAgentOutputSchema,
  type ChecklistAgentOutput,
  type DocumentAgentOutput,
  type ExtractionAgentOutput,
  type ReportAgentOutput,
  type RiskAgentOutput,
} from "@/lib/ai/schemas";
import type { ChecklistItem } from "@prisma/client";
import type { z } from "zod";

export class GuardrailTripwireError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GuardrailTripwireError";
  }
}

async function runJsonAgent<T>(options: {
  name: string;
  instructions: string;
  input: string;
  schema: z.ZodSchema<T>;
  outputGuard?: (raw: string) => GuardrailFunctionOutput;
}): Promise<{ data: T; raw: string; model: string }> {
  const systemPrompt = `${options.instructions}\n\nRespond with valid JSON only. No markdown fences.`;

  const { content, model } = await chatWithGroqFallback({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: options.input },
    ],
    responseFormat: "json_object",
  });

  if (options.outputGuard) {
    const guard = options.outputGuard(content);
    if (guard.tripwireTriggered) {
      throw new GuardrailTripwireError(String(guard.outputInfo));
    }
  }

  const validated = validateWithSchema(options.schema, content);
  if (validated.tripwireTriggered || !validated.parsed) {
    throw new GuardrailTripwireError(String(validated.outputInfo));
  }

  return { data: validated.parsed, raw: content, model };
}

export async function runDocumentAgent(
  documentBundle: string
): Promise<DocumentAgentOutput & { raw: string; model: string }> {
  const pre = await runInputGuardrails(documentBundle);
  if (!pre.passed) {
    throw new GuardrailTripwireError(pre.reason ?? "Input guardrail failed");
  }

  const result = await runJsonAgent({
    name: "document-agent",
    instructions: `You classify insurance documents. Determine if the text is a Certificate of Insurance (COI).
Return JSON: { "isCoi": boolean, "documentType": string, "confidence": number, "cleanText": string, "notes"?: string }`,
    input: documentBundle.slice(0, 120000),
    schema: documentAgentOutputSchema,
  });

  return { ...result.data, raw: result.raw, model: result.model };
}

export async function runExtractionAgent(
  cleanText: string
): Promise<ExtractionAgentOutput & { raw: string; model: string }> {
  const pre = await runInputGuardrails(cleanText.slice(0, 50000), { skipLlm: true });
  if (!pre.passed) {
    throw new GuardrailTripwireError(pre.reason ?? "Input guardrail failed");
  }

  const result = await runJsonAgent({
    name: "extraction-agent",
    instructions: `Extract structured COI fields from the text. Use null if not explicitly stated — never guess or infer values.
All string fields must be plain strings (not nested objects). endorsements must be an array of strings.
Return JSON with keys: carrierName, policyNumber, namedInsured, additionalInsured, certificateHolder, effectiveDate, expirationDate, generalLiabilityLimit, endorsements (array of strings).`,
    input: cleanText.slice(0, 100000),
    schema: extractionAgentOutputSchema,
  });

  return {
    ...result.data,
    endorsements: result.data.endorsements ?? [],
    raw: result.raw,
    model: result.model,
  };
}

export async function runChecklistAgent(
  extraction: ExtractionAgentOutput,
  checklist: ChecklistItem[],
  documentText: string
): Promise<ChecklistAgentOutput & { raw: string; model: string }> {
  if (checklist.length === 0) {
    throw new GuardrailTripwireError(
      "Checklist is empty — run ensureDefaultChecklistItems or add items in /checklist"
    );
  }

  const payload = JSON.stringify({
    documentText: documentText.slice(0, 100000),
    extractedFields: extraction,
    complianceContext: {
      landlordName: "Oakwood Property Management LLC",
      minPerOccurrence: "$1,000,000",
      minAggregate: "$2,000,000",
      minPolicyTermDays: 300,
      minAmBestRating: "A-",
    },
    checklist: checklist.map((item) => ({
      id: item.id,
      requirement: item.requirement,
      expectedValue: item.expectedValue,
      mandatory: item.mandatory,
      category: item.category,
    })),
  });

  const pre = await runInputGuardrails(payload, { skipLlm: true });
  if (!pre.passed) {
    throw new GuardrailTripwireError(pre.reason ?? "Input guardrail failed");
  }

  const result = await runJsonAgent({
    name: "checklist-agent",
    instructions: `You are a COI compliance checklist agent. Evaluate each checklist requirement against the COI documentText (primary source of truth) and extractedFields (secondary).

Rules:
- Read documentText carefully. Do NOT pass items based on assumptions or invented data.
- Treat negated language as failure (e.g. "Additional Insured: None", "does not add landlord as additional insured").
- For limits, compare dollar amounts in documentText to expectedValue.
- For dates, verify policy term covers at least minPolicyTermDays when evaluating expiration.
- Certificate holder must match landlordName in the certificate holder section.
- PASS = requirement clearly met in documentText. FAIL = found but does not meet expectedValue. MISSING = not found or explicitly excluded.
- Use the exact checklist item "id" as checklistItemId and the requirement text as "label".

Return JSON: { "items": [{ "checklistItemId", "label", "status", "evidence", "mandatory" }], "mandatoryFailures": string[], "allPassed": boolean }
Set mandatoryFailures to the label (requirement text) of each mandatory item that is FAIL or MISSING. Set allPassed true only when every mandatory item has status PASS.`,
    input: payload,
    schema: checklistAgentOutputSchema,
    outputGuard: (raw) => checklistOutputGuard(raw, checklist.length),
  });

  const mandatoryFailures = result.data.items
    .filter((i) => i.mandatory && i.status !== "PASS")
    .map((i) => i.label);
  const allPassed =
    checklist.length > 0 &&
    result.data.items.filter((i) => i.mandatory).every((i) => i.status === "PASS");

  return {
    ...result.data,
    mandatoryFailures,
    allPassed,
    raw: result.raw,
    model: result.model,
  };
}

export async function runRiskAgent(
  extraction: ExtractionAgentOutput,
  checklistResult: ChecklistAgentOutput
): Promise<RiskAgentOutput & { raw: string; model: string }> {
  const payload = JSON.stringify({ extraction, checklistResult });
  const grounded = buildRiskFromChecklist(checklistResult);

  const pre = await runInputGuardrails(payload, { skipLlm: true });
  if (!pre.passed) {
    throw new GuardrailTripwireError(pre.reason ?? "Input guardrail failed");
  }

  const result = await runJsonAgent({
    name: "risk-agent",
    instructions: `Analyze compliance risk from extraction and checklist results only. Do not invent missing items.
Return JSON:
- overallRisk: "low" | "medium" | "high"
- mandatoryFailures: array of { "item": string, "status": "PASS"|"FAIL"|"MISSING", "blocksAcceptance": boolean } OR plain strings (checklist requirement labels)
- optionalIssues: string[]
- lowConfidenceFields: string[] (extraction field names with low confidence)
- recommendationHint: "accept" | "reject" | "manual_review"
- confidenceScore: number 0-1`,
    input: payload,
    schema: riskAgentOutputSchema,
  });

  return {
    ...result.data,
    mandatoryFailures: grounded.mandatoryFailures,
    optionalIssues:
      result.data.optionalIssues.length > 0
        ? result.data.optionalIssues
        : grounded.optionalIssues,
    overallRisk:
      grounded.mandatoryFailures.length > 0 ? "high" : result.data.overallRisk,
    recommendationHint:
      grounded.mandatoryFailures.length > 0
        ? "reject"
        : result.data.recommendationHint,
    lowConfidenceFields: result.data.lowConfidenceFields ?? [],
    raw: result.raw,
    model: result.model,
  };
}

export async function runReportAgent(options: {
  extraction: ExtractionAgentOutput;
  checklistResult: ChecklistAgentOutput;
  risk: RiskAgentOutput;
}): Promise<ReportAgentOutput & { raw: string; model: string }> {
  const payload = JSON.stringify(options);

  const pre = await runInputGuardrails(payload);
  if (!pre.passed) {
    throw new GuardrailTripwireError(pre.reason ?? "Input guardrail failed");
  }

  const result = await runJsonAgent({
    name: "report-agent",
    instructions: `Write admin-facing COI review report.
missingItems must list checklist requirement labels (e.g. "General liability per occurrence limit") — NOT extraction field names like carrierName or additionalInsured.
Return JSON: summary, recommendation (accept|reject|manual_review), recommendationReason, missingItems[], matchedItems[], citations[{claim,quote}], suggestedEmailBody, confidenceScore.`,
    input: payload,
    schema: reportAgentOutputSchema,
    outputGuard: (raw) => {
      const validated = validateWithSchema(reportAgentOutputSchema, raw);
      if (validated.tripwireTriggered) return validated;

      const allowedMissing = new Set(
        options.checklistResult.items
          .filter((i) => i.status !== "PASS")
          .map((i) => i.label.trim().toLowerCase())
      );

      const reportMissing = validated.parsed?.missingItems ?? [];
      const invented = reportMissing.filter(
        (m) => !allowedMissing.has(m.trim().toLowerCase())
      );

      if (invented.length > 0) {
        return {
          tripwireTriggered: true,
          outputInfo: `Report missingItems must use checklist requirement labels only. Unknown: ${invented.join(", ")}`,
        };
      }
      return validated;
    },
  });

  return { ...result.data, raw: result.raw, model: result.model };
}

export function getSuggestedTemplate(
  checklistResult: ChecklistAgentOutput,
  documentResult?: DocumentAgentOutput
): string {
  if (documentResult && !documentResult.isCoi) {
    return "invalid_document";
  }
  if (!checklistResult.allPassed) {
    return "clauses_missing";
  }
  return "all_matched";
}
