import { describe, expect, it } from "vitest";
import { coiAssetApiPath, coiPdfApiPath } from "@/lib/coi-asset-path";

describe("coi-asset-path", () => {
  it("builds authenticated asset API paths", () => {
    expect(coiAssetApiPath("abc-123")).toBe("/api/coi/abc-123/asset");
    expect(coiPdfApiPath("abc-123")).toBe("/api/coi/abc-123/pdf");
  });
});
