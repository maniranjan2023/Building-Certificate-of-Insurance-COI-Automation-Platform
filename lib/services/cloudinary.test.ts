import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  getEnv: () => ({
    CLOUDINARY_CLOUD_NAME: "demo",
    CLOUDINARY_API_KEY: "key",
    CLOUDINARY_API_SECRET: "secret",
  }),
}));

import { resolveCoiAssetUrl } from "@/lib/services/cloudinary";

describe("resolveCoiAssetUrl", () => {
  it("prefers authenticated signing for authenticated uploads", () => {
    const url = resolveCoiAssetUrl(
      "coi-documents/sample",
      "https://res.cloudinary.com/demo/image/authenticated/s--sig--/v1/coi-documents/sample"
    );
    expect(url).toContain("res.cloudinary.com");
    expect(url).toContain("/image/authenticated/");
    expect(url).toContain("s--");
    expect(url).not.toContain("/auto/");
  });

  it("repairs legacy /auto/authenticated/ stored URLs", () => {
    const url = resolveCoiAssetUrl(
      "coi-documents/sample",
      "https://res.cloudinary.com/demo/auto/authenticated/s--sig--/v1/coi-documents/sample"
    );
    expect(url).toContain("/image/authenticated/");
    expect(url).not.toContain("/auto/");
  });

  it("signs legacy public URLs using resource type from stored URL", () => {
    const url = resolveCoiAssetUrl(
      "coi-documents/legacy",
      "https://res.cloudinary.com/demo/image/upload/v1/coi-documents/legacy.pdf"
    );
    expect(url).toContain("/image/upload/");
    expect(url).toContain("s--");
  });
});
