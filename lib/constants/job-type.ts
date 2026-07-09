import type { JobType } from "@prisma/client";

export const JOB_TYPE_LABELS: Record<JobType, string> = {
  PROCESS_COI: "Process COI",
  SEND_TEMPLATE_EMAIL: "Send Email",
  SEND_REMINDER: "Renewal Reminder",
};

export function isReminderQueue(queueName: string): boolean {
  return queueName.includes("reminder");
}
