import { getEnv } from "@/lib/env";
import { getOptionalRedis } from "@/lib/security/redis-client";

export class DlqRateLimitError extends Error {
  constructor(message = "DLQ retry rate limit exceeded. Try again later.") {
    super(message);
    this.name = "DlqRateLimitError";
  }
}

const memoryCounters = new Map<string, { count: number; resetAt: number }>();

function incrementMemoryCounter(
  key: string,
  max: number,
  windowSeconds: number
): void {
  const now = Date.now();
  const entry = memoryCounters.get(key);

  if (!entry || entry.resetAt <= now) {
    memoryCounters.set(key, {
      count: 1,
      resetAt: now + windowSeconds * 1000,
    });
    return;
  }

  if (entry.count >= max) {
    throw new DlqRateLimitError();
  }

  entry.count += 1;
}

async function incrementRedisCounter(
  key: string,
  max: number,
  windowSeconds: number
): Promise<void> {
  const redis = getOptionalRedis();
  if (!redis) {
    incrementMemoryCounter(key, max, windowSeconds);
    return;
  }

  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, windowSeconds);
  }
  if (count > max) {
    throw new DlqRateLimitError();
  }
}

export async function assertDlqRetryAllowed(ip: string, jobId: string): Promise<void> {
  const env = getEnv();
  await incrementRedisCounter(
    `dlq:retry:ip:${ip}`,
    env.DLQ_RETRY_RATE_LIMIT_MAX,
    env.DLQ_RETRY_RATE_LIMIT_WINDOW_SECONDS
  );
  await incrementRedisCounter(
    `dlq:retry:job:${jobId}`,
    env.DLQ_RETRY_PER_JOB_MAX,
    env.DLQ_RETRY_PER_JOB_WINDOW_SECONDS
  );
}
