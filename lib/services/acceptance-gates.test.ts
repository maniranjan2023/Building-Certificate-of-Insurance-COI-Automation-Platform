import { describe, expect, it } from "vitest";
import { evaluateAcceptanceEligibility } from "@/lib/services/acceptance-gates";

describe("acceptance gates", () => {
  it("blocks accept when checklist not passed", () => {
    const result = evaluateAcceptanceEligibility({
      checklistResults: {
        items: [
          {
            checklistItemId: "1",
            label: "General liability limit",
            status: "FAIL",
            evidence: "Too low",
            mandatory: true,
          },
        ],
        mandatoryFailures: ["General liability limit"],
        allPassed: false,
      },
      extractedFields: {
        carrierName: "Test Co",
        policyNumber: "P1",
        namedInsured: "Tenant",
        additionalInsured: "Landlord",
        certificateHolder: "Landlord",
        effectiveDate: "01/01/2026",
        expirationDate: "01/01/2027",
        generalLiabilityLimit: "$1,000,000",
        endorsements: [],
      },
    });

    expect(result.canAccept).toBe(false);
    expect(result.checklistPassed).toBe(false);
  });

  it("blocks accept when policy is expired", () => {
    const result = evaluateAcceptanceEligibility({
      checklistResults: {
        items: [
          {
            checklistItemId: "1",
            label: "Policy expiration date",
            status: "PASS",
            evidence: "ok",
            mandatory: true,
          },
        ],
        mandatoryFailures: [],
        allPassed: true,
      },
      extractedFields: {
        carrierName: "Test Co",
        policyNumber: "P1",
        namedInsured: "Tenant",
        additionalInsured: "Landlord",
        certificateHolder: "Landlord",
        effectiveDate: "01/01/2024",
        expirationDate: "01/01/2025",
        generalLiabilityLimit: "$1,000,000",
        endorsements: [],
      },
    });

    expect(result.canAccept).toBe(false);
    expect(result.expiryValid).toBe(false);
  });

  it("allows accept when checklist passed and expiry in future", () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    const exp = `${future.getMonth() + 1}/${future.getDate()}/${future.getFullYear()}`;

    const result = evaluateAcceptanceEligibility({
      checklistResults: {
        items: [
          {
            checklistItemId: "1",
            label: "Policy expiration date",
            status: "PASS",
            evidence: "ok",
            mandatory: true,
          },
        ],
        mandatoryFailures: [],
        allPassed: true,
      },
      extractedFields: {
        carrierName: "Test Co",
        policyNumber: "P1",
        namedInsured: "Tenant",
        additionalInsured: "Landlord",
        certificateHolder: "Landlord",
        effectiveDate: "01/01/2026",
        expirationDate: exp,
        generalLiabilityLimit: "$1,000,000",
        endorsements: [],
      },
    });

    expect(result.canAccept).toBe(true);
  });
});
