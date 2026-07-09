import { describe, expect, it } from "vitest";
import {
  sanitizeSuggestedEmailBody,
  sanitizeTemplateVariable,
} from "@/lib/security/template-sanitize";

describe("template-sanitize", () => {
  it("strips URLs from template variables", () => {
    expect(sanitizeTemplateVariable("Visit https://evil.example/phish now")).toBe(
      "Visit [link removed] now"
    );
  });

  it("removes payment instruction patterns", () => {
    expect(sanitizeTemplateVariable("Please wire transfer to account 123")).toContain(
      "[payment instruction removed]"
    );
  });

  it("caps length for suggested email bodies", () => {
    const long = "a".repeat(5000);
    expect(sanitizeSuggestedEmailBody(long).length).toBeLessThanOrEqual(4000);
  });
});
