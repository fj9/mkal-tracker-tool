import type { Row } from "../data/schema";
import { colourFor, colourLabel, readableInk } from "../lib/colours";
import { hrefFor } from "../router";
import { useSettings } from "../state/AppContext";
import { useMkal } from "../state/MkalContext";

export const num = (n: number) => Math.round(n).toLocaleString();

/** Colour swatch and the user's name for a colour code, e.g. "Blue (MC)". */
export function Colour({ code }: { code: string }) {
  const { settings } = useSettings();
  const mkal = useMkal();
  const c = colourFor(settings, mkal, code);
  return (
    <span className="row" style={{ display: "inline-flex", gap: 6 }}>
      <span className="swatch" style={c.hex ? { background: c.hex } : { background: "transparent", borderStyle: "dashed" }} aria-hidden />
      <span>{colourLabel(c)}</span>
    </span>
  );
}

/** A band across the Now knitting card in the colour to knit with. */
export function ColourBand({ code, detail }: { code: string; detail?: string }) {
  const { settings } = useSettings();
  const mkal = useMkal();
  const c = colourFor(settings, mkal, code);
  const ink = c.hex ? readableInk(c.hex) : "var(--ink)";
  return (
    <div className="colour-band" style={c.hex ? { background: c.hex, color: ink } : undefined}>
      <strong style={{ fontSize: "1.15rem" }}>{colourLabel(c)}</strong>
      {detail && <span style={{ opacity: 0.85 }}> · {detail}</span>}
      {!c.hex && mkal && (
        <a href={hrefFor.settings(mkal)} className="small" style={{ marginLeft: 8 }}>Set colour</a>
      )}
    </div>
  );
}

export function rowLabel(r: Row): string {
  const side = r.side ? ` ${r.side}` : "";
  return `${r.sec.replace(/^Section \d+ - /, "")} · ${r.lab}${side}`;
}
