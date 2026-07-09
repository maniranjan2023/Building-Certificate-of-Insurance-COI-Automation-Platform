import { describe, expect, it } from "vitest";
import {
  assertBufferMatchesMimeType,
  detectBufferMimeType,
} from "@/lib/security/file-magic";
import { CoiValidationError } from "@/lib/services/coi";

describe("file magic validation", () => {
  it("detects PDF magic bytes", () => {
    const buffer = Buffer.from("%PDF-1.4 fake content");
    expect(detectBufferMimeType(buffer)).toBe("application/pdf");
  });

  it("detects PNG magic bytes", () => {
    const buffer = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00,
    ]);
    expect(detectBufferMimeType(buffer)).toBe("image/png");
  });

  it("rejects content that does not match declared MIME type", () => {
    const buffer = Buffer.from("plain text, not a pdf");
    expect(() => assertBufferMatchesMimeType(buffer, "application/pdf")).toThrow(
      CoiValidationError
    );
  });

  it("rejects unsupported binary content", () => {
    const buffer = Buffer.from([0x00, 0x01, 0x02, 0x03]);
    expect(() => assertBufferMatchesMimeType(buffer, "application/pdf")).toThrow(
      CoiValidationError
    );
  });
});
