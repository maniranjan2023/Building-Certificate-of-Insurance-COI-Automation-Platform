export const CHECKLIST_CATEGORIES = [
  "General Liability",
  "Additional Insured",
  "Policy Dates",
  "Endorsements",
  "Carrier",
  "Certificate Holder",
] as const;

export type ChecklistCategory = (typeof CHECKLIST_CATEGORIES)[number];

export const DEFAULT_CHECKLIST_ITEMS: Array<{
  requirement: string;
  expectedValue: string;
  mandatory: boolean;
  category: ChecklistCategory;
  sortOrder: number;
}> = [
  {
    requirement: "General liability per occurrence limit",
    expectedValue: "$1,000,000 minimum",
    mandatory: true,
    category: "General Liability",
    sortOrder: 1,
  },
  {
    requirement: "General liability aggregate limit",
    expectedValue: "$2,000,000 minimum",
    mandatory: true,
    category: "General Liability",
    sortOrder: 2,
  },
  {
    requirement: "Landlord named as additional insured",
    expectedValue: "Landlord / property manager on COI",
    mandatory: true,
    category: "Additional Insured",
    sortOrder: 3,
  },
  {
    requirement: "Policy effective date",
    expectedValue: "On or before lease start",
    mandatory: true,
    category: "Policy Dates",
    sortOrder: 4,
  },
  {
    requirement: "Policy expiration date",
    expectedValue: "Covers full lease term",
    mandatory: true,
    category: "Policy Dates",
    sortOrder: 5,
  },
  {
    requirement: "Waiver of subrogation",
    expectedValue: "Included or endorsed",
    mandatory: false,
    category: "Endorsements",
    sortOrder: 6,
  },
  {
    requirement: "Primary and non-contributory",
    expectedValue: "Included or endorsed",
    mandatory: false,
    category: "Endorsements",
    sortOrder: 7,
  },
  {
    requirement: "Carrier AM Best rating",
    expectedValue: "A- or better",
    mandatory: false,
    category: "Carrier",
    sortOrder: 8,
  },
  {
    requirement: "Certificate holder name and address",
    expectedValue: "Matches landlord records",
    mandatory: true,
    category: "Certificate Holder",
    sortOrder: 9,
  },
];
