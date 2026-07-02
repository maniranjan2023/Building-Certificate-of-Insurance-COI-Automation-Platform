import { z } from "zod";
import { cookies } from "next/headers";
import {
  AUTH_COOKIE_NAME,
  createSessionToken,
  getSessionCookieOptions,
  verifyAdminCredentials,
} from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api-response";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError("Email and password are required.");
    }

    const isValid = await verifyAdminCredentials(
      parsed.data.email,
      parsed.data.password
    );

    if (!isValid) {
      return jsonError("Invalid email or password.", 401);
    }

    const token = await createSessionToken({
      email: parsed.data.email,
      role: "admin",
    });

    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE_NAME, token, getSessionCookieOptions());

    return jsonOk({ email: parsed.data.email });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to sign in.";
    return jsonError(message, 500);
  }
}
