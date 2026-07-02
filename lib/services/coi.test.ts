import { describe, expect, it } from "vitest";
import { CoiValidationError, validateCoiFile } from "@/lib/services/coi";

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

  it("rejects files larger than 10 MB", () => {
    expect(() =>
      validateCoiFile(
        createFile("large.pdf", "application/pdf", 10 * 1024 * 1024 + 1)
      )
    ).toThrow(CoiValidationError);
  });
});
