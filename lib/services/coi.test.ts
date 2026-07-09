import { describe, expect, it } from "vitest";
import { CoiValidationError, validateCoiBuffer, validateCoiFile } from "@/lib/services/coi";

function createFile(name: string, type: string, size: number): File {
  const content = new Uint8Array(size);
  return new File([content], name, { type });
}

describe("validateCoiFile", () => {
  it("accepts a valid PDF", () => {
    expect(() =>
      validateCoiFile(createFile("coi.pdf", "application/pdf", 1024))
    ).not.toThrow();
  });

  it("rejects unsupported file types", () => {
    expect(() =>
      validateCoiFile(createFile("notes.txt", "text/plain", 100))
    ).toThrow(CoiValidationError);
  });

  it("rejects buffers whose magic bytes do not match MIME type", () => {
    const fakePdf = Buffer.from("not a real pdf");
    expect(() => validateCoiBuffer(fakePdf, "application/pdf")).toThrow(
      CoiValidationError
    );
  });

  it("accepts a valid PDF buffer", () => {
    const pdf = Buffer.from("%PDF-1.4\n%fake");
    expect(() => validateCoiBuffer(pdf, "application/pdf")).not.toThrow();
  });
});
