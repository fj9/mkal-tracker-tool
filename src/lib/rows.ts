import type { Clue, Row } from "../data/schema";

const stripeKey = (r: Row) => `${r.sec}|${r.stripe}`;
const repKey = (r: Row) => `${r.sec}|${r.sub ?? ""}`;

export interface RowIndex {
  stripeLength(r: Row): number | null;
  repRows(r: Row): number | null;
  repPasses(r: Row): number | null;
}

/** Sizes of stripes (rows in the same colour run) and repeat blocks, worked out from the rows. */
export function indexRows(clue: Clue): RowIndex {
  const stripes = new Map<string, number>();
  const repRows = new Map<string, number>();
  const repPasses = new Map<string, number>();
  for (const r of clue.rows) {
    if (r.stripe) stripes.set(stripeKey(r), Math.max(stripes.get(stripeKey(r)) ?? 0, r.stripe_row ?? 0));
    if (r.rep_row != null) repRows.set(repKey(r), Math.max(repRows.get(repKey(r)) ?? 0, r.rep_row));
    if (r.rep_pass != null) repPasses.set(repKey(r), Math.max(repPasses.get(repKey(r)) ?? 0, r.rep_pass));
  }
  return {
    stripeLength: (r) => (r.stripe ? stripes.get(stripeKey(r)) ?? null : null),
    repRows: (r) => (r.rep_row != null ? repRows.get(repKey(r)) ?? null : null),
    repPasses: (r) => (r.rep_pass != null ? repPasses.get(repKey(r)) ?? null : null),
  };
}

/** The first row not yet ticked, and the next `count` rows after it. */
export function upcoming(rows: readonly Row[], done: ReadonlySet<string>, count = 3): { current: Row | null; next: Row[] } {
  const i = rows.findIndex((r) => !done.has(r.row_id));
  if (i < 0) return { current: null, next: [] };
  const next: Row[] = [];
  for (let j = i + 1; j < rows.length && next.length < count; j++) if (!done.has(rows[j].row_id)) next.push(rows[j]);
  return { current: rows[i], next };
}
