import { inngest } from "@/inngest/client";
import { processCoiRequested } from "@/inngest/events";
import { recordPermanentJobFailure } from "@/lib/dlq/record-failure";
import {
  handleProcessCoiJob,
  markJobProcessing,
} from "@/lib/workers/process-coi";

function resolveRetries(): number {
  const max = Number(process.env.JOB_MAX_ATTEMPTS ?? "5");
  const retries = Number.isFinite(max) ? Math.max(0, Math.min(20, max - 1)) : 4;
  return retries;
}

function resolveConcurrency(): number {
  const value = Number(process.env.WORKER_COI_CONCURRENCY ?? "2");
  return Number.isFinite(value) && value >= 1 ? Math.min(20, value) : 2;
}

export const processCoiFunction = inngest.createFunction(
  {
    id: "process-coi",
    name: "Process COI",
    triggers: [processCoiRequested],
    retries: resolveRetries() as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10,
    concurrency: { limit: resolveConcurrency() },
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
      await markJobProcessing(data.coiJobId);
    });

    await step.run("run-ai-pipeline", async () => {
      await handleProcessCoiJob(data);
    });

    return {
      coiJobId: data.coiJobId,
      attempt,
      runId,
    };
  }
);
