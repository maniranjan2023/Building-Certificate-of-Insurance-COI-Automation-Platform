import { randomUUID } from "crypto";
import { decodeJwt } from "jose/jwt/decode";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { getEnv } from "@/lib/env";
import {
  AUTH_COOKIE_NAME,
  type AdminSession,
  createSessionToken as signSessionToken,
  getSessionCookieOptions,
  verifySessionToken as verifySessionTokenJwt,
} from "@/lib/auth-jwt";
import { isSessionRevoked } from "@/lib/security/session-revocation";

export {
  AUTH_COOKIE_NAME,
  type AdminSession,
  getSessionCookieOptions,
};

export async function verifyAdminCredentials(
  email: string,
  password: string
): Promise<boolean> {
  if (!password || typeof password !== "string") {
    return false;
  }

  const env = getEnv();

  if (email.toLowerCase() !== env.ADMIN_EMAIL.toLowerCase()) {
    return false;
  }

  if (process.env.NODE_ENV === "production") {
    const hash = env.ADMIN_PASSWORD_HASH;
    if (!hash || typeof hash !== "string") {
      return false;
    }
    return bcrypt.compare(password, hash);
  }

  if (env.ADMIN_PASSWORD_HASH) {
    return bcrypt.compare(password, env.ADMIN_PASSWORD_HASH);
  }

  return password === env.ADMIN_PASSWORD;
}

export async function createSessionToken(
  session: AdminSession
): Promise<string> {
  return signSessionToken(session, randomUUID());
}

export async function verifySessionToken(
  token: string
): Promise<AdminSession | null> {
  const session = await verifySessionTokenJwt(token);
  if (!session) {
    return null;
  }

  try {
    const payload = decodeJwt(token);
    if (
      await isSessionRevoked(
        typeof payload.jti === "string" ? payload.jti : undefined
      )
    ) {
      return null;
    }
  } catch {
    return null;
  }

  return session;
}

export async function getSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }
  return verifySessionToken(token);
}

export async function requireSession(): Promise<AdminSession> {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}
