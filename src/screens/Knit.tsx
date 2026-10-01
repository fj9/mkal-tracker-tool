import { useMemo, useRef, useState } from "react";
import { CheckIn } from "../components/CheckIn";
import { ClueGate } from "../components/ClueGate";
import { Colour, ColourBand, num } from "../components/Format";
import type { Clue, Progress, Row } from "../data/schema";
import { indexRows, upcoming } from "../lib/rows";
import { status } from "../lib/plan";
import { hrefFor } from "../router";
import { setTicked, todayIso } from "../state/progress";

function Counts({ r }: { r: Row }) {
  const bits = [`start ${r.sts_start}`, `work ${r.sts_worked}`, `end ${r.sts_end}`];
  const shaping = [
    r.inc ? `${r.inc} increased` : "", r.dec ? `${r.dec} decreased` : "",
    r.cast_on ? `${r.cast_on} cast on` : "", r.live ? `${r.live} taken from hold` : "",
    r.bo ? `${r.bo} bound off` : "", r.sts_unworked ? `${r.sts_unworked} unworked` : "",
  ].filter(Boolean);
  return (
    <>
      <p style={{ fontSize: "1.3rem", fontWeight: 700, margin: "8px 0 4px" }}>{bits.join(", ")}</p>
      {shaping.length > 0 && <p className="muted small">{shaping.join(" · ")}{r.marker != null ? ` · marker ${r.marker}` : ""}</p>}
    </>
  );
}

function KnitBody({ clue, progress, update }: { clue: Clue; progress: Progress; update: (fn: (p: Progress) => Progress) => Promise<void> }) {
  const idx = useMemo(() => indexRows(clue), [clue]);
  const done = useMemo(() => new Set(progress.done), [progress.done]);
  const { current, next } = upcoming(clue.rows, done, 3);
  const recent = useRef<string[]>([]);
  const [checkIn, setCheckIn] = useState(false);
  const today = todayIso();
  const st = status(clue.rows, clue.total, done, { startDate: progress.start_date, days: progress.days }, today);
  const started = today >= progress.start_date;

  const tick = (r: Row) => { recent.current.push(r.row_id); update((p) => setTicked(p, r.row_id, true)); };
  const undo = () => {
    // Undo the most recent tick in this session, otherwise the last ticked row in clue order.
    let id = recent.current.pop();
    while (id && !done.has(id)) id = recent.current.pop();
    id ??= [...clue.rows].reverse().find((r) => done.has(r.row_id))?.row_id;
    if (id) update((p) => setTicked(p, id!, false));
  };

  const statusBar = (
    <div className="card" role="status" aria-live="polite" style={{ padding: "10px 14px" }}>
      <div className="row">
        <div className="grow small">
          {started ? <>Day {st.day} of {progress.days}</> : <>Not started</>} · {num(st.done)} of {num(clue.total)} stitches
        </div>
        {started && (
          <strong className={st.gap < 0 ? "bad" : "good"}>
            {st.gap === 0 ? "On target" : st.gap < 0 ? `${num(-st.gap)} behind` : `${num(st.gap)} ahead`}
          </strong>
        )}
      </div>
      <div className="bar" style={{ marginTop: 6 }}><span style={{ width: `${(st.done / clue.total) * 100}%` }} /></div>
      <button className="btn" style={{ marginTop: 10, minHeight: 44 }} onClick={() => setCheckIn(true)}>Check in: I have knitted up to…</button>
      {checkIn && <CheckIn clue={clue} progress={progress} update={update} onClose={() => setCheckIn(false)} />}
    </div>
  );

  if (!current)
    return (
      <>
        {statusBar}
        <div className="card">
          <h2>All rows done 🎉</h2>
          <p>You have ticked every row of this clue.</p>
          <button className="btn" onClick={undo}>Undo last row</button>{" "}
          <a className="btn" href={hrefFor.catalogue()}>Back to the catalogue</a>
        </div>
      </>
    );

  const stripeLen = idx.stripeLength(current);
  const passes = idx.repPasses(current);
  const repRows = idx.repRows(current);
  return (
    <>
      {statusBar}
      <section className="card" aria-labelledby="now">
        <div className="small muted" id="now">Now knitting · row {current.actual_row} of {clue.rows.length}</div>
        <h2 style={{ marginTop: 4 }}>{current.sec}</h2>
        <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
          <strong style={{ fontSize: "1.4rem" }}>Row {current.lab}</strong>
          {current.side && <span className="pill">{current.side}</span>}
          {current.sub && <span className="pill">{current.sub}</span>}
        </div>
        <ColourBand code={current.col} detail={current.stripe ? `${current.stripe}${stripeLen ? `, row ${current.stripe_row} of ${stripeLen}` : ""}` : undefined} />
        <Counts r={current} />
        {current.rep_row != null && (
          <p className="small muted">
            Repeat: {passes ? `pass ${current.rep_pass} of ${passes}, ` : ""}row {current.rep_row}{repRows ? ` of ${repRows}` : ""}
          </p>
        )}
        {current.instr ? (
          <p style={{ borderTop: "1px solid var(--line)", paddingTop: 8 }}>{current.instr}</p>
        ) : (
          <p className="small muted">Follow your own pattern PDF for the instructions.</p>
        )}
        <button className="btn primary big" onClick={() => tick(current)}>Done</button>
        <div style={{ marginTop: 8 }}>
          <button className="btn" onClick={undo} disabled={progress.done.length === 0}>Undo</button>
        </div>
      </section>

      {next.length > 0 && (
        <section className="card">
          <h3>Next</h3>
          <ul className="list">
            {next.map((r) => (
              <li key={r.row_id} className="row" style={{ padding: "8px 0" }}>
                <div className="grow">
                  <strong>{r.lab}{r.side ? ` ${r.side}` : ""}</strong> <span className="small muted">{r.sec.replace(/^Section \d+ - /, "")}</span>
                  <div className="small muted">start {r.sts_start}, work {r.sts_worked}, end {r.sts_end}</div>
                </div>
                <Colour code={r.col} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

export function Knit({ clueId }: { clueId: string }) {
  return <ClueGate clueId={clueId}>{(s) => <KnitBody clue={s.clue} progress={s.progress} update={s.update} />}</ClueGate>;
}
