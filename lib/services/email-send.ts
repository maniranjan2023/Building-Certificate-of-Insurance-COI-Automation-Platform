import { AgentMailClient } from "agentmail";
import { OutboundEmailStatus } from "@prisma/client";
import { getAgentMailApiKey } from "@/lib/env";
import { isEmailTemplateKey } from "@/lib/constants/email-templates";
import { getInboxId } from "@/lib/services/agentmail";
import {
  buildTemplateVariables,
  getEmailTemplateByKey,
} from "@/lib/services/email-templates";
import { renderEmailContent } from "@/lib/services/template-render";
import {
  validateOutboundEmailContent,
} from "@/lib/services/admin-outbound-guardrail";
import { prisma } from "@/lib/prisma";
import type { CoiVersion } from "@prisma/client";

let client: AgentMailClient | null = null;

function getClient(): AgentMailClient {
  if (!client) {
    client = new AgentMailClient({ apiKey: getAgentMailApiKey() });
  }
  return client;
}

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

  const finalText = rendered.text;
  const finalSubject = rendered.subject;

  await validateOutboundEmailContent({
    subject: finalSubject,
    body: finalText,
    isAdminEdited: Boolean(options.customBody?.trim()),
  });

  const outbound = await prisma.outboundEmail.create({
    data: {
      coiVersionId: options.version.id,
      templateKey: options.templateKey,
      toEmail: options.toEmail,
      subject: finalSubject,
      body: finalText,
      status: OutboundEmailStatus.QUEUED,
    },
  });

  const inboxId = options.inboxId ?? getInboxId();
  const agentMail = getClient();

  try {
    if (options.replyToMessageId) {
      try {
        await agentMail.inboxes.messages.reply(
          inboxId,
          options.replyToMessageId,
          {
            to: [options.toEmail],
            text: finalText,
          }
        );
      } catch (replyError) {
        console.warn(
          `[email-send] reply failed for ${options.toEmail}, falling back to send:`,
          replyError
        );
        await agentMail.inboxes.messages.send(inboxId, {
          to: [options.toEmail],
          subject: finalSubject,
          text: finalText,
        });
      }
    } else {
      await agentMail.inboxes.messages.send(inboxId, {
        to: [options.toEmail],
        subject: finalSubject,
        text: finalText,
      });
    }

    await prisma.outboundEmail.update({
      where: { id: outbound.id },
      data: {
        status: OutboundEmailStatus.SENT,
        sentAt: new Date(),
      },
    });

    return { outboundEmailId: outbound.id, subject: finalSubject, text: finalText };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Send failed";
    await prisma.outboundEmail.update({
      where: { id: outbound.id },
      data: {
        status: OutboundEmailStatus.FAILED,
        errorMessage: message,
      },
    });
    throw error;
  }
}
