import { createCoiWorker } from "@/lib/workers/coi-worker";
import { ensureDefaultChecklistItems } from "@/lib/services/checklist";
import { logInfo } from "@/lib/observability/logfire.node";
import { getEnv, isDlqTestMode, shouldSendToLogfire } from "@/lib/env";
import { ensureDatabaseReady, withDbRetry } from "@/lib/utils/db-retry";

async function main(): Promise<void> {
  const env = getEnv();

  console.log("Connecting to Neon PostgreSQL (may take a few seconds if DB is idle)…");
  await ensureDatabaseReady();

  const restored = await withDbRetry(() => ensureDefaultChecklistItems(), {
    label: "checklist seed",
  });
  if (restored > 0) {
    console.log(`Checklist: ensured ${restored} default item(s) in database`);
  }

  const { ensureDefaultEmailTemplates } = await import("@/lib/services/email-templates");
  await withDbRetry(() => ensureDefaultEmailTemplates(), {
    label: "email template seed",
  });
  console.log("Email templates: defaults ensured in database");

  const worker = createCoiWorker();

  console.log(`BullMQ worker started — listening on ${env.BULLMQ_COI_QUEUE}`);
  console.log(`Worker id: worker-${process.pid}`);
  console.log(
    `Job settings: attempts=${env.JOB_MAX_ATTEMPTS}, backoff=${env.JOB_BACKOFF_DELAY_MS}ms`
  );
  console.log(`DLQ queue: ${env.BULLMQ_COI_DLQ}`);

  if (isDlqTestMode()) {
    console.log(
      "DLQ test mode ON — new uploads will enqueue jobs with forceFail=true"
    );
  } else {
    console.log("DLQ test mode OFF — jobs will process normally");
  }

  if (shouldSendToLogfire()) {
    logInfo("worker.started", {
      queue: env.BULLMQ_COI_QUEUE,
      workerId: `worker-${process.pid}`,
    });
  }

  const shutdown = async (signal: string) => {
    console.log(`Received ${signal}, shutting down worker...`);
    await worker.close();
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((error) => {
  console.error("Worker failed to start:", error);
  process.exit(1);
});
