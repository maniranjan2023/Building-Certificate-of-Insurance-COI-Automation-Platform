import { prisma } from "@/lib/prisma";
import {
  downloadAttachment,
  getInboxId,
  parseSenderEmail,
  pickCoiAttachment,
  type AgentMailWebhookMessage,
} from "@/lib/services/agentmail";
import { createCoiFromBufferWithJob } from "@/lib/services/coi";

export interface AgentMailWebhookPayload {
  event_type?: string;
  type?: string;
  message?: AgentMailWebhookMessage;
}

export function getWebhookEventType(
  payload: AgentMailWebhookPayload
): string | undefined {
  return payload.event_type ?? payload.type;
}

export async function isWebhookMessageProcessed(
  messageId: string
): Promise<boolean> {
  const existing = await prisma.processedWebhookEvent.findUnique({
    where: { messageId },
  });
  return Boolean(existing);
}

export async function markWebhookMessageProcessed(
  messageId: string
): Promise<void> {
  await prisma.processedWebhookEvent.create({
    data: { messageId },
  });
}

export async function processAgentMailWebhook(
  payload: AgentMailWebhookPayload
): Promise<{ processed: boolean; reason?: string }> {
  const eventType = getWebhookEventType(payload);
  if (eventType !== "message.received") {
    return { processed: false, reason: "ignored_event" };
  }

  const message = payload.message;
  const messageId = message?.message_id;
  const inboxId = message?.inbox_id ?? getInboxId();

  if (!messageId) {
    return { processed: false, reason: "missing_message_id" };
  }

  if (await isWebhookMessageProcessed(messageId)) {
    return { processed: false, reason: "duplicate" };
  }

  const attachment = pickCoiAttachment(message?.attachments);
  if (!attachment) {
    return { processed: false, reason: "no_valid_attachment" };
  }

  const downloaded = await downloadAttachment(inboxId, messageId, attachment);
  const senderEmail = parseSenderEmail(message?.from_);

  await createCoiFromBufferWithJob(
    downloaded.buffer,
    downloaded.fileName,
    downloaded.mimeType,
    senderEmail
  );

  await markWebhookMessageProcessed(messageId);

  return { processed: true };
}
