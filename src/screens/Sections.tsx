import { useMemo, useState } from "react";
import { CheckIn } from "../components/CheckIn";
import { ClueGate } from "../components/ClueGate";
import { Colour } from "../components/Format";
import type { Clue, Progress, Row } from "../data/schema";
import { setTicked, tickUpTo } from "../state/progress";

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

function SectionsBody({ clue, progress, update }: { clue: Clue; progress: Progress; update: (fn: (p: Progress) => Progress) => Promise<void> }) {
  const done = useMemo(() => new Set(progress.done), [progress.done]);
  const [open, setOpen] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [checkIn, setCheckIn] = useState(false);

  // Stripe progress keyed by section + stripe name.
  const stripes = useMemo(() => {
    const m = new Map<string, Row[]>();
    for (const r of clue.rows) if (r.stripe) m.set(`${r.sec}|${r.stripe}`, [...(m.get(`${r.sec}|${r.stripe}`) ?? []), r]);
    return m;
  }, [clue]);

  const firstUnticked = clue.rows.find((r) => !done.has(r.row_id));
  const bySection = useMemo(() => {
    const m = new Map<string, Row[]>();
    for (const r of clue.rows) m.set(r.sec, [...(m.get(r.sec) ?? []), r]);
    return m;
  }, [clue]);

  return (
    <>
      <p className="muted">Open a section to see its rows, or check in to say how far you have got.</p>
      <button className="btn primary" style={{ marginBottom: 12 }} onClick={() => setCheckIn(true)}>Check in</button>
      {checkIn && <CheckIn clue={clue} progress={progress} update={update} onClose={() => setCheckIn(false)} />}
      {clue.sections.map((s) => {
        const rows = bySection.get(s.name) ?? [];
        const n = count(rows, done);
        const isOpen = open === s.name;
        const current = firstUnticked?.sec === s.name;
        return (
          <section className="card" key={s.name}>
            <button className="link-row" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : s.name)} style={{ padding: 0 }}>
              <div className="grow">
                <strong>{s.name}</strong>{current && <span className="pill" style={{ marginLeft: 8 }}>you are here</span>}
                <div className="small muted">{n} of {rows.length} rows · {s.stitches_worked.toLocaleString()} stitches</div>
                <div className="bar" style={{ marginTop: 6 }}><span style={{ width: `${rows.length ? (n / rows.length) * 100 : 0}%` }} /></div>
              </div>
              <span aria-hidden>{isOpen ? "⌃" : "⌄"}</span>
            </button>
            {isOpen && groupBySub(rows).map((g, gi) => (
              <div key={gi} style={{ marginTop: 12 }}>
                {g.sub && <h3>{g.sub} <span className="small muted">{count(g.rows, done)} of {g.rows.length}</span></h3>}
                <ul className="list">
                  {g.rows.map((r) => {
                    const ticked = done.has(r.row_id);
                    const st = r.stripe ? stripes.get(`${r.sec}|${r.stripe}`) : undefined;
                    return (
                      <li key={r.row_id} style={{ padding: "6px 0" }}>
                        <div className="row">
                          <label className="row grow" style={{ minHeight: 44, cursor: "pointer" }}>
                            <input type="checkbox" checked={ticked} style={{ width: 22, height: 22 }}
                              onChange={(e) => update((p) => setTicked(p, r.row_id, e.target.checked))} />
                            <span className="grow">
                              <strong>{r.lab}{r.side ? ` ${r.side}` : ""}</strong>{" "}
                              <Colour code={r.col} />
                              <span className="small muted"> · start {r.sts_start}, work {r.sts_worked}, end {r.sts_end}</span>
                              {st && <span className="small muted"> · {r.stripe} {count(st, done)}/{st.length}</span>}
                            </span>
                          </label>
                          <button className="btn" style={{ minHeight: 40, padding: "0 10px", fontSize: ".8rem" }} onClick={() => setPending(r.row_id)}>Tick up to here</button>
                        </div>
                        {pending === r.row_id && (
                          <div className="notice" role="alertdialog" aria-label="Confirm tick up to here" style={{ marginTop: 6 }}>
                            Tick every row up to and including row {r.actual_row} ({r.sec} · {r.lab})?
                            <div className="row" style={{ marginTop: 8 }}>
                              <button className="btn primary" onClick={() => { update((p) => tickUpTo(clue, p, r.row_id)); setPending(null); }}>Yes, tick them</button>
                              <button className="btn" onClick={() => setPending(null)}>Cancel</button>
                            </div>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </section>
        );
      })}
    </>
  );
}

export function Sections({ clueId }: { clueId: string }) {
  return <ClueGate clueId={clueId}>{(s) => <SectionsBody clue={s.clue} progress={s.progress} update={s.update} />}</ClueGate>;
}
