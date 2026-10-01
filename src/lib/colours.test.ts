import { describe, expect, it } from "vitest";
import type { Settings } from "../state/progress";
import { colourFor, colourLabel, readableInk, withColour } from "./colours";

const empty: Settings = { colourNames: {}, colourSwatches: {} };

describe("colours", () => {
  it("is 'not set' until the user chooses", () => {
    expect(colourFor(empty, "tt-2022", "MC")).toEqual({ code: "MC", name: "", hex: null });
  });

  it("keeps each MKAL's colours separate", () => {
    let s = withColour(empty, "tt-2022", "MC", { name: "Blue", hex: "#3d7be0" });
    s = withColour(s, "tt-2022", "CC", { name: "Orange", hex: "#f2994a" });
    s = withColour(s, "geo-2023", "MC", { name: "Grey", hex: "#999999" });
    expect(colourLabel(colourFor(s, "tt-2022", "MC"))).toBe("Blue (MC)");
    expect(colourFor(s, "tt-2022", "CC").hex).toBe("#f2994a");
    expect(colourFor(s, "geo-2023", "MC").name).toBe("Grey");
    expect(colourFor(s, "other", "MC").hex).toBeNull();
  });

  it("falls back to the older one-set-for-everything colours", () => {
    const old: Settings = { colourNames: { MC: "Grey" }, colourSwatches: { MC: "#888888" } };
    expect(colourFor(old, "tt-2022", "MC")).toEqual({ code: "MC", name: "Grey", hex: "#888888" });
    const s = withColour(old, "tt-2022", "MC", { name: "Blue" });
    expect(colourFor(s, "tt-2022", "MC")).toEqual({ code: "MC", name: "Blue", hex: "#888888" });
  });

  it("labels an unnamed colour by its code", () => {
    expect(colourLabel({ code: "A", name: "", hex: null })).toBe("A");
  });

  it("picks readable text for light and dark swatches", () => {
    expect(readableInk("#ffffff")).toBe("#1f2430");
    expect(readableInk("#23262d")).toBe("#ffffff");
    expect(readableInk("#3d7be0")).toBe("#ffffff");
  });
});
