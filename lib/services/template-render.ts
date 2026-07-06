import type { EmailPlaceholder } from "@/lib/constants/email-templates";

export type TemplateVariables = Partial<Record<EmailPlaceholder, string>>;

/** Bracket-style placeholders the report agent sometimes emits instead of {{…}}. */
const LEGACY_BRACKET_LABELS: Record<string, EmailPlaceholder> = {
  "your name": "signatory_name",
  "your title": "signatory_title",
  company: "company_name",
};

export function renderTemplateString(
  template: string,
  variables: TemplateVariables
): string {
  const withMustache = template.replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (_, key: string) => {
    const normalized = key.toLowerCase() as EmailPlaceholder;
    return variables[normalized]?.trim() ?? "";
  });

  return withMustache.replace(/\[\s*([^\]]+?)\s*\]/g, (match, label: string) => {
    const mapped = LEGACY_BRACKET_LABELS[label.trim().toLowerCase()];
    if (!mapped) return match;
    return variables[mapped]?.trim() ?? "";
  });
}

export function renderEmailContent(options: {
  subject: string;
  body: string;
  variables: TemplateVariables;
}): { subject: string; text: string } {
  return {
    subject: renderTemplateString(options.subject, options.variables).trim(),
    text: renderTemplateString(options.body, options.variables).trim(),
  };
}

export function formatItemsList(items: string[]): string {
  if (!items.length) return "None";
  return items.map((item) => `• ${item}`).join("\n");
}
