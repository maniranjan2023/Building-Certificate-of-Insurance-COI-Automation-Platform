import { getOptionalRedis } from "@/lib/security/redis-client";

const REVOKED_PREFIX = "session:revoked:";

export async function revokeSessionToken(token: string): Promise<void> {
  const redis = getOptionalRedis();
  if (!redis) {
    return;
  }

  try {
    const { decodeJwt } = await import("jose");
    const payload = decodeJwt(token);
    const jti = typeof payload.jti === "string" ? payload.jti : null;
    if (!jti) {
      return;
    }

    const { getEnv } = await import("@/lib/env");
    const ttlSeconds = getEnv().SESSION_MAX_AGE_SECONDS;
    await redis.set(`${REVOKED_PREFIX}${jti}`, "1", "EX", ttlSeconds);
  } catch {
    // Ignore malformed tokens on logout.
  }
}

export async function isSessionRevoked(jti: string | undefined): Promise<boolean> {
  if (!jti) {
    return false;
  }

  const redis = getOptionalRedis();
  if (!redis) {
    return false;
  }

  const value = await redis.get(`${REVOKED_PREFIX}${jti}`);
  return value === "1";
}
