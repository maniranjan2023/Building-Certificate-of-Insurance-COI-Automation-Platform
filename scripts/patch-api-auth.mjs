import fs from "fs";
import path from "path";

const skip = new Set([
  "app/api/auth/login/route.ts",
  "app/api/auth/logout/route.ts",
  "app/api/webhooks/agentmail/route.ts",
]);

const sessionImport = `import {
  isSessionResponse,
  requireApiSession,
} from "@/lib/api/require-api-session";`;

const healthImport = `import {
  requireHealthOrAdminSession,
} from "@/lib/api/require-api-session";`;

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, files);
    else if (ent.name === "route.ts") files.push(p.split(path.sep).join("/"));
  }
  return files;
}

function stripSessionImports(src) {
  return src
    .replace(/\nimport \{\n  isSessionResponse,\n  requireApiSession,\n\} from "@\/lib\/api\/require-api-session";\n/g, "\n")
    .replace(/\nimport \{\n  requireHealthOrAdminSession,\n\} from "@\/lib\/api\/require-api-session";\n/g, "\n")
    .replace(/\nimport \{\n  isSessionResponse,\n  requireHealthOrAdminSession,\n\} from "@\/lib\/api\/require-api-session";\n/g, "\n");
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

function patchSessionChecks(src, isHealth) {
  if (isHealth) {
    src = src.replace(
      /export async function GET\((_request: Request|request: Request)?\)/g,
      "export async function GET(request: Request)"
    );
    return src.replace(
      /export async function GET\(request: Request\) \{\r?\n(?!\s*const auth = await requireHealthOrAdminSession)/g,
      `export async function GET(request: Request) {\r\n  const auth = await requireHealthOrAdminSession(request);\r\n  if (auth instanceof Response) return auth;\r\n`
    );
  }

  return src.replace(
    /export async function (GET|POST|PATCH|PUT|DELETE)\([^)]*\) \{\r?\n(?!\s*const session = await requireApiSession)/g,
    (match) =>
      `${match}  const session = await requireApiSession();\r\n  if (isSessionResponse(session)) return session;\r\n`
  );
}

for (const file of walk("app/api")) {
  if (skip.has(file)) continue;
  let src = fs.readFileSync(file, "utf8");
  const isHealth = file.includes("/api/health/");

  src = stripSessionImports(src);
  src = insertAfterImports(src, isHealth ? healthImport : sessionImport);
  src = patchSessionChecks(src, isHealth);
  fs.writeFileSync(file, src);
  console.log("patched", file);
}
