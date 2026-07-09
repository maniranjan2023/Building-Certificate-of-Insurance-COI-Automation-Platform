import { prisma } from "@/lib/prisma";
import { isUniqueConstraintError } from "@/lib/security/prisma-errors";
import { getEnv } from "@/lib/env";
import { getClientIp } from "@/lib/security/trusted-proxy";
import {
  assertWebhookAutoReplyAllowed,
  assertWebhookIntakeAllowed,
  WebhookRateLimitError,
} from "@/lib/security/webhook-rate-limit";
import {
  downloadAttachment,
  fetchVerifiedSenderEmail,
  getInboxId,
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

export class WebhookIntakeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WebhookIntakeError";
  }
}

export function getWebhookEventType(
  payload: AgentMailWebhookPayload
): string | undefined {
  return payload.event_type ?? payload.type;
}

function capWebhookText(text: string | null | undefined): string | null {
  if (!text) {
    return null;
  }
  const max = getEnv().WEBHOOK_MAX_TEXT_CHARS;
  return text.length > max ? text.slice(0, max) : text;
}

async function claimWebhookMessage(messageId: string): Promise<boolean> {
  try {
    await prisma.processedWebhookEvent.create({ data: { messageId } });
    return true;
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return false;
    }
    throw error;
  }
}

async function releaseWebhookClaim(messageId: string): Promise<void> {
  await prisma.processedWebhookEvent
    .delete({ where: { messageId } })
    .catch(() => undefined);
}

export async function processAgentMailWebhook(
  payload: AgentMailWebhookPayload,
  options?: { clientIp?: string }
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

  const ip = options?.clientIp ?? "unknown";
  await assertWebhookIntakeAllowed(ip);

  const claimed = await claimWebhookMessage(messageId);
  if (!claimed) {
    return { processed: false, reason: "duplicate" };
  }

  try {
    const senderEmail = await fetchVerifiedSenderEmail(inboxId, messageId);
    const attachment = pickCoiAttachment(message?.attachments);
    const emailBodyText = capWebhookText(message?.text);

    if (!attachment) {
      if (senderEmail) {
        await assertWebhookAutoReplyAllowed(senderEmail);
        try {
          await sendAutoIntakeEmail({
            template: "missing_attachment",
            to: senderEmail,
            context: { senderEmail },
            replyToMessageId: messageId,
            inboxId,
          });
        } catch (error) {
          logError("webhook.missing_attachment_email_failed", error, {
            messageId,
            senderEmail,
          });
        }
      }

      return { processed: true, reason: "no_valid_attachment" };
    }

    const downloaded = await downloadAttachment(inboxId, messageId, attachment);

    const submission = await createCoiFromBufferWithJob(
      downloaded.buffer,
      downloaded.fileName,
      downloaded.mimeType,
      senderEmail,
      {
        emailBodyText,
        agentMailMessageId: messageId,
        agentMailInboxId: inboxId,
        senderEmail: senderEmail ?? undefined,
      }
    );

    if (senderEmail) {
      await assertWebhookAutoReplyAllowed(senderEmail);
      try {
        await sendAutoIntakeEmail({
          template: "receipt_acknowledged",
          to: senderEmail,
          coiVersionId: submission.version.id,
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

    return { processed: true };
  } catch (error) {
    await releaseWebhookClaim(messageId);
    if (error instanceof WebhookRateLimitError) {
      throw error;
    }
    throw error;
  }
}
