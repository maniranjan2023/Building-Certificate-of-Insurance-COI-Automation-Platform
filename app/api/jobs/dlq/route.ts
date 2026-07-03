import { listDlqJobs } from "@/lib/services/jobs";
import { jsonError, jsonOk } from "@/lib/api-response";

export async function GET() {
  try {
    const jobs = await listDlqJobs();
    return jsonOk(jobs);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load DLQ jobs.";
    return jsonError(message, 500);
  }
}
