import { cookies } from "next/headers";
import {
  AUTH_COOKIE_NAME,
  verifySessionToken,
  type AdminSession,
} from "@/lib/auth";
import { jsonUnauthorized } from "@/lib/api-response";
import { verifyHealthBearer } from "@/lib/security/health-auth";

export async function requireApiSession(): Promise<AdminSession | Response> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return jsonUnauthorized();
  }

  const session = await verifySessionToken(token);
  if (!session) {
    return jsonUnauthorized();
  }

  return session;
}

/** Health probes: bearer secret OR revoked-aware admin session. */
export async function requireHealthOrAdminSession(
  request: Request
): Promise<AdminSession | null | Response> {
  if (verifyHealthBearer(request.headers.get("authorization"))) {
    return null;
  }
  return requireApiSession();
}

export function isSessionResponse(
  value: AdminSession | Response
): value is Response {
  return value instanceof Response;
}
