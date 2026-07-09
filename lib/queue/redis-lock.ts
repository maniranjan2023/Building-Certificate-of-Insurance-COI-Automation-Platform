import { randomUUID } from "crypto";
import Redis from "ioredis";
import { getRedisUrl } from "@/lib/env";

let redisClient: Redis | null = null;

function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis(getRedisUrl(), { maxRetriesPerRequest: 3 });
  }
  return redisClient;
}

const LOCK_PREFIX = "coi:cron-lock:";

const RELEASE_SCRIPT = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
else
  return 0
end
`;

const RENEW_SCRIPT = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("expire", KEYS[1], ARGV[2])
else
  return 0
end
`;

export class RedisDistributedLock {
  private readonly key: string;
  private readonly token: string;
  private renewTimer: ReturnType<typeof setInterval> | null = null;

  constructor(key: string) {
    this.key = `${LOCK_PREFIX}${key}`;
    this.token = randomUUID();
  }

  async acquire(ttlSeconds: number): Promise<boolean> {
    const redis = getRedisClient();
    const result = await redis.set(this.key, this.token, "EX", ttlSeconds, "NX");
    return result === "OK";
  }

  /** Extend TTL while scan is running (prevents overlap on long scans). */
  startRenewal(ttlSeconds: number, intervalMs = 15_000): void {
    this.stopRenewal();
    this.renewTimer = setInterval(() => {
      void (async () => {
        try {
          const redis = getRedisClient();
          await redis.eval(RENEW_SCRIPT, 1, this.key, this.token, String(ttlSeconds));
        } catch {
          // Renewal failure is non-fatal; lock will expire naturally.
        }
      })();
    }, intervalMs);
  }

  stopRenewal(): void {
    if (this.renewTimer) {
      clearInterval(this.renewTimer);
      this.renewTimer = null;
    }
  }

  async release(): Promise<void> {
    this.stopRenewal();
    const redis = getRedisClient();
    await redis.eval(RELEASE_SCRIPT, 1, this.key, this.token);
  }
}

/** @deprecated Use RedisDistributedLock for token-safe acquire/release. */
export async function acquireDistributedLock(
  key: string,
  ttlSeconds: number
): Promise<boolean> {
  const lock = new RedisDistributedLock(key);
  return lock.acquire(ttlSeconds);
}

/** @deprecated Use RedisDistributedLock.release(). */
export async function releaseDistributedLock(key: string): Promise<void> {
  const redis = getRedisClient();
  await redis.del(`${LOCK_PREFIX}${key}`);
}

export async function closeRedisClient(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}
