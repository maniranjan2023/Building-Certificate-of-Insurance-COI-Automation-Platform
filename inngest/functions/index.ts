import { processCoiFunction } from "@/inngest/functions/process-coi";
import { sendTemplateEmailFunction } from "@/inngest/functions/send-template-email";
import { sendReminderFunction } from "@/inngest/functions/send-reminder";
import { expiryReminderCronFunction } from "@/inngest/functions/expiry-reminder-cron";

export const functions = [
  processCoiFunction,
  sendTemplateEmailFunction,
  sendReminderFunction,
  expiryReminderCronFunction,
];
