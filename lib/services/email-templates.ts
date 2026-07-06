import type { CoiVersion, Prisma } from "@prisma/client";
import {
  EMAIL_TEMPLATE_KEYS,
  EMAIL_TEMPLATE_LABELS,
  type EmailTemplateKey,
} from "@/lib/constants/email-templates";
import { prisma } from "@/lib/prisma";
import type { ChecklistAgentOutput, ExtractionAgentOutput, ReportAgentOutput } from "@/lib/ai/schemas";
import { getEmailSignatoryVariables } from "@/lib/services/email-signatory";
import {
  extractGuardrailCitationsFromDraft,
  formatGuardrailCitationsForEmail,
} from "@/lib/services/guardrail-email";

export class EmailTemplateValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmailTemplateValidationError";
  }
}

const DEFAULT_TEMPLATES: Record<
  EmailTemplateKey,
  { name: string; subject: string; body: string }
> = {
  missing_attachment: {
    name: EMAIL_TEMPLATE_LABELS.missing_attachment,
    subject: "COI submission — attachment missing",
    body: `Hello {{sender_name}},

We received your email but could not find a Certificate of Insurance (PDF or image) attached.

Please reply with your COI document attached so we can begin review.

Thank you.`,
  },
  receipt_acknowledged: {
    name: EMAIL_TEMPLATE_LABELS.receipt_acknowledged,
    subject: "COI received — processing started",
    body: `Hello {{sender_name}},

We received your Certificate of Insurance ({{version_number}}) and have started automated review.

You will receive another message once our team completes the compliance check.

Thank you.`,
  },
  processing_error: {
    name: EMAIL_TEMPLATE_LABELS.processing_error,
    subject: "COI processing issue",
    body: `Hello {{sender_name}},

We encountered an error while processing your Certificate of Insurance.

Please resubmit your COI as a clear PDF attachment, or contact our office if the issue continues.

Thank you.`,
  },
  invalid_document: {
    name: EMAIL_TEMPLATE_LABELS.invalid_document,
    subject: "Document received — not a Certificate of Insurance",
    body: `Hello {{sender_name}},

We reviewed the file you submitted but it does not appear to be a Certificate of Insurance (COI).

Please resubmit a valid ACORD 25 or equivalent COI PDF for {{property_name}}.

Summary: {{ai_summary}}

Thank you.`,
  },
  guardrail_blocked: {
    name: EMAIL_TEMPLATE_LABELS.guardrail_blocked,
    subject: "COI submission — security review required ({{version_number}})",
    body: `Hello {{sender_name}},

We received your Certificate of Insurance ({{version_number}}), but our automated security review could not complete processing.

{{guardrail_summary}}

Detected issues (citations from our review agents):
{{guardrail_citations}}

Pipeline step: {{agent_step}}

Please submit a standard ACORD 25 certificate without embedded instructions, prompts, or non-insurance text. If you believe this is an error, reply to this message with a corrected PDF.

Thank you,
{{signatory_name}}
{{signatory_title}}
{{company_name}}`,
  },
  clauses_missing: {
    name: EMAIL_TEMPLATE_LABELS.clauses_missing,
    subject: "COI review — items missing or non-compliant",
    body: `Hello {{sender_name}},

We reviewed your Certificate of Insurance ({{version_number}}) and found the following issues that must be corrected before we can accept it:

{{missing_items}}

Please ask your insurance agent to issue an updated COI addressing the items above and reply with the corrected document.

{{ai_summary}}

Thank you,
{{signatory_name}}
{{signatory_title}}
{{company_name}}`,
  },
  all_matched: {
    name: EMAIL_TEMPLATE_LABELS.all_matched,
    subject: "COI checklist passed — under final review",
    body: `Hello {{sender_name}},

Your Certificate of Insurance ({{version_number}}) passed our automated compliance checklist and is now under final review by our team.

Matched requirements:
{{matched_items}}

Policy expires: {{expiry_date}}

We will confirm acceptance shortly.

Thank you.`,
  },
  approved: {
    name: EMAIL_TEMPLATE_LABELS.approved,
    subject: "COI accepted — {{property_name}}",
    body: `Hello {{sender_name}},

Your Certificate of Insurance ({{version_number}}) has been accepted.

Carrier: {{carrier_name}}
Policy #: {{policy_number}}
Expiration: {{expiry_date}}

Matched requirements:
{{matched_items}}

Thank you for your submission.`,
  },
  rejected: {
    name: EMAIL_TEMPLATE_LABELS.rejected,
    subject: "COI not accepted — action required",
    body: `Hello {{sender_name}},

Your Certificate of Insurance ({{version_number}}) was not accepted.

Reason: {{rejection_reason}}

Items requiring correction:
{{missing_items}}

Please submit a corrected or renewed COI addressing the issues above.

Thank you,
{{signatory_name}}
{{signatory_title}}
{{company_name}}`,
  },
  renewal_reminder: {
    name: EMAIL_TEMPLATE_LABELS.renewal_reminder,
    subject: "COI renewal reminder — expires {{expiry_date}}",
    body: `Hello {{sender_name}},

This is a reminder that your Certificate of Insurance for {{property_name}} expires on {{expiry_date}}.

Please submit a renewed COI before the expiration date to maintain compliance.

Policy #: {{policy_number}}
Carrier: {{carrier_name}}

Thank you.`,
  },
};

