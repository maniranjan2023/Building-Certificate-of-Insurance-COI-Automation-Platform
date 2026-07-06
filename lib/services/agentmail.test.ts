import { describe, expect, it } from "vitest";
import {
  parseSenderEmail,
  pickCoiAttachment,
  getMessageFromField,
} from "@/lib/services/agentmail";
import { getWebhookEventType } from "@/lib/services/webhook-intake";

describe("agentmail helpers", () => {
  it("parses sender email from angle brackets", () => {
    expect(parseSenderEmail(["Tenant Name <tenant@example.com>"])).toBe(
      "tenant@example.com"
    );
  });

  it("parses sender email from plain string (AgentMail webhook format)", () => {
    expect(parseSenderEmail("Tenant Name <tenant@example.com>")).toBe(
      "tenant@example.com"
    );
    expect(parseSenderEmail("tenant@example.com")).toBe("tenant@example.com");
  });

  it("reads from field on webhook message", () => {
    expect(
      getMessageFromField({ from: "Sender <sender@test.com>", message_id: "m1" })
    ).toBe("sender@test.com");
  });

  it("picks the first valid COI attachment", () => {
    const attachment = pickCoiAttachment([
      { filename: "notes.txt", content_type: "text/plain" },
      { filename: "coi.pdf", content_type: "application/pdf" },
    ]);

    expect(attachment?.filename).toBe("coi.pdf");
  });

  it("returns null when no valid attachment exists", () => {
    expect(pickCoiAttachment([{ content_type: "text/plain" }])).toBeNull();
  });
});

describe("webhook intake helpers", () => {
  it("reads event type from payload", () => {
    expect(getWebhookEventType({ event_type: "message.received" })).toBe(
      "message.received"
    );
    expect(getWebhookEventType({ type: "message.received" })).toBe(
      "message.received"
    );
  });
});
