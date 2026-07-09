import { getEnv } from "@/lib/env";
import { getOptionalRedis } from "@/lib/security/redis-client";

export class WebhookRateLimitError extends Error {
  constructor(message = "Webhook rate limit exceeded.") {
    super(message);
    this.name = "WebhookRateLimitError";
  }
}

const memoryCounters = new Map<string, { count: number; resetAt: number }>();

function incrementMemory(key: string, max: number, windowSeconds: number): void {
  const now = Date.now();
  const entry = memoryCounters.get(key);

  if (!entry || entry.resetAt <= now) {
    memoryCounters.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return;
  }

  if (entry.count >= max) {
    throw new WebhookRateLimitError();
  }

  entry.count += 1;
}

async function incrementRedis(
  key: string,
  max: number,
  windowSeconds: number
): Promise<void> {
  const redis = getOptionalRedis();
  if (!redis) {
    incrementMemory(key, max, windowSeconds);
    return;
  }

  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, windowSeconds);
  }
  if (count > max) {
    throw new WebhookRateLimitError();
  }
}

export async function assertWebhookAutoReplyAllowed(
  senderEmail: string
): Promise<void> {
  const env = getEnv();
  const key = `webhook:autoreply:${senderEmail.toLowerCase()}`;
  await incrementRedis(
    key,
    env.WEBHOOK_AUTOREPLY_RATE_LIMIT_MAX,
    env.WEBHOOK_AUTOREPLY_RATE_LIMIT_WINDOW_SECONDS
  );
}

export async function assertWebhookIntakeAllowed(ip: string): Promise<void> {
  const env = getEnv();
  const key = `webhook:intake:ip:${ip}`;
  await incrementRedis(
    key,
    env.WEBHOOK_INTAKE_RATE_LIMIT_MAX,
    env.WEBHOOK_INTAKE_RATE_LIMIT_WINDOW_SECONDS
  );
}
