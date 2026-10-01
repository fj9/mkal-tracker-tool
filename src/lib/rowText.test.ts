import { describe, expect, it } from "vitest";
import { loadClueFile } from "../../scripts/fixtures";
import { rowName, rowPlace, rowWhere } from "./rowText";

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
