import type { Row } from "../data/schema";

/**
 * The row label without the sub-section it repeats: "Mound 2 row 5" in Mound 2 becomes "5".
 * Other labels ("CO", "Next Row 1", "Hold I-cord sts") are kept as they are.
 */
export function shortLab(r: Row): string {
  if (r.sub && r.lab.toLowerCase().startsWith(r.sub.toLowerCase())) {
    const rest = r.lab.slice(r.sub.length).replace(/^\s*row\s*/i, "").trim();
    if (rest) return rest;
  }
  return r.lab;
}

/** "Row 6" for numbered rows; labels such as "CO" are kept. For headings, where the side is shown separately. */
export function rowTitle(r: Row): string {
  const l = shortLab(r);
  return /^\d/.test(l) ? `Row ${l}` : l;
}

/** "row 6 WS" for numbered rows; labels such as "CO" or "Hold I-cord sts" are kept as they are. */
export function rowName(r: Row): string {
  const l = shortLab(r);
  return /^\d/.test(l) ? `row ${l}${r.side ? ` ${r.side}` : ""}` : l;
}

/** Where in the section a row is: sub-section, repeat, then the row, e.g. "Wedge 13 · repeat 2 · row 6 WS". */
export function rowWhere(r: Row): string {
  return [r.sub, r.rep_pass != null ? `repeat ${r.rep_pass}` : null, rowName(r)].filter(Boolean).join(" · ");
}

/** One line with the full section name, for sentences and short labels. */
export function rowPlace(r: Row): string {
  return `${r.sec} · ${rowWhere(r)}`;
}
