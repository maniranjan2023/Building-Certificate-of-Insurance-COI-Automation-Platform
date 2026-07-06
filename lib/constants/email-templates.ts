/** Slugs aligned with `getSuggestedTemplate()` and intake auto-emails. */
export const EMAIL_TEMPLATE_KEYS = [
  "missing_attachment",
  "receipt_acknowledged",
  "processing_error",
  "invalid_document",
  "guardrail_blocked",
  "clauses_missing",
  "all_matched",
  "approved",
  "rejected",
  "renewal_reminder",
] as const;

export type EmailTemplateKey = (typeof EMAIL_TEMPLATE_KEYS)[number];

export const EMAIL_TEMPLATE_LABELS: Record<EmailTemplateKey, string> = {
  missing_attachment: "Missing Attachment",
  receipt_acknowledged: "Receipt Acknowledged",
  processing_error: "Processing Error",
  invalid_document: "Invalid Document",
  guardrail_blocked: "Guardrail Blocked — Security Review",
  clauses_missing: "Clauses / Items Missing",
  all_matched: "All Matched — Awaiting Review",
  approved: "Approved",
  rejected: "Rejected",
  renewal_reminder: "Renewal Reminder",
};

export const EMAIL_PLACEHOLDERS = [
  "sender_name",
  "sender_email",
  "property_name",
  "expiry_date",
  "policy_number",
  "carrier_name",
  "missing_items",
  "rejection_reason",
  "version_number",
  "submission_date",
  "matched_items",
  "ai_summary",
  "guardrail_citations",
  "guardrail_summary",
  "agent_step",
  "signatory_name",
  "signatory_title",
  "company_name",
] as const;

export type EmailPlaceholder = (typeof EMAIL_PLACEHOLDERS)[number];

export const EMAIL_PLACEHOLDER_HINTS: Record<EmailPlaceholder, string> = {
  sender_name: "Tenant display name",
  sender_email: "Tenant email address",
  property_name: "Property or unit identifier",
  expiry_date: "Policy expiration date",
  policy_number: "Insurance policy number",
  carrier_name: "Insurance carrier name",
  missing_items: "Failed or missing checklist items",
  rejection_reason: "Admin rejection reason",
  version_number: "COI version (v1, v2, …)",
  submission_date: "Date COI was received",
  matched_items: "Passed checklist items",
  ai_summary: "AI document summary",
  guardrail_citations: "Bulleted guardrail detections with agent citations",
  guardrail_summary: "Short tenant-facing guardrail summary",
  agent_step: "Pipeline agent step where guardrail tripped",
  signatory_name: "Sender name on outbound emails (e.g. admin)",
  signatory_title: "Sender job title on outbound emails",
  company_name: "Property management company name",
};

export function isEmailTemplateKey(value: string): value is EmailTemplateKey {
  return (EMAIL_TEMPLATE_KEYS as readonly string[]).includes(value);
}
