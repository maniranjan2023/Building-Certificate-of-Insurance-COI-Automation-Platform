import { tryGetEnv } from "@/lib/env";

/** Constant-time string compare — Edge Runtime compatible (no Node `crypto`). */
function secretsMatch(provided: string, expected: string): boolean {
  if (provided.length !== expected.length) {
    return false;
  }

  const a = new TextEncoder().encode(provided);
  const b = new TextEncoder().encode(expected);
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i]! ^ b[i]!;
  }
  return diff === 0;
}

export function verifyHealthBearer(authorization: string | null): boolean {
  const secret = tryGetEnv()?.HEALTH_CHECK_SECRET?.trim();
  if (!secret) {
    return false;
  }

  const bearer =
    authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() : null;
  if (!bearer) {
    return false;
  }

  return secretsMatch(bearer, secret);
}
