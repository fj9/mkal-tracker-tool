import { describe, expect, it } from "vitest";
import { loadClueFile } from "../../scripts/fixtures";
import { rowName, rowPlace, rowTitle, rowWhere, shortLab } from "./rowText";

const ck = loadClueFile("color_kaleidoscope_clue1_");

describe("row text", () => {
  it("names the sub-section, repeat and row, with the full section", () => {
    const r = ck.rows.find((x) => x.actual_row === 151)!;
    expect(rowWhere(r)).toBe("Wedge 13 · repeat 2 · row 6 WS");
    expect(rowPlace(r)).toBe("Section 1 - Wedges · Wedge 13 · repeat 2 · row 6 WS");
  });
  it("leaves out the repeat when the row is not in one", () => {
    const r = ck.rows.find((x) => x.actual_row === 391)!;
    expect(rowWhere(r)).toBe("Triangle 15 · row 1 RS");
  });
  it("keeps non-numbered labels as they are", () => {
    const last = ck.rows[ck.rows.length - 1];
    expect(rowName(last)).toBe("Hold I-cord sts");
    expect(rowWhere(last)).toBe("Hold I-cord sts");
  });
});

describe("labels that repeat the sub-section (Color Kaleidoscope clue 3)", () => {
  const c3 = loadClueFile("color_kaleidoscope_clue3");
  const byLab = (lab: string) => c3.rows.find((r) => r.lab === lab)!;

  it("shortens 'Mound 1 row 1' to 1 inside Mound 1", () => {
    const r = byLab("Mound 1 row 1");
    expect(shortLab(r)).toBe("1");
    expect(rowTitle(r)).toBe("Row 1");
    expect(rowWhere(r)).toBe("Mound 1 · row 1 RS");
  });
  it("does not repeat the sub-section when a repeat is shown", () => {
    const r = c3.rows.find((x) => x.lab === "Mound 2 row 3")!;
    expect(rowWhere(r)).toBe("Mound 2 · repeat 1 · row 3 RS");
  });
  it("keeps labels that are not numbered rows", () => {
    const r = byLab("RS continued");
    expect(shortLab(r)).toBe("RS continued");
    expect(rowTitle(r)).toBe("RS continued");
    expect(rowName(r)).toBe("RS continued");
  });
});
