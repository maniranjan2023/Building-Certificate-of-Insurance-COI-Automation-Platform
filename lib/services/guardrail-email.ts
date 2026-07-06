import type { AgentStep } from "@prisma/client";
import { guardrailTripwireMessage, isGuardrailTripwireError } from "@/lib/ai/guardrail-runner";
import type { ReportAgentOutput } from "@/lib/ai/schemas";
import { persistCoiVersionAiResults } from "@/lib/services/ai-run";

export interface GuardrailCitation {
  agentName: string | null;
  guardrailKind: "input" | "output" | "unknown";
  guardrailName: string;
  /** Tenant-safe description of what was detected */
  citation: string;
  /** Full technical tripwire string for admin audit */
  technicalReason: string;
}

export interface GuardrailBlockPayload {
  citations: GuardrailCitation[];
  tenantSummary: string;
  suggestedTemplate: "guardrail_blocked";
}

const GUARDRAIL_LABELS: Record<string, string> = {
  coi_prompt_injection: "Prompt injection screening",
  coi_llm_safety: "Document safety review",
  checklist_items: "Checklist output validation",
  report_missing_items: "Report accuracy validation",
};

function parseTripwireReason(tripwireReason: string): Omit<GuardrailCitation, "agentName"> {
  const match = tripwireReason.match(/^\[(input|output)\]\s+([^:]+):\s*([\s\S]+)$/i);
  const guardrailKind = (match?.[1]?.toLowerCase() as GuardrailCitation["guardrailKind"]) ?? "unknown";
  const guardrailName = match?.[2]?.trim() ?? "unknown_guardrail";
  const detail = match?.[3]?.trim() ?? tripwireReason;

  const quoted = detail.match(/"([^"]+)"/)?.[1];
  const label = GUARDRAIL_LABELS[guardrailName] ?? guardrailName.replace(/_/g, " ");

  let citation: string;
  if (guardrailName === "coi_prompt_injection" && quoted) {
    citation = `Prohibited instructional language detected in the submitted document: "${quoted}"`;
  } else if (guardrailName === "coi_prompt_injection") {
    citation =
      "Prohibited instructional or override language was detected in the submitted document.";
  } else if (guardrailName === "coi_llm_safety") {
    citation = `Document content flagged during automated safety review: ${detail}`;
  } else if (guardrailName.startsWith("zod_")) {
    citation = `Automated validation could not verify extracted data (${label}): ${detail}`;
  } else {
    citation = `${label}: ${detail}`;
  }

  return {
    guardrailKind,
    guardrailName,
    citation,
    technicalReason: tripwireReason,
  };
}

export function buildGuardrailCitationFromStep(step: AgentStep): GuardrailCitation | null {
  if (!step.tripwireReason) return null;
  return {
    agentName: step.agentName,
    ...parseTripwireReason(step.tripwireReason),
  };
}

export function buildGuardrailCitationFromError(
  error: unknown,
  agentName?: string | null
): GuardrailCitation | null {
  if (!isGuardrailTripwireError(error)) return null;
  const tripwire = guardrailTripwireMessage(error);
  return {
    agentName: agentName ?? null,
    ...parseTripwireReason(tripwire),
  };
}

export function formatGuardrailCitationsForEmail(citations: GuardrailCitation[]): string {
  if (!citations.length) {
    return "• Automated review blocked further processing pending manual review.";
  }

  return citations
    .map((item) => {
      const step = item.agentName ? ` (${item.agentName})` : "";
      const kind =
        item.guardrailKind === "input"
          ? "Input screening"
          : item.guardrailKind === "output"
            ? "Output validation"
            : "Review";
      return `• [${kind}${step}] ${item.citation}`;
    })
    .join("\n");
}

export function buildGuardrailBlockPayload(options: {
  citations: GuardrailCitation[];
}): GuardrailBlockPayload {
  const tenantSummary =
    options.citations.length === 1
      ? options.citations[0].citation
      : `Our automated COI review detected ${options.citations.length} security or validation issue(s) in your submission. Please resubmit a clean ACORD 25 COI without embedded instructions or non-insurance content.`;

  return {
    citations: options.citations,
    tenantSummary,
    suggestedTemplate: "guardrail_blocked",
  };
}

export async function persistGuardrailBlockOnVersion(
  coiVersionId: string,
  payload: GuardrailBlockPayload
): Promise<void> {
  const citationsText = formatGuardrailCitationsForEmail(payload.citations);
  const primary = payload.citations[0];

  const draftReport: ReportAgentOutput & {
    guardrailBlock?: {
      citations: GuardrailCitation[];
      tenantSummary: string;
    };
  } = {
    summary: payload.tenantSummary,
    recommendation: "manual_review",
    recommendationReason: primary
      ? `Guardrail blocked processing: ${primary.technicalReason}`
      : "Guardrail blocked processing.",
    missingItems: [],
    matchedItems: [],
    citations: payload.citations.map((item) => ({
      claim: item.citation,
      quote: item.technicalReason,
    })),
    suggestedEmailBody: `Hello {{sender_name}},

We received your Certificate of Insurance ({{version_number}}), but our automated security review could not complete processing.

Issues detected:
${citationsText}

Please submit a standard ACORD 25 certificate without embedded instructions, prompts, or non-insurance text. If you believe this is an error, reply to this message.

Thank you,
{{signatory_name}}
{{signatory_title}}
{{company_name}}`,
    confidenceScore: 0,
    guardrailBlock: {
      citations: payload.citations,
      tenantSummary: payload.tenantSummary,
    },
  };

  await persistCoiVersionAiResults(coiVersionId, {
    draftReport,
    aiSuggestedTemplate: payload.suggestedTemplate,
  });
}

export function extractGuardrailCitationsFromDraft(
  draftReport: unknown
): GuardrailCitation[] {
  if (!draftReport || typeof draftReport !== "object") return [];
  const raw = draftReport as {
    guardrailBlock?: { citations?: GuardrailCitation[] };
    citations?: Array<{ claim?: string; quote?: string }>;
  };

  if (Array.isArray(raw.guardrailBlock?.citations)) {
    return raw.guardrailBlock.citations;
  }

  if (Array.isArray(raw.citations)) {
    return raw.citations.map((item, index) => ({
      agentName: null,
      guardrailKind: "unknown" as const,
      guardrailName: `citation_${index + 1}`,
      citation: item.claim ?? "Review issue detected",
      technicalReason: item.quote ?? item.claim ?? "",
    }));
  }

  return [];
}
