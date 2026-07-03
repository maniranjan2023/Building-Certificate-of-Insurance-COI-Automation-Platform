import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { resetEnvCache } from "@/lib/env";
import { getDefaultJobOptions } from "@/lib/queue/job-options";

describe("getDefaultJobOptions", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    resetEnvCache();
    process.env = {
      ...originalEnv,
      DATABASE_URL: "postgresql://test",
      JWT_SECRET: "x".repeat(32),
      ADMIN_EMAIL: "admin@example.com",
      ADMIN_PASSWORD: "password",
      CLOUDINARY_CLOUD_NAME: "test",
      CLOUDINARY_API_KEY: "test-key",
      CLOUDINARY_API_SECRET: "test-secret",
      JOB_MAX_ATTEMPTS: "5",
      JOB_BACKOFF_DELAY_MS: "5000",
    };
  });

  afterEach(() => {
    resetEnvCache();
    process.env = originalEnv;
  });

  it("returns exponential backoff settings", () => {
    const options = getDefaultJobOptions();
    expect(options.attempts).toBe(5);
    expect(options.backoff).toEqual({ type: "exponential", delay: 5000 });
    expect(options.removeOnFail).toBe(false);
  });
});
