import { AgentMailClient } from "agentmail";
import { OutboundEmailStatus } from "@prisma/client";
import { textToHtml } from "@/lib/email/plain-text-html";
import { getAgentMailApiKey } from "@/lib/env";
import { getInboxId } from "@/lib/services/agentmail";
import { prisma } from "@/lib/prisma";

let client: AgentMailClient | null = null;

function getClient(): AgentMailClient {
  if (!client) {
    client = new AgentMailClient({ apiKey: getAgentMailApiKey() });
  }
  return client;
}

export interface DeliverOutboundEmailOptions {
  coiVersionId?: string | null;
  templateKey: string;
  toEmail: string;
  subject: string;
  text: string;
  replyToMessageId?: string | null;
  inboxId?: string | null;
}

export async function deliverOutboundEmail(
  options: DeliverOutboundEmailOptions
): Promise<{ outboundEmailId: string; subject: string; text: string }> {
  const finalSubject = options.subject.trim();
  const finalText = options.text.trim();
  const html = textToHtml(finalText);

  const outbound = await prisma.outboundEmail.create({
    data: {
      coiVersionId: options.coiVersionId ?? null,
      templateKey: options.templateKey,
      toEmail: options.toEmail,
      subject: finalSubject,
      body: finalText,
      status: OutboundEmailStatus.QUEUED,
    },
  });

  console.log(
    `[outbound-deliver] sending "${finalSubject}" to ${options.toEmail}`
  );

  const inboxId = options.inboxId ?? getInboxId();
  const agentMail = getClient();
  const sendPayload = {
    to: [options.toEmail],
    subject: finalSubject,
    text: finalText,
    html,
  };

  try {
    const response = options.replyToMessageId
      ? await agentMail.inboxes.messages.reply(inboxId, options.replyToMessageId, sendPayload)
      : await agentMail.inboxes.messages.send(inboxId, sendPayload);

    await prisma.outboundEmail.update({
      where: { id: outbound.id },
      data: {
        status: OutboundEmailStatus.SENT,
        sentAt: new Date(),
        agentMailMessageId: response.messageId ?? null,
      },
    });

    return {
      outboundEmailId: outbound.id,
      subject: finalSubject,
      text: finalText,
    };
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
