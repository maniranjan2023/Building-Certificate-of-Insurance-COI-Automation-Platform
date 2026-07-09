/**
 * Smoke test for Phase 6 ops features (9–16).
 * Run: npm run test:ops
 */
import { getEnv } from "@/lib/env";
import { computeBackoffDelayMs } from "@/lib/queue/backoff";
import { RedisDistributedLock } from "@/lib/queue/redis-lock";
import {
  checkDatabaseHealth,
  checkQueuesHealth,
  checkRedisHealth,
  getFullHealthReport,
} from "@/lib/services/health-check";
import { getQueueMetricsSnapshot } from "@/lib/services/queue-metrics";
import { listRecentCronScans } from "@/lib/cron/expiry-reminder-cron";
import { closeRedisClient } from "@/lib/queue/redis-lock";

async function main(): Promise<void> {
  const env = getEnv();
  const results: Array<{ name: string; ok: boolean; detail: string }> = [];

  function record(name: string, ok: boolean, detail: string) {
    results.push({ name, ok, detail });
    console.log(`${ok ? "PASS" : "FAIL"} — ${name}: ${detail}`);
  }

  record(
    "Worker concurrency env",
    env.WORKER_COI_CONCURRENCY >= 1 && env.WORKER_REMINDER_CONCURRENCY >= 1,
    `coi=${env.WORKER_COI_CONCURRENCY}, reminder=${env.WORKER_REMINDER_CONCURRENCY}`
  );

  record(
    "Email rate limit env",
    env.REMINDER_EMAIL_RATE_LIMIT_MAX > 0 && env.REMINDER_EMAIL_RATE_LIMIT_MS >= 1000,
    `${env.REMINDER_EMAIL_RATE_LIMIT_MAX}/${env.REMINDER_EMAIL_RATE_LIMIT_MS}ms`
  );

  const backoff = computeBackoffDelayMs(2);
  record("Backoff jitter", backoff >= env.JOB_BACKOFF_DELAY_MS, `attempt2 delay=${backoff}ms`);

  const lock = new RedisDistributedLock("ops-test-lock");
  const acquired = await lock.acquire(30);
  record("Distributed lock acquire", acquired, acquired ? "lock acquired" : "lock denied");
  if (acquired) {
    lock.startRenewal(30, 1000);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    await lock.release();
    record("Distributed lock release", true, "released with token");
  }

  const db = await checkDatabaseHealth();
  record("Health /database", db.status === "ok", db.message ?? db.status);

  const redis = await checkRedisHealth();
  record("Health /redis", redis.status === "ok", redis.message ?? redis.status);

  const queues = await checkQueuesHealth();
  record("Health /queue", queues.status !== "error", queues.message ?? queues.status);

  const full = await getFullHealthReport();
  record("Health /health aggregate", full.status !== "error", full.status);

  const metrics = await getQueueMetricsSnapshot();
  record(
    "Queue metrics snapshot",
    metrics.queues.length === 4,
    `${metrics.queues.length} queues sampled`
  );

  const scans = await listRecentCronScans(3);
  record("Cron scan logs readable", Array.isArray(scans), `${scans.length} recent scan(s)`);

  await closeRedisClient();

  const failed = results.filter((entry) => !entry.ok).length;
  console.log(`\n${results.length - failed}/${results.length} checks passed`);
  if (failed > 0) process.exit(1);
}

main().catch((error) => {
  console.error("Ops test failed:", error);
  process.exit(1);
});
