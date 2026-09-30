/**
 * Validates every clue in content/clues/, writes src/generated/catalogue.json and copies
 * the clue data the app will bundle into src/generated/clues/<clue_id>.json.
 *
 * PUBLIC_BUILD=1 (or VITE_PUBLIC_BUILD=1) copies only clue.public.json files. A private
 * build prefers clue.json and falls back to clue.public.json when a clue has no private file.
 */
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { SCHEMA_VERSION, type Catalogue, type CatalogueMkal, type Clue } from "../src/data/schema";
import { findInstructionText, validateClue } from "./validate";

const root = join(import.meta.dirname, "..");
const cluesDir = join(root, "content", "clues");
const outDir = join(root, "src", "generated");
const isPublic = process.env.PUBLIC_BUILD === "1" || process.env.VITE_PUBLIC_BUILD === "1";

interface Source { file: string; isPublic: boolean; clue: Clue }

function read(file: string): Clue {
  return JSON.parse(readFileSync(join(cluesDir, file), "utf8")) as Clue;
}

const errors: string[] = [];
const byId = new Map<string, { private?: Source; public?: Source }>();

for (const file of readdirSync(cluesDir).filter((f) => f.endsWith(".json")).sort()) {
  const pub = file.endsWith("_clue.public.json");
  if (!pub && !file.endsWith("_clue.json")) {
    errors.push(`${file}: file name must end in _clue.json or _clue.public.json`);
    continue;
  }
  const clue = read(file);
  if (clue.schema_version !== SCHEMA_VERSION) {
    errors.push(`${file}: unknown schema_version ${clue.schema_version}`);
    continue;
  }
  errors.push(...validateClue(clue, file));
  if (pub) errors.push(...findInstructionText(clue, file));
  const entry = byId.get(clue.clue_id) ?? {};
  const slot = pub ? "public" : "private";
  if (entry[slot]) errors.push(`${file}: clue_id "${clue.clue_id}" is also used by ${entry[slot]!.file}`);
  entry[slot] = { file, isPublic: pub, clue };
  byId.set(clue.clue_id, entry);
}

const chosen: Source[] = [];
for (const [id, e] of byId) {
  if (e.private && e.public) {
    const a = e.private.clue, b = e.public.clue;
    if (a.data_version !== b.data_version || a.total !== b.total)
      errors.push(`${id}: clue.json and clue.public.json differ (data_version/total)`);
  }
  const pick = isPublic ? e.public : e.private ?? e.public;
  if (!pick) errors.push(`${id}: no clue.public.json for a public build`);
  else chosen.push(pick);
}

// Group versions under their base clue.
const mkals = new Map<string, CatalogueMkal>();
for (const { file, clue } of chosen) {
  let mkal = mkals.get(clue.mkal_id);
  if (!mkal) {
    mkal = { mkal_id: clue.mkal_id, name: clue.mkal, year: clue.year, designer: clue.designer, clues: [] };
    mkals.set(clue.mkal_id, mkal);
  } else if (mkal.name !== clue.mkal || mkal.year !== clue.year || mkal.designer !== clue.designer) {
    errors.push(`${file}: mkal name/year/designer disagree with other clues in ${clue.mkal_id}`);
  }
  const baseId = clue.base_clue_id ?? clue.clue_id;
  let entry = mkal.clues.find((c) => c.base_clue_id === baseId);
  if (!entry) {
    entry = {
      base_clue_id: baseId,
      clue_number: clue.clue_number,
      title: clue.variant ? clue.title.replace(/\s*\(.*\)\s*$/, "") : clue.title,
      variants: [],
    };
    mkal.clues.push(entry);
  }
  entry.variants.push({
    clue_id: clue.clue_id,
    name: clue.variant?.name ?? null,
    file: `clues/${file.replace(/_clue\.public\.json$/, "_clue.json")}`,
    total: clue.total,
    rows: clue.rows.length,
  });
}

if (errors.length) {
  console.error(`Clue validation failed (${errors.length}):\n` + errors.map((e) => `  - ${e}`).join("\n"));
  process.exit(1);
}

const catalogue: Catalogue = {
  schema_version: SCHEMA_VERSION,
  mkals: [...mkals.values()]
    .sort((a, b) => b.year - a.year || a.name.localeCompare(b.name))
    .map((m) => ({
      ...m,
      clues: m.clues
        .sort((a, b) => a.clue_number - b.clue_number)
        .map((c) => ({ ...c, variants: c.variants.sort((a, b) => a.clue_id.localeCompare(b.clue_id)) })),
    })),
};

rmSync(outDir, { recursive: true, force: true });
mkdirSync(join(outDir, "clues"), { recursive: true });
for (const { clue } of chosen)
  writeFileSync(join(outDir, "clues", `${clue.clue_id}.json`), JSON.stringify(clue));
writeFileSync(join(outDir, "catalogue.json"), JSON.stringify(catalogue, null, 1) + "\n");
console.log(`Catalogue: ${chosen.length} clue files, ${catalogue.mkals.length} MKAL(s)${isPublic ? " [public build]" : ""}`);
