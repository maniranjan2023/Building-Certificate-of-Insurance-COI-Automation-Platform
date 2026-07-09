import { afterEach, describe, expect, it, vi } from "vitest";
import * as envModule from "@/lib/env";
import { getClientIp } from "@/lib/security/trusted-proxy";

describe("trusted-proxy", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("ignores X-Forwarded-For when no trusted proxies configured", () => {
    vi.spyOn(envModule, "tryGetEnv").mockReturnValue({} as ReturnType<
      typeof envModule.tryGetEnv
    >);

    const request = new Request("http://localhost/api", {
      headers: { "x-forwarded-for": "spoofed, 1.2.3.4" },
    });

    expect(getClientIp(request)).toBe("spoofed");
  });

  it("uses rightmost X-Forwarded-For hop when proxies are trusted", () => {
    vi.spyOn(envModule, "tryGetEnv").mockReturnValue({
      TRUSTED_PROXY_IPS: "10.0.0.1",
    } as ReturnType<typeof envModule.tryGetEnv>);

    const request = new Request("http://localhost/api", {
      headers: { "x-forwarded-for": "spoofed, 203.0.113.10" },
    });

    expect(getClientIp(request)).toBe("203.0.113.10");
  });
});
