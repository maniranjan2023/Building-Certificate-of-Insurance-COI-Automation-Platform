import { eventType } from "inngest";
import { z } from "zod";

export const processCoiRequested = eventType("coi/process.requested", {
  schema: z.object({
    coiJobId: z.string(),
    coiDocumentId: z.string(),
    coiVersionId: z.string(),
    forceFail: z.boolean().optional(),
    emailBodyText: z.string().nullable().optional(),
    agentMailMessageId: z.string().nullable().optional(),
    agentMailInboxId: z.string().nullable().optional(),
    senderEmail: z.string().nullable().optional(),
  }),
});

export const sendTemplateEmailRequested = eventType(
  "coi/email.template.requested",
  {
    schema: z.object({
      coiJobId: z.string(),
      coiVersionId: z.string(),
      coiDocumentId: z.string(),
      templateKey: z.string(),
      toEmail: z.string(),
      customBody: z.string().optional(),
      customSubject: z.string().optional(),
      rejectionReason: z.string().optional(),
      agentMailMessageId: z.string().nullable().optional(),
      agentMailInboxId: z.string().nullable().optional(),
    }),
  }
);

export const sendReminderRequested = eventType("coi/reminder.requested", {
  schema: z.object({
    coiJobId: z.string(),
    coiVersionId: z.string(),
    coiDocumentId: z.string(),
    daysBefore: z.number().int().positive(),
    toEmail: z.string(),
  }),
});
