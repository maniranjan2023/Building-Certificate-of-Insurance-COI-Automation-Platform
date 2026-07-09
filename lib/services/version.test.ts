import { CoiStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  VersionValidationError,
  updateVersionStatus,
} from "@/lib/services/version";

describe("updateVersionStatus security", () => {
  it("rejects ACCEPTED status changes (must use accept route)", async () => {
    await expect(
      updateVersionStatus("version-id", CoiStatus.ACCEPTED)
    ).rejects.toBeInstanceOf(VersionValidationError);
  });

  it("rejects REJECTED status changes (must use reject route)", async () => {
    await expect(
      updateVersionStatus("version-id", CoiStatus.REJECTED, "reason")
    ).rejects.toBeInstanceOf(VersionValidationError);
  });
});
