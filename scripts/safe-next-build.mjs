/**
 * Windows-safe production build:
 * 1) generate Prisma client
 * 2) ensure Next output directories exist
 * 3) run `next build`, retry once on the known 500.html rename race
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: true,
    env: process.env,
  });
  return result.status ?? 1;
}

function ensureNextDirs() {
  for (const rel of [
    path.join(".next", "export"),
    path.join(".next", "server", "pages"),
    path.join(".next", "server", "app"),
  ]) {
    fs.mkdirSync(path.join(root, rel), { recursive: true });
  }
}

function isWindowsRenameRace(logSnippet) {
  return (
    logSnippet.includes("500.html") &&
    logSnippet.includes("ENOENT") &&
    logSnippet.includes("rename")
  );
}

let code = run("npx", ["prisma", "generate"]);
if (code !== 0) {
  process.exit(code);
}

ensureNextDirs();
code = run("npx", ["next", "build"]);

if (code !== 0 && process.platform === "win32") {
  console.warn(
    "\n[safe-next-build] Retrying once after ensuring .next output dirs (Windows rename race)…\n"
  );
  ensureNextDirs();
  // Drop partial export artifacts so the second build can rewrite them cleanly.
  for (const rel of [
    path.join(".next", "export"),
    path.join(".next", "server", "pages", "500.html"),
    path.join(".next", "server", "pages", "404.html"),
  ]) {
    const abs = path.join(root, rel);
    try {
      fs.rmSync(abs, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }
  ensureNextDirs();
  code = run("npx", ["next", "build"]);
}

process.exit(code);
