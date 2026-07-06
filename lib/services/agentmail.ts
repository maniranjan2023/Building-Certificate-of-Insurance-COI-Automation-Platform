import { AgentMailClient } from "agentmail";
import { getAgentMailApiKey, getEnv } from "@/lib/env";

const ALLOWED_ATTACHMENT_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export interface AgentMailAttachmentMeta {
  attachment_id?: string;
  filename?: string;
  content_type?: string;
  size?: number;
}

export interface AgentMailWebhookMessage {
  inbox_id?: string;
  message_id?: string;
  /** AgentMail webhook uses `from` (string). Some payloads may use arrays. */
  from?: string | string[];
  /** @deprecated incorrect field name — kept for backwards compatibility */
  from_?: string | string[];
  subject?: string;
  text?: string;
  attachments?: AgentMailAttachmentMeta[];
}

export interface AgentMailWebhookPayload {
  event_type?: string;
  type?: string;
  event_id?: string;
  message?: AgentMailWebhookMessage;
}

export interface DownloadedAttachment {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
}

let client: AgentMailClient | null = null;

function getClient(): AgentMailClient {
  if (!client) {
    client = new AgentMailClient({ apiKey: getAgentMailApiKey() });
  }
  return client;
}

export function getInboxId(): string {
  return getEnv().INBOX_ID;
}

export function parseSenderEmail(
  from: string | string[] | undefined | null
): string | null {
  if (from == null) {
    return null;
  }

  const raw = Array.isArray(from) ? from[0] : from;
  if (!raw?.trim()) {
    return null;
  }

  const match = raw.match(/<([^>]+)>/);
  return (match?.[1] ?? raw).trim().toLowerCase();
}

export function getMessageFromField(
  message: AgentMailWebhookMessage | undefined
): string | null {
  if (!message) {
    return null;
  }
  return parseSenderEmail(message.from ?? message.from_);
}

export function pickCoiAttachment(
  attachments: AgentMailAttachmentMeta[] | undefined
): AgentMailAttachmentMeta | null {
  if (!attachments?.length) {
    return null;
  }

  for (const attachment of attachments) {
    const mime = attachment.content_type?.toLowerCase();
    if (mime && ALLOWED_ATTACHMENT_TYPES.has(mime)) {
      return attachment;
    }
  }

  return null;
}

export async function downloadAttachment(
  inboxId: string,
  messageId: string,
  attachment: AgentMailAttachmentMeta
): Promise<DownloadedAttachment> {
  const attachmentId = attachment.attachment_id;
  if (!attachmentId) {
    throw new Error("Attachment is missing attachment_id.");
  }

  const agentMail = getClient();
  const fileData = await agentMail.inboxes.messages.getAttachment(
    inboxId,
    messageId,
    attachmentId
  );

  const buffer = await attachmentResponseToBuffer(fileData);
  const mimeType =
    attachment.content_type ?? "application/octet-stream";
  const fileName = attachment.filename ?? `coi-${attachmentId}.bin`;

  return { buffer, fileName, mimeType };
}

async function attachmentResponseToBuffer(response: unknown): Promise<Buffer> {
  if (Buffer.isBuffer(response)) {
    return response;
  }

  if (response instanceof Uint8Array) {
    return Buffer.from(response);
  }

  if (response && typeof response === "object") {
    const binary = response as {
      bytes?: () => Promise<Uint8Array>;
      arrayBuffer?: () => Promise<ArrayBuffer>;
      downloadUrl?: string;
      download_url?: string;
    };

    if (typeof binary.bytes === "function") {
      return Buffer.from(await binary.bytes());
    }

    if (typeof binary.arrayBuffer === "function") {
      return Buffer.from(await binary.arrayBuffer());
    }

    const downloadUrl = binary.downloadUrl ?? binary.download_url;
    if (downloadUrl) {
      const downloadResponse = await fetch(downloadUrl);
      if (!downloadResponse.ok) {
        throw new Error(
          `Failed to download attachment (${downloadResponse.status}).`
        );
      }
      return Buffer.from(await downloadResponse.arrayBuffer());
    }
  }

  throw new Error("Unsupported AgentMail attachment response format.");
}
