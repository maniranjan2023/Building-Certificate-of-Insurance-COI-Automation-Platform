import fs from "fs";
import path from "path";

const skip = new Set(["app/api/auth/login/route.ts"]);

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, files);
    else if (ent.name === "route.ts") files.push(p.split(path.sep).join("/"));
  }
  return files;
}

function contextFromPath(file) {
  return file.replace(/^app\/api\//, "").replace(/\/route\.ts$/, "").replace(/\//g, ".");
}

const tailPattern =
  /\r?\n\s*const message =\r?\n\s*error instanceof Error \? error\.message : "[^"]+";\r?\n\s*return jsonError\(message, 500\);/g;

for (const file of walk("app/api")) {
  if (skip.has(file)) continue;
  let src = fs.readFileSync(file, "utf8");
  if (!tailPattern.test(src)) continue;
  tailPattern.lastIndex = 0;
  const ctx = contextFromPath(file);
  if (!src.includes('from "@/lib/api/handle-route-error"')) {
    const lines = src.split("\n");
    let lastImport = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith("import ")) lastImport = i;
    }
    lines.splice(
      lastImport + 1,
      0,
      'import { jsonInternalError } from "@/lib/api/handle-route-error";'
    );
    src = lines.join("\n");
  }
  src = src.replace(
    tailPattern,
    `\n    return jsonInternalError(error, "${ctx}");`
  );
  fs.writeFileSync(file, src);
  console.log("sanitized tail:", file);
}
