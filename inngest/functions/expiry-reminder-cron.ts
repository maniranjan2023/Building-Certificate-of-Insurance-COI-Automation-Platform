import { cron } from "inngest";
import { inngest } from "@/inngest/client";
import { runExpiryReminderScanOnce } from "@/lib/cron/expiry-reminder-cron";

/**
 * Official Inngest scheduled function.
 * Schedule from CRON_SCHEDULE (default daily 09:00 UTC).
 * @see https://www.inngest.com/docs/guides/scheduled-functions
 */
function resolveCronSchedule(): string {
  const schedule = process.env.CRON_SCHEDULE?.trim();
  return schedule && schedule.length > 0 ? schedule : "0 9 * * *";
}

export const expiryReminderCronFunction = inngest.createFunction(
  {
    id: "expiry-reminder-cron",
    name: "Expiry Reminder Scan",
    triggers: [cron(resolveCronSchedule())],
    // Avoid overlapping scans — Inngest singleton (official flow control)
    singleton: { mode: "skip" },
    retries: 2,
  },
  async ({ step }) => {
    const result = await step.run("run-expiry-scan", async () => {
      return runExpiryReminderScanOnce();
    });

    return result;
  }
);
