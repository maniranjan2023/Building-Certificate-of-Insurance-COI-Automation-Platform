import { inngest } from "@/inngest/client";
import { sendTemplateEmailRequested } from "@/inngest/events";
import {
  recordAttemptFailure,
  recordPermanentJobFailure,
} from "@/lib/dlq/record-failure";
import {
  handleSendTemplateEmailJob,
  markEmailJobProcessing,
} from "@/lib/workers/send-template-email";

function resolveRetries(): number {
  const max = Number(process.env.JOB_MAX_ATTEMPTS ?? "5");
  const retries = Number.isFinite(max) ? Math.max(0, Math.min(20, max - 1)) : 4;
  return retries;
}

function maxAttempts(): number {
  return resolveRetries() + 1;
}

export const sendTemplateEmailFunction = inngest.createFunction(
  {
    id: "send-template-email",
    name: "Send Template Email",
    triggers: [sendTemplateEmailRequested],
    retries: resolveRetries() as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10,
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
      await markEmailJobProcessing(data.coiJobId);
    });

    try {
      await step.run("send-email", async () => {
        await handleSendTemplateEmailJob(data);
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
      templateKey: data.templateKey,
      attempt,
      runId,
    };
  }
);
