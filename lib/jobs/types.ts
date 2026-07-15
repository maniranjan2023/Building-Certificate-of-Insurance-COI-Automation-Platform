/** Shared job payloads used by Inngest functions and business handlers. */

export interface ProcessCoiJobData {
  coiJobId: string;
  coiDocumentId: string;
  coiVersionId: string;
  /** Set at enqueue when WORKER_FORCE_FAIL=true — for DLQ testing */
  forceFail?: boolean;
  emailBodyText?: string | null;
  agentMailMessageId?: string | null;
  agentMailInboxId?: string | null;
  senderEmail?: string | null;
}

export interface SendTemplateEmailJobData {
  coiJobId: string;
  coiVersionId: string;
  coiDocumentId: string;
  templateKey: string;
  toEmail: string;
  customBody?: string;
  customSubject?: string;
  rejectionReason?: string;
  agentMailMessageId?: string | null;
  agentMailInboxId?: string | null;
}

export interface SendReminderJobData {
  coiJobId: string;
  coiVersionId: string;
  coiDocumentId: string;
  daysBefore: number;
  toEmail: string;
}

export interface EnqueueProcessCoiOptions {
  forceFail?: boolean;
  emailBodyText?: string | null;
  agentMailMessageId?: string | null;
  agentMailInboxId?: string | null;
  senderEmail?: string | null;
}

/** Logical queue labels stored on CoiJob.queueName (not Redis BullMQ queues). */
export const INNGEST_COI_QUEUE = "inngest";
export const INNGEST_REMINDER_QUEUE = "inngest-reminder";
