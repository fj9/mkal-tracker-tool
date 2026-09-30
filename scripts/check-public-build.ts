/** After `vite build` with PUBLIC_BUILD=1: fail if any built file still holds instruction text. */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const dist = join(import.meta.dirname, "..", "dist");
const found: string[] = [];
const walk = (dir: string) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(js|json|html|css|map)$/.test(name) && /["']?instr["']?\s*:\s*(?:"[^"]|'[^']|`[^`])/.test(readFileSync(p, "utf8")))
      found.push(p);
  }
};
walk(dist);
if (found.length) {
  console.error("Public build contains instruction text in:\n" + found.map((f) => `  - ${f}`).join("\n"));
  process.exit(1);
}
console.log("Public build check passed: no instruction text in dist/");
