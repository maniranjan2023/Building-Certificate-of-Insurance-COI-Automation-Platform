import { listCoiJobs } from "@/lib/services/jobs";
import { jsonError, jsonOk } from "@/lib/api-response";
import { jsonInternalError } from "@/lib/api/handle-route-error";
import {
  isSessionResponse,
  requireApiSession,
} from "@/lib/api/require-api-session";

export async function GET() {
  const session = await requireApiSession();
  if (isSessionResponse(session)) return session;
  try {
    const jobs = await listCoiJobs();
    return jsonOk(jobs);
  } catch (error) {
    return jsonInternalError(error, "jobs");
  }
}
