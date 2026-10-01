import { describe, expect, it } from "vitest";
import { isThemeMode, resolveDark } from "./theme";

describe("theme", () => {
  it("follows the phone only in system mode", () => {
    expect(resolveDark("system", true)).toBe(true);
    expect(resolveDark("system", false)).toBe(false);
    expect(resolveDark("light", true)).toBe(false);
    expect(resolveDark("dark", false)).toBe(true);
  });
  it("recognises valid modes", () => {
    expect(isThemeMode("dark")).toBe(true);
    expect(isThemeMode("blue")).toBe(false);
  });
});
