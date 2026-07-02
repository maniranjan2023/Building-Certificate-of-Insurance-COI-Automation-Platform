import { getSession } from "@/lib/auth";
import { jsonOk, jsonUnauthorized } from "@/lib/api-response";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return jsonUnauthorized();
  }
  return jsonOk(session);
}
