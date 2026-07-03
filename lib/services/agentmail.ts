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
  from_?: string[];
  subject?: string;
  text?: string;
  attachments?: AgentMailAttachmentMeta[];
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

export function parseSenderEmail(from: string[] | undefined): string | null {
  if (!from?.length) {
    return null;
  }
  const raw = from[0];
  const match = raw.match(/<([^>]+)>/);
  return (match?.[1] ?? raw).trim().toLowerCase();
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
