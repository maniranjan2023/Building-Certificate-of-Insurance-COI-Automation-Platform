import { timingSafeEqual } from "crypto";
import { getEnv, tryGetEnv } from "@/lib/env";

export class WebhookAuthError extends Error {
  constructor(message = "Invalid webhook credentials") {
    super(message);
    this.name = "WebhookAuthError";
  }
}

function secretsMatch(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}

function isLocalDatabaseUrl(databaseUrl: string | undefined): boolean {
  if (!databaseUrl) {
    return true;
  }
  return /localhost|127\.0\.0\.1/i.test(databaseUrl);
}

export function verifyAgentMailWebhook(request: Request): void {
  const env = tryGetEnv();
  const secret = env?.AGENTMAIL_WEBHOOK_SECRET?.trim();

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new WebhookAuthError("Webhook secret is not configured.");
    }

    const allowInsecure = env?.ALLOW_INSECURE_WEBHOOK === "true";
    const localDb = isLocalDatabaseUrl(env?.DATABASE_URL);

    if (!allowInsecure && !localDb) {
      throw new WebhookAuthError(
        "AGENTMAIL_WEBHOOK_SECRET is required for non-local deployments."
      );
    }
    return;
  }

  const authorization = request.headers.get("authorization");
  const bearer =
    authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() : null;
  const headerSecret = request.headers.get("x-agentmail-webhook-secret")?.trim();
  const provided = bearer ?? headerSecret;

  if (!provided || !secretsMatch(provided, secret)) {
    throw new WebhookAuthError();
  }
}

export function isWebhookAuthConfigured(): boolean {
  return Boolean(getEnv().AGENTMAIL_WEBHOOK_SECRET?.trim());
}
