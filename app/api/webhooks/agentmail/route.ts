import { jsonError, jsonOk } from "@/lib/api-response";
import { processAgentMailWebhook } from "@/lib/services/webhook-intake";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const result = await processAgentMailWebhook(payload);

    return jsonOk(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Webhook processing failed.";
    console.error("AgentMail webhook error:", error);
    return jsonError(message, 500);
  }
}
