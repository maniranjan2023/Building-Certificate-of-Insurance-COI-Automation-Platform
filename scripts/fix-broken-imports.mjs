import fs from "fs";
import path from "path";

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, files);
    else if (ent.name === "route.ts") files.push(p);
  }
  return files;
}

const broken = /import \{\r?\nimport \{ jsonInternalError \} from "@\/lib\/api\/handle-route-error";\r?\n/g;

for (const file of walk("app/api")) {
  let src = fs.readFileSync(file, "utf8");
  if (!broken.test(src)) continue;
  broken.lastIndex = 0;
  src = src.replace(
    broken,
    'import { jsonInternalError } from "@/lib/api/handle-route-error";\nimport {\n'
  );
  fs.writeFileSync(file, src);
  console.log("fixed import:", file.split(path.sep).join("/"));
}
