import type { Row } from "../data/schema";

/** Sum of sts_worked over ticked rows. */
export function stitchesDone(rows: readonly Row[], done: ReadonlySet<string>): number {
  let sum = 0;
  for (const r of rows) if (done.has(r.row_id)) sum += r.sts_worked;
  return sum;
}

/** Fraction 0..1 of the clue's stitches that are done. */
export function progress(stitchesDoneCount: number, total: number): number {
  return total > 0 ? stitchesDoneCount / total : 0;
}

export function dailyTarget(total: number, days: number): number {
  return total / days;
}

/** Target at the end of day d (1-based). Multiplies before dividing so day `days` is exactly `total`. */
export function targetAtEndOfDay(total: number, days: number, d: number): number {
  return (d * total) / days;
}

/** The last row whose running_worked is at or below the target; null before the first row is reached. */
export function whereToBe(rows: readonly Row[], target: number): Row | null {
  let lo = 0;
  let hi = rows.length; // first index with running_worked > target
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (rows[mid].running_worked <= target) lo = mid + 1;
    else hi = mid;
  }
  return lo === 0 ? null : rows[lo - 1];
}

const MS_PER_DAY = 86_400_000;
const utcDay = (iso: string): number => {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d) / MS_PER_DAY;
};

/** Today's day number from the plan's start date, clamped between 1 and days. Dates are YYYY-MM-DD. */
export function todayDayNumber(startDate: string, days: number, today: string): number {
  const n = utcDay(today) - utcDay(startDate) + 1;
  return Math.min(Math.max(n, 1), days);
}

/** Stitches done minus the target at the end of today; below zero is behind. */
export function aheadBehind(stitchesDoneCount: number, targetEndOfToday: number): number {
  return stitchesDoneCount - targetEndOfToday;
}

/** The larger of 0 and (target at end of today minus stitches done). */
export function toGoToday(stitchesDoneCount: number, targetEndOfToday: number): number {
  return Math.max(0, targetEndOfToday - stitchesDoneCount);
}

export interface DayPlan {
  day: number;
  target: number;
  row: Row | null;
}

/** One entry per day: the cumulative target and where to be at the end of that day. */
export function weekPlan(rows: readonly Row[], total: number, days: number): DayPlan[] {
  return Array.from({ length: days }, (_, i) => {
    const target = targetAtEndOfDay(total, days, i + 1);
    return { day: i + 1, target, row: whereToBe(rows, target) };
  });
}

export interface Status {
  day: number;
  done: number;
  target: number;
  gap: number; // ahead (+) or behind (-), in stitches
  toGo: number;
  /** The row the knitter would reach by closing the gap: where to be at the end of today. */
  rowByEndOfToday: Row | null;
}

export function status(
  rows: readonly Row[],
  total: number,
  done: ReadonlySet<string>,
  plan: { startDate: string; days: number },
  today: string,
): Status {
  const day = todayDayNumber(plan.startDate, plan.days, today);
  const target = targetAtEndOfDay(total, plan.days, day);
  const doneStitches = stitchesDone(rows, done);
  return {
    day,
    done: doneStitches,
    target,
    gap: aheadBehind(doneStitches, target),
    toGo: toGoToday(doneStitches, target),
    rowByEndOfToday: whereToBe(rows, target),
  };
}
