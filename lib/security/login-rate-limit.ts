import { getEnv } from "@/lib/env";
import { getOptionalRedis } from "@/lib/security/redis-client";
import { getClientIp } from "@/lib/security/trusted-proxy";

export { getClientIp };

export class LoginRateLimitError extends Error {
  constructor(message = "Too many login attempts. Try again later.") {
    super(message);
    this.name = "LoginRateLimitError";
  }
}

const memoryAttempts = new Map<string, { count: number; resetAt: number }>();

function memoryKey(ip: string, email: string): string {
  return `${ip}:${email.toLowerCase()}`;
}

function checkMemoryLimit(key: string, max: number, windowSeconds: number): void {
  const now = Date.now();
  const entry = memoryAttempts.get(key);

  if (!entry || entry.resetAt <= now) {
    memoryAttempts.set(key, {
      count: 1,
      resetAt: now + windowSeconds * 1000,
    });
    return;
  }

  if (entry.count >= max) {
    throw new LoginRateLimitError();
  }

  entry.count += 1;
}

export async function assertLoginAllowed(ip: string, email: string): Promise<void> {
  const env = getEnv();
  const max = env.LOGIN_RATE_LIMIT_MAX;
  const windowSeconds = env.LOGIN_RATE_LIMIT_WINDOW_SECONDS;
  const key = `login:attempts:${ip}:${email.toLowerCase()}`;

  const redis = getOptionalRedis();
  if (!redis) {
    checkMemoryLimit(memoryKey(ip, email), max, windowSeconds);
    return;
  }

  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, windowSeconds);
  }
  if (count > max) {
    throw new LoginRateLimitError();
  }
}

export async function clearLoginAttempts(ip: string, email: string): Promise<void> {
  const key = `login:attempts:${ip}:${email.toLowerCase()}`;
  memoryAttempts.delete(memoryKey(ip, email));

  const redis = getOptionalRedis();
  if (redis) {
    await redis.del(key).catch(() => undefined);
  }
}
