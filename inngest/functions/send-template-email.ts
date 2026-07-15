import { inngest } from "@/inngest/client";
import { sendTemplateEmailRequested } from "@/inngest/events";
import { recordPermanentJobFailure } from "@/lib/dlq/record-failure";
import {
  handleSendTemplateEmailJob,
  markEmailJobProcessing,
} from "@/lib/workers/send-template-email";

function resolveRetries(): number {
  const max = Number(process.env.JOB_MAX_ATTEMPTS ?? "5");
  const retries = Number.isFinite(max) ? Math.max(0, Math.min(20, max - 1)) : 4;
  return retries;
}

export const sendTemplateEmailFunction = inngest.createFunction(
  {
    id: "send-template-email",
    name: "Send Template Email",
    triggers: [sendTemplateEmailRequested],
    retries: resolveRetries() as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10,
    onFailure: async ({ error, event }) => {
      const original = event.data.event;
      await recordPermanentJobFailure({
        eventName: original.name,
        payload: (original.data ?? {}) as Record<string, unknown>,
        error,
        executionId: event.data.run_id,
        retryCount: Number(process.env.JOB_MAX_ATTEMPTS ?? "5"),
        metadata: {
          functionId: event.data.function_id,
        },
      });
    },
  },
  async ({ event, step, attempt, runId }) => {
    const data = event.data;

    await step.run("mark-processing", async () => {
      await markEmailJobProcessing(data.coiJobId);
    });

    await step.run("send-email", async () => {
      await handleSendTemplateEmailJob(data);
    });

    return {
      coiJobId: data.coiJobId,
      templateKey: data.templateKey,
      attempt,
      runId,
    };
  }
);
