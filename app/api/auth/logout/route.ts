import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, getSessionCookieOptions } from "@/lib/auth";
import { jsonOk } from "@/lib/api-response";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, "", getSessionCookieOptions(0));
  return jsonOk({ signedOut: true });
}
