import { prisma } from "@/lib/prisma";
import {
  downloadAttachment,
  getInboxId,
  getMessageFromField,
  pickCoiAttachment,
  type AgentMailWebhookMessage,
} from "@/lib/services/agentmail";
import { createCoiFromBufferWithJob } from "@/lib/services/coi";
import { sendAutoIntakeEmail } from "@/lib/services/intake-email";
import { logError } from "@/lib/observability/logfire";

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

  const senderEmail = getMessageFromField(message);
  const attachment = pickCoiAttachment(message?.attachments);

  if (!attachment) {
    if (senderEmail) {
      try {
        await sendAutoIntakeEmail({
          template: "missing_attachment",
          to: senderEmail,
          context: { senderEmail },
          replyToMessageId: messageId,
          inboxId,
        });
        console.log(
          `[webhook] missing_attachment email sent to ${senderEmail} (message ${messageId})`
        );
      } catch (error) {
        console.error(
          `[webhook] missing_attachment email failed for ${senderEmail}:`,
          error
        );
        logError("webhook.missing_attachment_email_failed", error, {
          messageId,
          senderEmail,
        });
      }
    } else {
      console.warn(
        `[webhook] no_valid_attachment but sender email missing (message ${messageId})`
      );
    }

    await markWebhookMessageProcessed(messageId);
    return { processed: true, reason: "no_valid_attachment" };
  }

  const downloaded = await downloadAttachment(inboxId, messageId, attachment);

  const submission = await createCoiFromBufferWithJob(
    downloaded.buffer,
    downloaded.fileName,
    downloaded.mimeType,
    senderEmail,
    {
      emailBodyText: message?.text ?? null,
      agentMailMessageId: messageId,
      agentMailInboxId: inboxId,
      senderEmail: senderEmail ?? undefined,
    }
  );

  if (senderEmail) {
    try {
      await sendAutoIntakeEmail({
        template: "receipt_acknowledged",
        to: senderEmail,
        context: {
          senderEmail,
          versionNumber: submission.version.versionNumber,
          submissionDate: submission.document.createdAt,
        },
        replyToMessageId: messageId,
        inboxId,
      });
    } catch (error) {
      logError("webhook.receipt_ack_email_failed", error, { messageId });
    }
  }

  await markWebhookMessageProcessed(messageId);

  return { processed: true };
}
