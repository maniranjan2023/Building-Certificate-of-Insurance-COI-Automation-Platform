import { createCoiWorker } from "@/lib/workers/coi-worker";
import { getEnv, isDlqTestMode } from "@/lib/env";

async function main(): Promise<void> {
  const env = getEnv();
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
