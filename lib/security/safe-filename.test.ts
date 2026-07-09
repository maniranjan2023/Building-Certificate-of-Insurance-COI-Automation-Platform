import { describe, expect, it } from "vitest";
import {
  contentDispositionInline,
  sanitizeDownloadFilename,
} from "@/lib/security/safe-filename";

describe("safe-filename", () => {
  it("sanitizes path traversal and quotes", () => {
    expect(sanitizeDownloadFilename('../../../etc/passwd\r\n"')).not.toMatch(
      /[\\/"]/
    );
  });

  it("falls back when name is empty after sanitization", () => {
    expect(sanitizeDownloadFilename("   ")).toBe("document.pdf");
  });

  it("builds RFC 5987 Content-Disposition header", () => {
    const header = contentDispositionInline("COI Report (v2).pdf");
    expect(header).toContain('filename="');
    expect(header).toContain("filename*=UTF-8''");
  });
});
