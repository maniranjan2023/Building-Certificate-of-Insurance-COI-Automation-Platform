import { jsonError, jsonOk } from "@/lib/api-response";
import { processAgentMailWebhook } from "@/lib/services/webhook-intake";
import { getClientIp } from "@/lib/security/trusted-proxy";
import {
  WebhookAuthError,
  verifyAgentMailWebhook,
} from "@/lib/security/webhook-auth";
import { WebhookRateLimitError } from "@/lib/security/webhook-rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    verifyAgentMailWebhook(request);
    const payload = await request.json();
    const result = await processAgentMailWebhook(payload, {
      clientIp: getClientIp(request),
    });

    return jsonOk(result);
  } catch (error) {
    if (error instanceof WebhookAuthError) {
      return jsonError("Unauthorized", 401);
    }
    if (error instanceof WebhookRateLimitError) {
      return jsonError(error.message, 429);
    }
    console.error("AgentMail webhook error:", error);
    return jsonError("Webhook processing failed.", 500);
  }
}
