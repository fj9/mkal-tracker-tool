import { useEffect, useMemo, useRef, useState } from "react";
import { ClueGate } from "../components/ClueGate";
import { num } from "../components/Format";
import type { Clue, Progress, Row } from "../data/schema";
import { colourFor, readableInk } from "../lib/colours";
import { useSettings } from "../state/AppContext";
import { useMkal } from "../state/MkalContext";
import { setPlace, untickFrom } from "../state/progress";

interface Group { sub: string | null; rows: Row[] }

/** Consecutive rows that share a sub-section. */
function groupBySub(rows: Row[]): Group[] {
  const groups: Group[] = [];
  for (const r of rows) {
    const last = groups[groups.length - 1];
    if (last && last.sub === (r.sub ?? null)) last.rows.push(r);
    else groups.push({ sub: r.sub ?? null, rows: [r] });
  }
  return groups;
}

const count = (rows: Row[], done: ReadonlySet<string>) => rows.filter((r) => done.has(r.row_id)).length;
const net = (n: number) => (n === 0 ? "" : n > 0 ? `+${n}` : `−${-n}`);

function ColourCell({ code }: { code: string }) {
  const { settings } = useSettings();
  const c = colourFor(settings, useMkal(), code);
  return (
    <td className="colour-cell" title={c.name || code}
      style={c.hex ? { background: c.hex, color: readableInk(c.hex) } : undefined}>
      {code}
    </td>
  );
}

type Update = (fn: (p: Progress) => Progress) => Promise<void>;

/** An overview of the whole clue, like a spreadsheet tracker: see where you are up to at a glance. */
function OverviewBody({ clue, progress, update }: { clue: Clue; progress: Progress; update: Update }) {
  const done = useMemo(() => new Set(progress.done), [progress.done]);
  const current = clue.rows.find((r) => !done.has(r.row_id));
  const bySection = useMemo(() => {
    const m = new Map<string, Row[]>();
    for (const r of clue.rows) m.set(r.sec, [...(m.get(r.sec) ?? []), r]);
    return m;
  }, [clue]);
  // The section you are in starts open; others are one tap away.
  const [open, setOpen] = useState<Set<string>>(() => new Set(current ? [current.sec] : []));
  const [selected, setSelected] = useState<string | null>(null);
  const hereRef = useRef<HTMLTableRowElement | null>(null);

  useEffect(() => {
    hereRef.current?.scrollIntoView({ block: "center" });
    // Only on first show.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = (name: string) =>
    setOpen((o) => { const n = new Set(o); if (n.has(name)) n.delete(name); else n.add(name); return n; });

  return (
    <>
      <p className="muted small">
        Tap a section to open it. Ticking a row ticks every row before it; unticking a row unticks it and the rows after. Or tap a row number and choose “Done up to here”.
      </p>
      {clue.sections.map((s) => {
        const rows = bySection.get(s.name) ?? [];
        const n = count(rows, done);
        const pct = rows.length ? Math.floor((n / rows.length) * 100) : 0;
        const isOpen = open.has(s.name);
        return (
          <section key={s.name} className="overview-section">
            <button className="section-head" aria-expanded={isOpen} onClick={() => toggle(s.name)}>
              <span className="grow" style={{ textAlign: "left" }}>
                <strong>{s.name}</strong>
                {current?.sec === s.name && <span className="pill here-pill">you are here</span>}
              </span>
              <span aria-hidden>{isOpen ? "⌃" : "⌄"}</span>
            </button>
            <div className="section-stats">
              <span><strong>{n}</strong> of {rows.length} rows completed</span>
              <span><strong>{pct}%</strong> of section complete</span>
            </div>
            <div className="bar" aria-hidden><span style={{ width: `${pct}%` }} /></div>
            {isOpen && (
              <table className="grid">
                <thead>
                  <tr><th>Row</th><th>Done</th><th>Rpt row</th><th>Colour</th><th>Net</th><th>Worked</th></tr>
                </thead>
                {groupBySub(rows).map((g, gi) => (
                  <tbody key={gi}>
                    {g.sub && (
                      <tr className="sub-row"><td colSpan={6}>{g.sub} · {count(g.rows, done)} of {g.rows.length}</td></tr>
                    )}
                    {g.rows.map((r, ri) => {
                      const ticked = done.has(r.row_id);
                      const isHere = current?.row_id === r.row_id;
                      const newRepeat = r.rep_pass != null && r.rep_pass !== g.rows[ri - 1]?.rep_pass;
                      return (
                        <GridRow key={r.row_id} r={r} repeatStart={newRepeat ? r.rep_pass : null} ticked={ticked} isHere={isHere} hereRef={isHere ? hereRef : undefined}
                          selected={selected === r.row_id}
                          onSelect={() => setSelected(selected === r.row_id ? null : r.row_id)}
                          onTick={(v) => update((p) => (v ? setPlace(clue, p, r.row_id) : untickFrom(clue, p, r.row_id)))}
                          onPlace={() => { update((p) => setPlace(clue, p, r.row_id)); setSelected(null); }} />
                      );
                    })}
                  </tbody>
                ))}
              </table>
            )}
          </section>
        );
      })}
      <p className="small muted">{num(clue.total)} stitches in {clue.rows.length} rows.</p>
    </>
  );
}

function GridRow({ r, repeatStart, ticked, isHere, hereRef, selected, onSelect, onTick, onPlace }: {
  r: Row; repeatStart: number | null | undefined; ticked: boolean; isHere: boolean; hereRef?: React.RefObject<HTMLTableRowElement | null>;
  selected: boolean; onSelect: () => void; onTick: (v: boolean) => void; onPlace: () => void;
}) {
  return (
    <>
      {repeatStart != null && <tr className="sub-row"><td colSpan={6}>Repeat {repeatStart}</td></tr>}
      <tr ref={hereRef} className={`${ticked ? "is-done" : ""}${isHere ? " is-here" : ""}`}>
        <td>
          <button className="row-num" aria-expanded={selected} aria-label={`Row ${r.lab}${r.side ? ` ${r.side}` : ""}, options`} onClick={onSelect}>
            {r.lab}<small>{r.side}</small>
          </button>
        </td>
        <td>
          <input type="checkbox" className="tick" checked={ticked} aria-label={`Row ${r.lab} done`} onChange={(e) => onTick(e.target.checked)} />
        </td>
        <td className="num-cell">{r.rep_row ?? ""}</td>
        <ColourCell code={r.col} />
        <td className="num-cell muted">{net(r.net)}</td>
        <td className="num-cell">{r.sts_worked}</td>
      </tr>
      {selected && (
        <tr className="action-row">
          <td colSpan={6}>
            <button className="btn primary" onClick={onPlace}>Done up to here (row {r.actual_row})</button>
            <button className="btn" onClick={onSelect}>Cancel</button>
          </td>
        </tr>
      )}
    </>
  );
}

export function Sections({ clueId }: { clueId: string }) {
  return <ClueGate clueId={clueId}>{(s) => <OverviewBody clue={s.clue} progress={s.progress} update={s.update} />}</ClueGate>;
}
