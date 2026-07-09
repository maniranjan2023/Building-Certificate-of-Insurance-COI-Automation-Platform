import { isEmailTemplateKey } from "@/lib/constants/email-templates";
import {
  buildTemplateVariables,
  getEmailTemplateByKey,
} from "@/lib/services/email-templates";
import { renderEmailContent } from "@/lib/services/template-render";
import {
  validateOutboundEmailContent,
} from "@/lib/services/admin-outbound-guardrail";
import { deliverOutboundEmail } from "@/lib/services/outbound-deliver";
import type { CoiVersion } from "@prisma/client";

export interface SendTemplatedEmailOptions {
  version: CoiVersion & { sender?: { email: string; displayName?: string | null } | null };
  templateKey: string;
  toEmail: string;
  rejectionReason?: string | null;
  customBody?: string;
  customSubject?: string;
  replyToMessageId?: string | null;
  inboxId?: string | null;
}

export async function sendTemplatedEmail(
  options: SendTemplatedEmailOptions
): Promise<{ outboundEmailId: string; subject: string; text: string }> {
  if (!isEmailTemplateKey(options.templateKey)) {
    throw new Error(`Unknown email template: ${options.templateKey}`);
  }

  const template = await getEmailTemplateByKey(options.templateKey);
  if (!template || !template.enabled) {
    throw new Error(`Email template disabled or missing: ${options.templateKey}`);
  }

  const variables = buildTemplateVariables({
    version: options.version,
    senderEmail: options.toEmail,
    senderName: options.version.sender?.displayName,
    rejectionReason: options.rejectionReason,
  });

  const rendered = renderEmailContent({
    subject: options.customSubject ?? template.subject,
    body: options.customBody ?? template.body,
    variables,
  });

  await validateOutboundEmailContent({
    subject: rendered.subject,
    body: rendered.text,
    isAdminEdited: Boolean(options.customBody?.trim()),
  });

  return deliverOutboundEmail({
    coiVersionId: options.version.id,
    templateKey: options.templateKey,
    toEmail: options.toEmail,
    subject: rendered.subject,
    text: rendered.text,
    replyToMessageId: options.replyToMessageId,
    inboxId: options.inboxId,
  });
}
