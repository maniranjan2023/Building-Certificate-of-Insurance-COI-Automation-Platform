import { afterEach, describe, expect, it, vi } from "vitest";
import * as envModule from "@/lib/env";
import {
  WebhookAuthError,
  verifyAgentMailWebhook,
} from "@/lib/security/webhook-auth";

describe("webhook auth", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("accepts matching bearer token when secret is configured", () => {
    vi.spyOn(envModule, "tryGetEnv").mockReturnValue({
      AGENTMAIL_WEBHOOK_SECRET: "test-secret",
    } as ReturnType<typeof envModule.tryGetEnv>);

    const request = new Request("http://localhost/api/webhooks/agentmail", {
      method: "POST",
      headers: { authorization: "Bearer test-secret" },
    });

    expect(() => verifyAgentMailWebhook(request)).not.toThrow();
  });

  it("rejects invalid bearer token", () => {
    vi.spyOn(envModule, "tryGetEnv").mockReturnValue({
      AGENTMAIL_WEBHOOK_SECRET: "test-secret",
    } as ReturnType<typeof envModule.tryGetEnv>);

    const request = new Request("http://localhost/api/webhooks/agentmail", {
      method: "POST",
      headers: { authorization: "Bearer wrong-secret" },
    });

    expect(() => verifyAgentMailWebhook(request)).toThrow(WebhookAuthError);
  });
});
