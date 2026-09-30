import type { Row } from "../data/schema";
import { useSettings } from "../state/AppContext";

export const num = (n: number) => Math.round(n).toLocaleString();

/** Colour swatch and the user's name for a colour code (falls back to the code). */
export function Colour({ code }: { code: string }) {
  const { settings } = useSettings();
  const swatch = settings.colourSwatches[code];
  const name = settings.colourNames[code];
  return (
    <span className="row" style={{ display: "inline-flex", gap: 6 }}>
      <span className="swatch" style={swatch ? { background: swatch } : { background: "transparent", borderStyle: "dashed" }} aria-hidden />
      <span>{code}{name ? ` · ${name}` : ""}</span>
    </span>
  );
}

export function rowLabel(r: Row): string {
  const side = r.side ? ` ${r.side}` : "";
  return `${r.sec.replace(/^Section \d+ - /, "")} · ${r.lab}${side}`;
}
