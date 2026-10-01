import { existsSync, readFileSync } from "node:fs";
import type { Clue } from "../src/data/schema";

/** Loads a public clue file by name from fixtures/clues (test-only) or content/clues (shipped). */
export function loadClueFile(name: string): Clue {
  for (const dir of ["fixtures/clues", "content/clues"]) {
    const url = new URL(`../${dir}/${name}_clue.public.json`, import.meta.url);
    if (existsSync(url)) return JSON.parse(readFileSync(url, "utf8"));
  }
  throw new Error(`No clue file for ${name}`);
}
