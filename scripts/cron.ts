import { getEnv } from "@/lib/env";
import {
  startExpiryReminderCron,
  runExpiryReminderScanOnce,
} from "@/lib/cron/expiry-reminder-cron";
import { ensureDatabaseReady } from "@/lib/utils/db-retry";
import { closeRedisClient } from "@/lib/queue/redis-lock";

async function main(): Promise<void> {
  const env = getEnv();
  const runOnStart = process.argv.includes("--run-now");

  console.log("Connecting to Neon PostgreSQL…");
  await ensureDatabaseReady();

  if (runOnStart) {
    console.log("[cron] running immediate expiry scan (--run-now)…");
    const result = await runExpiryReminderScanOnce();
    console.log("[cron] immediate scan result:", result);
  }

  const task = startExpiryReminderCron((result) => {
    console.log("[cron] scheduled scan result:", result);
  });

  console.log(`node-cron scheduler started — schedule: ${env.CRON_SCHEDULE}`);
  console.log(`Reminder windows: ${env.REMINDER_DAYS_BEFORE}`);
  task.start();

  const shutdown = async (signal: string) => {
    console.log(`Received ${signal}, stopping cron…`);
    task.stop();
    await closeRedisClient();
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch(async (error) => {
  console.error("Cron failed to start:", error);
  await closeRedisClient();
  process.exit(1);
});
