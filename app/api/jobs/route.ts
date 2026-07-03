import { listCoiJobs } from "@/lib/services/jobs";
import { jsonError, jsonOk } from "@/lib/api-response";

export async function GET() {
  try {
    const jobs = await listCoiJobs();
    return jsonOk(jobs);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load jobs.";
    return jsonError(message, 500);
  }
}
