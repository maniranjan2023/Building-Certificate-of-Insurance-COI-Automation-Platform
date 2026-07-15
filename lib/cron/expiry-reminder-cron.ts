import { getEnv } from "@/lib/env";
import { RedisDistributedLock } from "@/lib/redis/distributed-lock";
import { structuredLog } from "@/lib/observability/structured-log";
import { runExpiryReminderScan } from "@/lib/services/reminder-scan";
import { prisma } from "@/lib/prisma";

const LOCK_KEY = "expiry-reminder-scan";

async function runScanWithLogging(options?: {
  lockSkipped?: boolean;
}): Promise<Awaited<ReturnType<typeof runExpiryReminderScan>>> {
  const started = Date.now();
  const { id: logId } = await prisma.cronScanLog.create({
    data: {
      lockSkipped: options?.lockSkipped ?? false,
    },
  });

  try {
    const result = await runExpiryReminderScan();
    const durationMs = Date.now() - started;

    await prisma.cronScanLog.update({
      where: { id: logId },
      data: {
        completedAt: new Date(),
        durationMs,
        scanned: result.scanned,
        statusUpdates: result.statusUpdates,
        remindersEnqueued: result.remindersEnqueued,
        skippedAlreadySent: result.skippedAlreadySent,
        skippedNoEmail: result.skippedNoEmail,
        skippedNoExpiry: result.skippedNoExpiry,
        expirationDatesBackfilled: result.expirationDatesBackfilled,
      },
    });

    structuredLog({
      event: "cron.scan.completed",
      durationMs,
      scanned: result.scanned,
      statusUpdates: result.statusUpdates,
      remindersEnqueued: result.remindersEnqueued,
      skippedAlreadySent: result.skippedAlreadySent,
      skippedNoEmail: result.skippedNoEmail,
      skippedNoExpiry: result.skippedNoExpiry,
      expirationDatesBackfilled: result.expirationDatesBackfilled,
    });

    return result;
  } catch (error) {
    const durationMs = Date.now() - started;
    const message = error instanceof Error ? error.message : "Cron scan failed";

    await prisma.cronScanLog.update({
      where: { id: logId },
      data: {
        completedAt: new Date(),
        durationMs,
        errorMessage: message,
      },
    });

    structuredLog({
      event: "cron.scan.failed",
      level: "error",
      durationMs,
      error: message,
    });

    throw error;
  }
}

/**
 * Run expiry reminder scan with distributed lock (used by Inngest cron).
 * Throws if another scan holds the lock.
 */
export async function runExpiryReminderScanOnce(): Promise<
  Awaited<ReturnType<typeof runExpiryReminderScan>>
> {
  const env = getEnv();
  const lock = new RedisDistributedLock(LOCK_KEY);
  const acquired = await lock.acquire(env.CRON_LOCK_TTL_SECONDS);

  if (!acquired) {
    await prisma.cronScanLog.create({
      data: { lockSkipped: true, completedAt: new Date(), durationMs: 0 },
    });
    structuredLog({
      event: "cron.scan.skipped",
      level: "warn",
      message: "lock held by another instance",
    });
    throw new Error("Another cron instance is already running the expiry scan.");
  }

  lock.startRenewal(env.CRON_LOCK_TTL_SECONDS);

  try {
    structuredLog({ event: "cron.scan.manual_started" });
    return await runScanWithLogging();
  } finally {
    await lock.release();
  }
}

export async function listRecentCronScans(limit = 10) {
  return prisma.cronScanLog.findMany({
    orderBy: { startedAt: "desc" },
    take: limit,
  });
}
