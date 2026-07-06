import { evaluateChecklistDeterministic } from "@/lib/ai/checklist-rules";
import { DEFAULT_CHECKLIST_ITEMS } from "@/lib/constants/checklist-categories";

const checklist = DEFAULT_CHECKLIST_ITEMS.map((d, i) => ({
  ...d,
  id: `id-${i}`,
  enabled: true,
  createdAt: new Date(),
  updatedAt: new Date(),
}));

const badText = `
Each Occurrence $300,000
General Aggregate $500,000
Additional Insured: None. This certificate does not add Oakwood Property Management LLC as an additional insured.
Effective 05/01/2026 Expiration 05/31/2026
CERTIFICATE HOLDER Bayline Tenant Services LLC
400 Harbour Lane Tampa FL 33602
Coastal Mutual Insurance Company
`;

const result = evaluateChecklistDeterministic({
  extraction: {
    carrierName: "Coastal Mutual",
    policyNumber: "RB-441902",
    namedInsured: "Riverbend Catering Co.",
    additionalInsured: null,
    certificateHolder: "Bayline Tenant Services LLC",
    effectiveDate: "05/01/2026",
    expirationDate: "05/31/2026",
    generalLiabilityLimit: "$300,000",
    endorsements: [],
  },
  checklist,
  documentText: badText,
});

console.log("allPassed:", result.allPassed);
console.log("mandatoryFailures:", result.mandatoryFailures);
for (const item of result.items.filter((i) => i.status !== "PASS")) {
  console.log(item.status, "-", item.label);
}

const goodText = `
Each Occurrence $1,000,000
General Aggregate $2,000,000
Oakwood Property Management LLC is included as Additional Insured
Waiver of subrogation applies
primary and non-contributory basis
AM Best Rating: A+
CERTIFICATE HOLDER Oakwood Property Management LLC
1200 Commerce Street Dallas TX 75201
Effective 01/01/2026 Expiration 01/01/2027
`;

const good = evaluateChecklistDeterministic({
  extraction: {
    carrierName: "Hartford Fire Insurance Company",
    policyNumber: "CGL-7845291",
    namedInsured: "Sunrise Property Services LLC",
    additionalInsured: "Oakwood Property Management LLC",
    certificateHolder: "Oakwood Property Management LLC",
    effectiveDate: "01/01/2026",
    expirationDate: "01/01/2027",
    generalLiabilityLimit: "$1,000,000",
    endorsements: [],
  },
  checklist,
  documentText: goodText,
});

console.log("\n--- compliant ---");
console.log("allPassed:", good.allPassed);
console.log("mandatoryFailures:", good.mandatoryFailures);

const hallucinated = evaluateChecklistDeterministic({
  extraction: {
    carrierName: "Coastal Mutual",
    policyNumber: "RB-441902",
    namedInsured: "Riverbend",
    additionalInsured: "Oakwood Property Management LLC",
    certificateHolder: "Oakwood Property Management LLC",
    effectiveDate: "01/01/2026",
    expirationDate: "01/01/2027",
    generalLiabilityLimit: "$1,000,000",
    endorsements: [],
  },
  checklist,
  documentText: badText,
});

console.log("\n--- hallucinated extraction + bad text ---");
console.log("allPassed:", hallucinated.allPassed);
console.log("mandatoryFailures:", hallucinated.mandatoryFailures);
if (hallucinated.allPassed) {
  process.exitCode = 1;
}
