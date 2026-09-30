import catalogueJson from "./catalogue.json";
import {
  SCHEMA_VERSION,
  type Catalogue,
  type CatalogueClue,
  type CatalogueVariant,
  type Clue,
} from "./schema";

/** Public builds (PUBLIC_BUILD=1) read clue.public.json, where every instr is empty. */
export const PUBLIC_BUILD = import.meta.env.VITE_PUBLIC_BUILD === "1";

const catalogue = catalogueJson as Catalogue;
if (catalogue.schema_version !== SCHEMA_VERSION) {
  throw new Error(`Unknown catalogue schema_version ${catalogue.schema_version}`);
}

const privateFiles = import.meta.glob<Clue>("/content/clues/*_clue.json", {
  import: "default",
});
const publicFiles = import.meta.glob<Clue>("/content/clues/*_clue.public.json", {
  import: "default",
});

export function getCatalogue(): Catalogue {
  return catalogue;
}

export function findVariant(
  clueId: string,
): { clue: CatalogueClue; variant: CatalogueVariant } | undefined {
  for (const mkal of catalogue.mkals)
    for (const clue of mkal.clues)
      for (const variant of clue.variants)
        if (variant.clue_id === clueId) return { clue, variant };
  return undefined;
}

/** Load one clue version by clue_id. Rejects schema versions the app does not know. */
export async function loadClue(clueId: string): Promise<Clue> {
  const found = findVariant(clueId);
  if (!found) throw new Error(`Clue "${clueId}" is not in the catalogue`);
  const privatePath = `/content/${found.variant.file}`;
  const path = PUBLIC_BUILD
    ? privatePath.replace(/_clue\.json$/, "_clue.public.json")
    : privatePath;
  const load = (PUBLIC_BUILD ? publicFiles : privateFiles)[path];
  if (!load) throw new Error(`Clue file missing: ${path}`);
  const clue = await load();
  if (clue.schema_version !== SCHEMA_VERSION)
    throw new Error(`Clue "${clueId}" has unknown schema_version ${clue.schema_version}`);
  return clue;
}
