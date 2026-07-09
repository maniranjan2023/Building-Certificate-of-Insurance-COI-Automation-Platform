import fs from "fs";
import path from "path";

const skip = new Set([
  "app/api/auth/login/route.ts",
  "app/api/webhooks/agentmail/route.ts",
]);

const errorImport = `import { jsonInternalError } from "@/lib/api/handle-route-error";`;

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, files);
    else if (ent.name === "route.ts") files.push(p.split(path.sep).join("/"));
  }
  return files;
}

function insertAfterImports(src, block) {
  if (src.includes(block)) return src;
  const lines = src.split("\n");
  let lastImport = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("import ")) lastImport = i;
  }
  if (lastImport === -1) return block + "\n" + src;
  lines.splice(lastImport + 1, 0, block);
  return lines.join("\n");
}

function contextFromPath(file) {
  return file.replace(/^app\/api\//, "").replace(/\/route\.ts$/, "").replace(/\//g, ".");
}

const catchPattern =
  /} catch \(error\) \{\r?\n\s*const message =\r?\n\s*error instanceof Error \? error\.message : "[^"]+";\r?\n\s*return jsonError\(message, 500\);\r?\n\s*}/g;

for (const file of walk("app/api")) {
  if (skip.has(file)) continue;
  let src = fs.readFileSync(file, "utf8");
  if (!catchPattern.test(src)) continue;

  catchPattern.lastIndex = 0;
  const ctx = contextFromPath(file);
  src = insertAfterImports(src, errorImport);
  src = src.replace(catchPattern, `} catch (error) {\n    return jsonInternalError(error, "${ctx}");\n  }`);
  fs.writeFileSync(file, src);
  console.log("sanitized errors:", file);
}
