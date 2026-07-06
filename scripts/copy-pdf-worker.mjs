import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sources = [
  join(root, "node_modules", "react-pdf", "node_modules", "pdfjs-dist", "build", "pdf.worker.min.mjs"),
  join(root, "node_modules", "pdfjs-dist", "build", "pdf.worker.min.mjs"),
];
const targetDir = join(root, "public");
const target = join(targetDir, "pdf.worker.min.mjs");

const source = sources.find((path) => existsSync(path));
if (!source) {
  console.warn("[copy-pdf-worker] pdf.worker.min.mjs not found — skip");
  process.exit(0);
}

mkdirSync(targetDir, { recursive: true });
copyFileSync(source, target);
console.log("[copy-pdf-worker] copied → public/pdf.worker.min.mjs");
