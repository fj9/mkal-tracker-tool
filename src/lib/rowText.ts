import type { Row } from "../data/schema";

/** "row 6 WS" for numbered rows; labels such as "CO" or "Hold I-cord sts" are kept as they are. */
export function rowName(r: Row): string {
  return /^\d/.test(r.lab) ? `row ${r.lab}${r.side ? ` ${r.side}` : ""}` : r.lab;
}

/** Where in the section a row is: sub-section, repeat, then the row, e.g. "Wedge 13 · repeat 2 · row 6 WS". */
export function rowWhere(r: Row): string {
  return [r.sub, r.rep_pass != null ? `repeat ${r.rep_pass}` : null, rowName(r)].filter(Boolean).join(" · ");
}

/** One line with the full section name, for sentences and short labels. */
export function rowPlace(r: Row): string {
  return `${r.sec} · ${rowWhere(r)}`;
}
