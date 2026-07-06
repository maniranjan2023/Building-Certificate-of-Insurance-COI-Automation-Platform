import { describe, expect, it } from "vitest";
import { riskAgentOutputSchema } from "@/lib/ai/schemas";

describe("riskAgentOutputSchema", () => {
  it("accepts mandatoryFailures as strings", () => {
    const result = riskAgentOutputSchema.safeParse({
      overallRisk: "high",
      mandatoryFailures: [
        "General liability per occurrence limit",
        "Landlord named as additional insured",
      ],
      optionalIssues: ["Waiver of subrogation"],
      lowConfidenceFields: [],
      recommendationHint: "reject",
      confidenceScore: 0.9,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.mandatoryFailures).toHaveLength(2);
      expect(result.data.mandatoryFailures[0]).toEqual({
        item: "General liability per occurrence limit",
        status: "FAIL",
        blocksAcceptance: true,
      });
    }
  });

  it("accepts mandatoryFailures as objects", () => {
    const result = riskAgentOutputSchema.safeParse({
      overallRisk: "medium",
      mandatoryFailures: [
        {
          item: "Policy expiration date",
          status: "FAIL",
          blocksAcceptance: true,
        },
      ],
      optionalIssues: [],
      lowConfidenceFields: ["carrierName"],
      recommendationHint: "manual_review",
      confidenceScore: "0.82",
    });

    expect(result.success).toBe(true);
  });
});
