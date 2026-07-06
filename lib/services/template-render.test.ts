import { describe, expect, it } from "vitest";
import { renderTemplateString } from "./template-render";

describe("renderTemplateString", () => {
  it("fills mustache placeholders", () => {
    const text = renderTemplateString("Hello {{sender_name}}", {
      sender_name: "Riverbend Catering Co.",
    });
    expect(text).toBe("Hello Riverbend Catering Co.");
  });

  it("fills legacy bracket signature placeholders", () => {
    const text = renderTemplateString(
      "Thank you,\n[Your Name]\n[Your Title]\n[Company]",
      {
        signatory_name: "Jane Smith",
        signatory_title: "Compliance Coordinator",
        company_name: "Oakwood Property Management LLC",
      }
    );
    expect(text).toBe(
      "Thank you,\nJane Smith\nCompliance Coordinator\nOakwood Property Management LLC"
    );
  });

  it("leaves unknown bracket text unchanged", () => {
    const text = renderTemplateString("See [section 4.2] for details.", {});
    expect(text).toBe("See [section 4.2] for details.");
  });
});
