import type { Settings } from "../state/progress";

export interface ColourDef { name: string; hex: string }

/** Quick picks in Settings; choosing one sets both the name and the swatch. */
export const PRESETS: ColourDef[] = [
  { name: "White", hex: "#ffffff" }, { name: "Cream", hex: "#f3e9d2" }, { name: "Yellow", hex: "#f2c94c" },
  { name: "Orange", hex: "#f2994a" }, { name: "Red", hex: "#d64545" }, { name: "Pink", hex: "#f2a6c0" },
  { name: "Purple", hex: "#8e6bbf" }, { name: "Blue", hex: "#3d7be0" }, { name: "Teal", hex: "#2aa6a0" },
  { name: "Green", hex: "#4fa35f" }, { name: "Brown", hex: "#8a6244" }, { name: "Grey", hex: "#9aa0ac" },
  { name: "Black", hex: "#23262d" },
];

export interface ResolvedColour { code: string; name: string; hex: string | null }

/**
 * The user's colour for a code in an MKAL. Falls back to the older one-set-for-everything
 * names and swatches, then to "not set" (hex null).
 */
export function colourFor(settings: Settings, mkalId: string | undefined, code: string): ResolvedColour {
  const own = mkalId ? settings.mkalColours?.[mkalId]?.[code] : undefined;
  const name = own?.name ?? settings.colourNames[code] ?? "";
  const hex = own?.hex ?? settings.colourSwatches[code] ?? null;
  return { code, name, hex };
}

/** "Blue (MC)", or just "MC" when unnamed. */
export function colourLabel(c: ResolvedColour): string {
  return c.name ? `${c.name} (${c.code})` : c.code;
}

/** Dark or light text that stays readable on a swatch. */
export function readableInk(hex: string): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.4 ? "#1f2430" : "#ffffff";
}

/** Returns new settings with one colour changed for one MKAL. */
export function withColour(settings: Settings, mkalId: string, code: string, patch: Partial<ColourDef>): Settings {
  const current = colourFor(settings, mkalId, code);
  const next: ColourDef = { name: patch.name ?? current.name, hex: patch.hex ?? current.hex ?? "#cccccc" };
  return {
    ...settings,
    mkalColours: { ...settings.mkalColours, [mkalId]: { ...settings.mkalColours?.[mkalId], [code]: next } },
  };
}
