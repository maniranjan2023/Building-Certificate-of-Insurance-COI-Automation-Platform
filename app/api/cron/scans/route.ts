import { listRecentCronScans } from "@/lib/cron/expiry-reminder-cron";
import { jsonOk } from "@/lib/api-response";

export async function GET() {
  const scans = await listRecentCronScans(15);
  return jsonOk(scans);
}
