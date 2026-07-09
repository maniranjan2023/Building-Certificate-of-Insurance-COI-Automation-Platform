import { createCoiWorker } from "@/lib/workers/coi-worker";
import { createReminderWorker } from "@/lib/workers/reminder-worker";
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

  const coiWorker = createCoiWorker();
  const reminderWorker = createReminderWorker();

  console.log(`BullMQ worker started — listening on ${env.BULLMQ_COI_QUEUE}`);
  console.log(`Reminder worker started — listening on ${env.BULLMQ_REMINDER_QUEUE}`);
  console.log(`Worker id: worker-${process.pid}`);
  console.log(
    `Job settings: attempts=${env.JOB_MAX_ATTEMPTS}, backoff=${env.JOB_BACKOFF_DELAY_MS}ms`
  );
  console.log(`COI worker concurrency: ${env.WORKER_COI_CONCURRENCY}`);
  console.log(`Reminder worker concurrency: ${env.WORKER_REMINDER_CONCURRENCY}`);
  console.log(
    `Reminder rate limit: ${env.REMINDER_EMAIL_RATE_LIMIT_MAX} emails / ${env.REMINDER_EMAIL_RATE_LIMIT_MS}ms`
  );
  console.log(`DLQ queues: ${env.BULLMQ_COI_DLQ}, ${env.BULLMQ_REMINDER_DLQ}`);

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
    console.log(`Received ${signal}, shutting down workers...`);
    await Promise.all([coiWorker.close(), reminderWorker.close()]);
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((error) => {
  console.error("Worker failed to start:", error);
  process.exit(1);
});
