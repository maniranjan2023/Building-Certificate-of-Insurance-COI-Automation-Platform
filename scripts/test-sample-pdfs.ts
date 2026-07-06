/**
 * End-to-end smoke test mirroring production pipeline (LlamaParse + LLM + reconcile).
 * Usage: npx tsx --env-file=.env scripts/test-sample-pdfs.ts
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  runChecklistAgent,
  runExtractionAgent,
} from "@/lib/ai/agents";
import { reconcileChecklistResults } from "@/lib/ai/checklist-rules";
import { parseDocumentBuffer } from "@/lib/ai/llamaparse";
import { DEFAULT_CHECKLIST_ITEMS } from "@/lib/constants/checklist-categories";

const ROOT = join(import.meta.dirname ?? __dirname, "..");

const checklist = DEFAULT_CHECKLIST_ITEMS.map((d, i) => ({
  ...d,
  id: `test-${i}`,
  enabled: true,
  createdAt: new Date(),
  updatedAt: new Date(),
}));

interface SampleSpec {
  file: string;
  expectAllPassed: boolean;
  expectMandatoryFailures: string[];
}

const SAMPLES: SampleSpec[] = [
  {
    file: "coi-sample-compliant.pdf",
    expectAllPassed: true,
    expectMandatoryFailures: [],
  },
  {
    file: "coi-sample-noncompliant.pdf",
    expectAllPassed: false,
    expectMandatoryFailures: [
      "General liability per occurrence limit",
      "General liability aggregate limit",
      "Landlord named as additional insured",
      "Policy expiration date",
      "Certificate holder name and address",
    ],
  },
];

async function testSample(spec: SampleSpec): Promise<boolean> {
  const path = join(ROOT, spec.file);
  const buffer = readFileSync(path);
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Testing: ${spec.file}`);
  console.log("=".repeat(60));

  const parsed = await parseDocumentBuffer(buffer, spec.file, "application/pdf");
  const ocrText = [parsed.text, parsed.markdown].filter(Boolean).join("\n\n");
  const itemCount = parsed.layoutPages.reduce((n, p) => n + p.textItems.length, 0);
  console.log(`OCR length: ${parsed.text.length}, layout textItems: ${itemCount}`);

  const extraction = await runExtractionAgent(ocrText);
  const llmResult = await runChecklistAgent(extraction, checklist, ocrText);
  const checklistResult = reconcileChecklistResults({
    llmResult,
    extraction,
    checklist,
    documentText: ocrText,
  });

  console.log(`\nLLM allPassed: ${llmResult.allPassed} → Final allPassed: ${checklistResult.allPassed}`);
  console.log(`Mandatory failures: ${JSON.stringify(checklistResult.mandatoryFailures)}`);
  for (const item of checklistResult.items) {
    const mark = item.status === "PASS" ? "✓" : item.status === "FAIL" ? "✗" : "?";
    console.log(`  ${mark} [${item.status}] ${item.label}`);
  }

  const passAll = checklistResult.allPassed === spec.expectAllPassed;
  const failuresMatch =
    spec.expectAllPassed ||
    spec.expectMandatoryFailures.every((f) =>
      checklistResult.mandatoryFailures.includes(f)
    );
  const layoutOk = itemCount >= 8;

  console.log("\n--- Assertions ---");
  console.log(`  final allPassed: ${passAll ? "PASS" : "FAIL"}`);
  console.log(`  mandatory failures: ${failuresMatch ? "PASS" : "FAIL"}`);
  console.log(`  layout items: ${layoutOk ? "PASS" : "FAIL"}`);

  return passAll && failuresMatch && layoutOk;
}

async function main() {
  let allOk = true;
  for (const spec of SAMPLES) {
    try {
      allOk = allOk && (await testSample(spec));
    } catch (error) {
      allOk = false;
      console.error(`ERROR testing ${spec.file}:`, error);
    }
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(allOk ? "OVERALL: ALL SAMPLE PDF TESTS PASSED" : "OVERALL: SOME TESTS FAILED");
  console.log("=".repeat(60));
  process.exit(allOk ? 0 : 1);
}

main();
