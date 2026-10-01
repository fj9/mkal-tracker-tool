import { useMemo, useState } from "react";
import type { Clue, Progress, Row } from "../data/schema";
import { aheadBehind, stitchesDone, targetAtEndOfDay, todayDayNumber } from "../lib/plan";
import { setPlace, todayIso } from "../state/progress";
import { num } from "./Format";

interface Props {
  clue: Clue;
  progress: Progress;
  update: (fn: (p: Progress) => Progress) => Promise<void>;
  onClose: () => void;
}

const optionLabel = (r: Row) =>
  `Row ${r.lab}${r.side ? ` ${r.side}` : ""}${r.sub ? ` · ${r.sub}` : ""}${r.rep_pass ? ` · repeat ${r.rep_pass}` : ""}  (#${r.actual_row})`;

/**
 * "I have done everything up to here": pick a section and a row and tick all rows up to it,
 * so you can check in now and then instead of ticking every row.
 */
export function CheckIn({ clue, progress, update, onClose }: Props) {
  const done = useMemo(() => new Set(progress.done), [progress.done]);
  const firstUnticked = clue.rows.find((r) => !done.has(r.row_id)) ?? clue.rows[clue.rows.length - 1];
  const [sec, setSec] = useState(firstUnticked.sec);
  const rowsInSec = useMemo(() => clue.rows.filter((r) => r.sec === sec), [clue, sec]);
  const [rowId, setRowId] = useState(firstUnticked.row_id);
  const [untickAfter, setUntickAfter] = useState(false);

  const row = clue.rows.find((r) => r.row_id === rowId) ?? rowsInSec[0];
  const idx = clue.rows.indexOf(row);
  const newlyTicked = clue.rows.slice(0, idx + 1).filter((r) => !done.has(r.row_id));
  const laterTicked = clue.rows.slice(idx + 1).filter((r) => done.has(r.row_id));
  const preview = setPlace(clue, progress, row.row_id, untickAfter);
  const after = stitchesDone(clue.rows, new Set(preview.done));
  const day = todayDayNumber(progress.start_date, progress.days, todayIso());
  const gap = aheadBehind(after, targetAtEndOfDay(clue.total, progress.days, day));
  const started = todayIso() >= progress.start_date;

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="ci-title" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ maxHeight: "92vh", overflowY: "auto" }}>
        <h2 id="ci-title">Check in</h2>
        <p className="muted small">Pick the last row you have finished. Everything up to and including it is marked done.</p>
        <label className="field">
          Section
          <select value={sec} onChange={(e) => { setSec(e.target.value); setRowId(clue.rows.find((r) => r.sec === e.target.value)!.row_id); }}>
            {clue.sections.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
          </select>
        </label>
        <label className="field">
          Last row finished
          <select value={row.row_id} onChange={(e) => setRowId(e.target.value)}>
            {rowsInSec.map((r) => <option key={r.row_id} value={r.row_id}>{done.has(r.row_id) ? "✓ " : ""}{optionLabel(r)}</option>)}
          </select>
        </label>
        <div className="card" role="status" aria-live="polite" style={{ background: "var(--wash)" }}>
          {newlyTicked.length === 0 ? "Nothing new to tick: those rows are already done." : (
            <>This ticks <strong>{newlyTicked.length}</strong> more row{newlyTicked.length === 1 ? "" : "s"}.</>
          )}{" "}
          You will have done {num(after)} of {num(clue.total)} stitches ({Math.floor((after / clue.total) * 100)}%)
          {started ? <>, {gap === 0 ? "right on target" : gap > 0 ? `${num(gap)} ahead` : `${num(-gap)} behind`} today.</> : "."}
        </div>
        {laterTicked.length > 0 && (
          <label className="row" style={{ marginBottom: 12, minHeight: 44 }}>
            <input type="checkbox" checked={untickAfter} onChange={(e) => setUntickAfter(e.target.checked)} style={{ width: 22, height: 22 }} />
            <span>I have frogged back: also untick the {laterTicked.length} ticked row{laterTicked.length === 1 ? "" : "s"} after this.</span>
          </label>
        )}
        <div className="row">
          <button className="btn" onClick={onClose}>Cancel</button>
          <div className="grow" />
          <button
            className="btn primary"
            disabled={newlyTicked.length === 0 && !(untickAfter && laterTicked.length > 0)}
            onClick={() => { update((p) => setPlace(clue, p, row.row_id, untickAfter)); onClose(); }}
          >
            Mark done up to here
          </button>
        </div>
      </div>
    </div>
  );
}
