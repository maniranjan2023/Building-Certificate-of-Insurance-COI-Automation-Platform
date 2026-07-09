import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, getSessionCookieOptions } from "@/lib/auth";
import { jsonOk } from "@/lib/api-response";
import { revokeSessionToken } from "@/lib/security/session-revocation";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (token) {
    await revokeSessionToken(token);
  }
  cookieStore.set(AUTH_COOKIE_NAME, "", getSessionCookieOptions(0));
  return jsonOk({ signedOut: true });
}
