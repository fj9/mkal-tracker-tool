import catalogueJson from "../generated/catalogue.json";
import {
  SCHEMA_VERSION,
  type Catalogue,
  type CatalogueClue,
  type CatalogueVariant,
  type Clue,
} from "./schema";

const catalogue = catalogueJson as Catalogue;
if (catalogue.schema_version !== SCHEMA_VERSION) {
  throw new Error(`Unknown catalogue schema_version ${catalogue.schema_version}`);
}

// scripts/build-catalogue.ts copies clue.json (private build) or clue.public.json
// (PUBLIC_BUILD=1) into src/generated/clues/, so a public build never bundles instructions.
const clueFiles = import.meta.glob<Clue>("../generated/clues/*.json", { import: "default" });

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
  if (!findVariant(clueId)) throw new Error(`Clue "${clueId}" is not in the catalogue`);
  const load = clueFiles[`../generated/clues/${clueId}.json`];
  if (!load) throw new Error(`Clue file missing for "${clueId}"`);
  const clue = await load();
  if (clue.schema_version !== SCHEMA_VERSION)
    throw new Error(`Clue "${clueId}" has unknown schema_version ${clue.schema_version}`);
  return clue;
}
