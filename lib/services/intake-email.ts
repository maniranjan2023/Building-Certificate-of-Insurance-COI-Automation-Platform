import { getEnv } from "@/lib/env";
import type { AutoEmailTemplate } from "@/lib/services/intake-email-templates";
import {
  renderAutoIntakeTemplate,
  type TemplateRenderContext,
} from "@/lib/services/intake-email-templates";
import { validateOutboundEmailContent } from "@/lib/services/admin-outbound-guardrail";
import { deliverOutboundEmail } from "@/lib/services/outbound-deliver";

export type { AutoEmailTemplate, TemplateRenderContext };

export async function sendAutoIntakeEmail(options: {
  template: AutoEmailTemplate;
  to: string;
  context?: TemplateRenderContext;
  coiVersionId?: string | null;
  replyToMessageId?: string;
  inboxId?: string;
}): Promise<void> {
  const rendered = renderAutoIntakeTemplate(options.template, {
    senderEmail: options.to,
    ...options.context,
  });

  await validateOutboundEmailContent({
    subject: rendered.subject,
    body: rendered.text,
  });

  await deliverOutboundEmail({
    coiVersionId: options.coiVersionId ?? null,
    templateKey: options.template,
    toEmail: options.to,
    subject: rendered.subject,
    text: rendered.text,
    replyToMessageId: options.replyToMessageId,
    inboxId: options.inboxId,
  });
}

export function getFromAddress(): string {
  return getEnv().INBOX_ID;
}
