import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { Clue } from "../data/schema";
import {
  aheadBehind, dailyTarget, progress, status, stitchesDone, targetAtEndOfDay,
  todayDayNumber, toGoToday, weekPlan, whereToBe,
} from "./plan";

const dir = new URL("../../content/clues/", import.meta.url);
const clues = new Map<string, Clue>(
  readdirSync(dir).filter((f) => f.endsWith("_clue.public.json"))
    .map((f) => [f.replace("_clue.public.json", ""), JSON.parse(readFileSync(new URL(f, dir), "utf8"))]),
);

// Spec fixtures: total stitches and per-day target at 7 days.
const fixtures = [
  ["go_go_dynamo_clue1", 388, 20092, 2870.3],
  ["geogradient_clue2", 96, 16938, 2419.7],
  ["twists_turns_clue1", 116, 24184, 3454.9],
  ["twists_turns_clue2", 439, 29608, 4229.7],
] as const;

describe.each(fixtures)("%s", (name, rowCount, total, perDay) => {
  const clue = clues.get(name)!;
  const rows = clue.rows;

  it("matches the spec fixture", () => {
    expect(rows).toHaveLength(rowCount);
    expect(clue.total).toBe(total);
    expect(dailyTarget(clue.total, 7)).toBeCloseTo(perDay, 1);
  });

  it("all rows ticked is 100% and the day-7 target is the total", () => {
    const all = new Set(rows.map((r) => r.row_id));
    expect(stitchesDone(rows, all)).toBe(total);
    expect(progress(total, total)).toBe(1);
    expect(targetAtEndOfDay(total, 7, 7)).toBe(total);
    expect(whereToBe(rows, total)).toBe(rows[rows.length - 1]);
  });

  it("where-to-be never passes the target and is monotonic across the week", () => {
    const plan = weekPlan(rows, total, 7);
    let prev = 0;
    for (const p of plan) {
      expect(p.row).not.toBeNull();
      expect(p.row!.running_worked).toBeLessThanOrEqual(p.target);
      const next = rows[p.row!.actual_row]; // row after the one to be on
      if (next) expect(next.running_worked).toBeGreaterThan(p.target);
      expect(p.row!.actual_row).toBeGreaterThanOrEqual(prev);
      prev = p.row!.actual_row;
    }
    expect(plan[6].row).toBe(rows[rows.length - 1]);
  });

  it("nothing ticked: behind by today's whole target", () => {
    const s = status(rows, total, new Set(), { startDate: "2026-10-05", days: 7 }, "2026-10-07");
    expect(s.day).toBe(3);
    expect(s.done).toBe(0);
    expect(s.gap).toBeCloseTo(-3 * perDay, 0);
    expect(s.toGo).toBeCloseTo(3 * perDay, 0);
  });

  it("ticking up to where-to-be puts you within one row of on track", () => {
    const target = targetAtEndOfDay(total, 7, 2);
    const row = whereToBe(rows, target)!;
    const done = new Set(rows.slice(0, row.actual_row).map((r) => r.row_id));
    const s = status(rows, total, done, { startDate: "2026-10-05", days: 7 }, "2026-10-06");
    expect(s.done).toBe(row.running_worked);
    expect(s.gap).toBeLessThanOrEqual(0);
    expect(s.gap).toBeGreaterThan(-(rows[row.actual_row]?.sts_worked ?? Infinity));
    expect(s.rowByEndOfToday).toBe(row);
  });
});

describe("plan maths edge cases", () => {
  const rows = clues.get("twists_turns_clue1")!.rows;

  it("targets are exact at the end of the plan for any day count", () => {
    for (const days of [1, 2, 3, 5, 7, 10, 14]) expect(targetAtEndOfDay(24184, days, days)).toBe(24184);
  });

  it("where to be is null before the first row is reached", () => {
    expect(whereToBe(rows, 0)).toBeNull();
    expect(whereToBe(rows, rows[0].running_worked - 1)).toBeNull();
    expect(whereToBe(rows, rows[0].running_worked)).toBe(rows[0]);
  });

  it("today's day number is clamped between 1 and days", () => {
    expect(todayDayNumber("2026-10-05", 7, "2026-10-01")).toBe(1);
    expect(todayDayNumber("2026-10-05", 7, "2026-10-05")).toBe(1);
    expect(todayDayNumber("2026-10-05", 7, "2026-10-11")).toBe(7);
    expect(todayDayNumber("2026-10-05", 7, "2026-11-30")).toBe(7);
    expect(todayDayNumber("2026-10-30", 7, "2026-11-01")).toBe(3); // month boundary
  });

  it("ahead/behind and to-go", () => {
    expect(aheadBehind(3000, 2870)).toBe(130);
    expect(toGoToday(3000, 2870)).toBe(0);
    expect(aheadBehind(2000, 2870)).toBe(-870);
    expect(toGoToday(2000, 2870)).toBe(870);
  });

  it("ticks are counted by row_id, not order (non-contiguous ticks)", () => {
    const done = new Set([rows[0].row_id, rows[10].row_id]);
    expect(stitchesDone(rows, done)).toBe(rows[0].sts_worked + rows[10].sts_worked);
  });

  it("the Twists & Turns Clue 1 I-cord rows are heavy, as in the spec", () => {
    const worked = rows.map((r) => r.sts_worked);
    expect(Math.max(...worked)).toBe(810);
    expect(worked).toContain(375);
  });
});
