import { SignJWT } from "jose/jwt/sign";
import { jwtVerify } from "jose/jwt/verify";
import { getEnv, tryGetEnv } from "@/lib/env";

export const AUTH_COOKIE_NAME = "coi_session";

export interface AdminSession {
  email: string;
  role: "admin";
}

function getJwtSecret(): Uint8Array | null {
  const secret = tryGetEnv()?.JWT_SECRET;
  if (!secret) {
    return null;
  }
  return new TextEncoder().encode(secret);
}

function requireJwtSecret(): Uint8Array {
  const secret = getJwtSecret();
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  return secret;
}

export function getSessionMaxAgeSeconds(): number {
  return tryGetEnv()?.SESSION_MAX_AGE_SECONDS ?? 86400;
}

/**
 * JWT-only session verification for Edge middleware.
 * Does not check Redis revocation — use `verifySessionToken` from `@/lib/auth` on the server.
 */
export async function verifySessionToken(
  token: string
): Promise<AdminSession | null> {
  const secret = getJwtSecret();
  if (!secret) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    if (payload.role !== "admin" || typeof payload.email !== "string") {
      return null;
    }
    return { email: payload.email, role: "admin" };
  } catch {
    return null;
  }
}

export function getSessionCookieOptions(maxAge = getSessionMaxAgeSeconds()) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

/** Re-export for login route — SignJWT is Edge-compatible. */
export async function createSessionToken(
  session: AdminSession,
  jti: string
): Promise<string> {
  return new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256" })
    .setJti(jti)
    .setIssuedAt()
    .setExpirationTime(`${getSessionMaxAgeSeconds()}s`)
    .sign(requireJwtSecret());
}
