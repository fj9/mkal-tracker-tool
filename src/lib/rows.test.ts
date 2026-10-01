import { describe, expect, it } from "vitest";
import { loadClueFile } from "../../scripts/fixtures";
import { indexRows, upcoming } from "./rows";

const load = loadClueFile;

describe("upcoming", () => {
  const rows = load("twists_turns_clue1").rows;
  it("starts at the first row when nothing is ticked", () => {
    const u = upcoming(rows, new Set());
    expect(u.current).toBe(rows[0]);
    expect(u.next).toEqual(rows.slice(1, 4));
  });
  it("skips ticked rows wherever they are", () => {
    const u = upcoming(rows, new Set([rows[0].row_id, rows[1].row_id, rows[3].row_id]));
    expect(u.current).toBe(rows[2]);
    expect(u.next).toEqual([rows[4], rows[5], rows[6]]);
  });
  it("returns nothing when every row is ticked", () => {
    expect(upcoming(rows, new Set(rows.map((r) => r.row_id)))).toEqual({ current: null, next: [] });
  });
});

describe("indexRows", () => {
  it("gives stripe length and repeat size for a row", () => {
    const clue = load("mystery_musikal_2025_clue4__simple-stripes");
    const idx = indexRows(clue);
    const r = clue.rows.find((x) => x.rep_row === 1 && x.rep_pass === 2)!;
    expect(idx.repRows(r)).toBe(4);
    expect(idx.repPasses(r)).toBe(3);
    expect(idx.stripeLength(r)).toBe(2);
  });
  it("is null for rows outside stripes and repeats", () => {
    const clue = load("mystery_musikal_2025_clue4__simple-stripes");
    const last = clue.rows[clue.rows.length - 1];
    const idx = indexRows(clue);
    expect(idx.stripeLength(last)).toBeNull();
    expect(idx.repRows(last)).toBeNull();
  });
});
