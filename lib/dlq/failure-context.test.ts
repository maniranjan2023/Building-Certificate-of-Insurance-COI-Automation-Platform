import { describe, expect, it } from "vitest";
import {
  buildFailureReason,
  extractErrorDetails,
  extractInngestFailureContext,
} from "@/lib/dlq/failure-context";

describe("failure-context", () => {
  it("extracts Error message and stack", () => {
    const error = new Error("boom");
    const details = extractErrorDetails(error);
    expect(details.message).toBe("boom");
    expect(details.stack).toContain("Error: boom");
  });

  it("extracts JsonError-shaped objects", () => {
    const details = extractErrorDetails({
      name: "Error",
      message: "serialized fail",
      stack: "stack-line",
    });
    expect(details.message).toBe("serialized fail");
    expect(details.stack).toBe("stack-line");
  });

  it("normalizes Inngest onFailure event payloads", () => {
    const ctx = extractInngestFailureContext({
      error: { message: "pipeline crashed" },
      event: {
        data: {
          run_id: "run_123",
          function_id: "process-coi",
          event: {
            name: "coi/process.requested",
            data: {
              coiJobId: "job_1",
              coiDocumentId: "doc_1",
              coiVersionId: "ver_1",
            },
          },
        },
      },
    });

    expect(ctx.eventName).toBe("coi/process.requested");
    expect(ctx.executionId).toBe("run_123");
    expect(ctx.payload.coiJobId).toBe("job_1");
    expect(ctx.errorMessage).toBe("pipeline crashed");
  });

  it("builds dashboard-friendly failure reason", () => {
    const reason = buildFailureReason({
      message: "LlamaParse failed",
      executionId: "run_abc",
      attempt: 1,
      maxAttempts: 5,
    });
    expect(reason).toContain("LlamaParse failed");
    expect(reason).toContain("run=run_abc");
    expect(reason).toContain("attempt=2/5");
  });
});
