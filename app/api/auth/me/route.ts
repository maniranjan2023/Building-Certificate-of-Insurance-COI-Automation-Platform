import { jsonOk } from "@/lib/api-response";
import {
  isSessionResponse,
  requireApiSession,
} from "@/lib/api/require-api-session";

export async function GET() {
  const session = await requireApiSession();
  if (isSessionResponse(session)) return session;
  return jsonOk(session);
}
