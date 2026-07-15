import { inngest } from "@/inngest/client";
import { sendReminderRequested } from "@/inngest/events";
import {
  recordAttemptFailure,
  recordPermanentJobFailure,
} from "@/lib/dlq/record-failure";
import {
  handleSendReminderJob,
  markReminderJobProcessing,
} from "@/lib/workers/send-reminder";

function resolveRetries(): number {
  const max = Number(process.env.JOB_MAX_ATTEMPTS ?? "5");
  const retries = Number.isFinite(max) ? Math.max(0, Math.min(20, max - 1)) : 4;
  return retries;
}

function resolveConcurrency(): number {
  const value = Number(process.env.WORKER_REMINDER_CONCURRENCY ?? "3");
  return Number.isFinite(value) && value >= 1 ? Math.min(20, value) : 3;
}

function resolveThrottle() {
  const limit = Number(process.env.REMINDER_EMAIL_RATE_LIMIT_MAX ?? "100");
  const periodMs = Number(process.env.REMINDER_EMAIL_RATE_LIMIT_MS ?? "60000");
  const periodSeconds = Math.max(1, Math.round(periodMs / 1000));
  return {
    limit: Number.isFinite(limit) && limit >= 1 ? limit : 100,
    period: `${periodSeconds}s` as `${number}s`,
  };
}

function maxAttempts(): number {
  return resolveRetries() + 1;
}

export const sendReminderFunction = inngest.createFunction(
  {
    id: "send-reminder",
    name: "Send Renewal Reminder",
    triggers: [sendReminderRequested],
    retries: resolveRetries() as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10,
    concurrency: { limit: resolveConcurrency() },
    throttle: resolveThrottle(),
    idempotency: "event.data.coiDocumentId + '-' + event.data.daysBefore",
    onFailure: async ({ error, event }) => {
      await recordPermanentJobFailure({
        error,
        event,
        maxAttempts: maxAttempts(),
      });
    },
  },
  async ({ event, step, attempt, runId }) => {
    const data = event.data;

    await step.run("mark-processing", async () => {
      await markReminderJobProcessing(data.coiJobId);
    });

    try {
      await step.run("send-reminder-email", async () => {
        await handleSendReminderJob(data);
      });
    } catch (error) {
      await recordAttemptFailure({
        coiJobId: data.coiJobId,
        error,
        attempt,
        runId,
        maxAttempts: maxAttempts(),
      });
      throw error;
    }

    return {
      coiJobId: data.coiJobId,
      daysBefore: data.daysBefore,
      attempt,
      runId,
    };
  }
);
