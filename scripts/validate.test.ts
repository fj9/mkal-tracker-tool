import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { findInstructionText, validateClue } from "./validate";
import type { Clue } from "../src/data/schema";

const load = (name: string): Clue =>
  JSON.parse(readFileSync(new URL(`../content/clues/${name}_clue.public.json`, import.meta.url), "utf8"));

const fixtures = [
  "go_go_dynamo_clue1", "geogradient_clue2", "twists_turns_clue1", "twists_turns_clue2",
];

describe("build checks", () => {
  it.each(fixtures)("%s passes every check and has no instruction text", (name) => {
    const clue = load(name);
    expect(validateClue(clue)).toEqual([]);
    expect(findInstructionText(clue)).toEqual([]);
  });

  it("fails a gap in actual_row, duplicate row_id, wrong total, broken net and printed", () => {
    const clue = load("twists_turns_clue1");
    clue.rows[5].actual_row = 99;
    clue.rows[7].row_id = clue.rows[6].row_id;
    clue.total += 1;
    clue.rows[10].net += 1;
    const withPrinted = clue.rows.find((r, i) => i > 12 && r.printed != null)!;
    withPrinted.printed! += 1;
    const msg = validateClue(clue).join("\n");
    expect(msg).toMatch(/actual_row 99/);
    expect(msg).toMatch(/duplicate row_id/);
    expect(msg).toMatch(/but total is/);
    expect(msg).toMatch(/net/);
    expect(msg).toMatch(/printed/);
  });

  it("fails a broken section continuity", () => {
    const clue = load("geogradient_clue2");
    clue.rows[3].sts_start += 1;
    expect(validateClue(clue).join("\n")).toMatch(/does not match previous sts_end/);
  });

  it("flags instruction text in a public file", () => {
    const clue = load("go_go_dynamo_clue1");
    clue.rows[0].instr = "K2, p2";
    expect(findInstructionText(clue)).toHaveLength(1);
  });
});