export async function ensureDefaultEmailTemplates(): Promise<void> {
  for (const key of EMAIL_TEMPLATE_KEYS) {
    const defaults = DEFAULT_TEMPLATES[key];
    await prisma.emailTemplate.upsert({
      where: { key },
      create: { key, ...defaults },
      update: {},
    });
  }
}

export async function listEmailTemplates() {
  await ensureDefaultEmailTemplates();
  return prisma.emailTemplate.findMany({
    orderBy: { key: "asc" },
  });
}

export async function getEmailTemplateByKey(key: string) {
  await ensureDefaultEmailTemplates();
  return prisma.emailTemplate.findUnique({ where: { key } });
}

export async function updateEmailTemplate(
  key: string,
  data: Pick<Prisma.EmailTemplateUpdateInput, "name" | "subject" | "body" | "enabled"> & {
    name: string;
    subject: string;
    body: string;
  }
) {
  const existing = await getEmailTemplateByKey(key);
  if (!existing) {
    throw new EmailTemplateValidationError(`Unknown template: ${key}`);
  }

  return prisma.emailTemplate.update({
    where: { key },
    data: {
      name: data.name.trim(),
      subject: data.subject.trim(),
      body: data.body,
      enabled: data.enabled ?? existing.enabled,
    },
  });
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

function asExtraction(value: unknown): ExtractionAgentOutput | null {
  return value && typeof value === "object" ? (value as ExtractionAgentOutput) : null;
}

function asReport(value: unknown): ReportAgentOutput | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<ReportAgentOutput>;
  return {
    summary: raw.summary ?? "",
    recommendation: raw.recommendation ?? "manual_review",
    recommendationReason: raw.recommendationReason ?? "",
    missingItems: Array.isArray(raw.missingItems) ? raw.missingItems : [],
    matchedItems: Array.isArray(raw.matchedItems) ? raw.matchedItems : [],
    citations: Array.isArray(raw.citations) ? raw.citations : [],
    suggestedEmailBody: raw.suggestedEmailBody ?? "",
    confidenceScore: typeof raw.confidenceScore === "number" ? raw.confidenceScore : 0,
  };
}

export function buildTemplateVariables(options: {
  version: CoiVersion;
  senderEmail: string;
  senderName?: string | null;
  rejectionReason?: string | null;
  propertyName?: string;
}): Record<string, string> {
  const checklist = asChecklist(options.version.checklistResults);
  const extraction = asExtraction(options.version.extractedFields);
  const report = asReport(options.version.draftReport);

  const missingItems =
    report?.missingItems?.length
      ? report.missingItems
      : checklist?.items
          .filter((i) => i.status !== "PASS")
          .map((i) => i.label) ?? [];

  const matchedItems =
    report?.matchedItems?.length
      ? report.matchedItems
      : checklist?.items.filter((i) => i.status === "PASS").map((i) => i.label) ?? [];

  const greetingName =
    options.senderName?.trim() ||
    options.senderEmail.split("@")[0] ||
    "there";

  const signatory = getEmailSignatoryVariables();
  const guardrailCitations = extractGuardrailCitationsFromDraft(options.version.draftReport);
  const guardrailCitationsText = formatGuardrailCitationsForEmail(guardrailCitations);
  const primaryGuardrail = guardrailCitations[0];

  return {
    sender_name: greetingName,
    sender_email: options.senderEmail,
    property_name: options.propertyName ?? signatory.property_name,
    expiry_date: extraction?.expirationDate ?? "Not listed",
    policy_number: extraction?.policyNumber ?? "Not listed",
    carrier_name: extraction?.carrierName ?? "Not listed",
    missing_items: missingItems.map((i) => `• ${i}`).join("\n") || "None listed",
    matched_items: matchedItems.map((i) => `• ${i}`).join("\n") || "None listed",
    rejection_reason: options.rejectionReason?.trim() ?? "",
    version_number: `v${options.version.versionNumber}`,
    submission_date: options.version.createdAt.toISOString().slice(0, 10),
    ai_summary: report?.summary ?? "No summary available.",
    guardrail_citations: guardrailCitationsText,
    guardrail_summary:
      (report as { guardrailBlock?: { tenantSummary?: string } } | null)?.guardrailBlock
        ?.tenantSummary ??
      primaryGuardrail?.citation ??
      report?.summary ??
      "Automated security review blocked processing.",
    agent_step: primaryGuardrail?.agentName ?? "document review",
    signatory_name: signatory.signatory_name,
    signatory_title: signatory.signatory_title,
    company_name: signatory.company_name,
  };
}

export function getDefaultTemplateBody(key: EmailTemplateKey): string {
  return DEFAULT_TEMPLATES[key].body;
}
