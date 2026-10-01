import { ClueGate } from "../components/ClueGate";
import { Colour, num, rowLabel } from "../components/Format";
import type { Clue, Progress } from "../data/schema";
import { status, weekPlan } from "../lib/plan";
import { hrefFor } from "../router";
import { todayIso } from "../state/progress";

function addDays(iso: string, n: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}
const fmt = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });

type Update = (fn: (p: Progress) => Progress) => Promise<void>;

function PlanBody({ clue, progress, update, clueId }: { clue: Clue; progress: Progress; update: Update; clueId: string }) {
  const today = todayIso();
  const st = status(clue.rows, clue.total, new Set(progress.done), { startDate: progress.start_date, days: progress.days }, today);
  const started = today >= progress.start_date;
  const days = weekPlan(clue.rows, clue.total, progress.days);
  const perDay = clue.total / progress.days;
  const behind = st.gap < 0;
  const touch = (patch: Partial<Progress>) => update((p) => ({ ...p, ...patch, updated_at: new Date().toISOString() }));
  return (
    <>
      <section className="card">
        <h2>Set your week</h2>
        <div className="row">
          <label className="field grow">
            Start date
            <input type="date" value={progress.start_date} onChange={(e) => e.target.value && touch({ start_date: e.target.value })} />
          </label>
          <label className="field" style={{ width: 110 }}>
            Days
            <input
              type="number" inputMode="numeric" min={1} max={60} value={progress.days}
              onChange={(e) => {
                const n = Math.round(Number(e.target.value));
                if (n >= 1 && n <= 60) touch({ days: n });
              }}
            />
          </label>
        </div>
        <p className="small muted" style={{ margin: 0 }}>
          {num(clue.total)} stitches over {progress.days} days is about {num(perDay)} a day.
        </p>
      </section>

      <section className="card" aria-live="polite">
        <h2>{started ? `Today is day ${st.day} of ${progress.days}` : `Starts ${fmt(progress.start_date)}`}</h2>
        <div className="bar" role="progressbar" aria-valuenow={Math.floor((st.done / clue.total) * 100)} aria-valuemin={0} aria-valuemax={100}>
          <span style={{ width: `${(st.done / clue.total) * 100}%` }} />
        </div>
        <p style={{ marginTop: 8 }}>
          {num(st.done)} of {num(clue.total)} stitches ({Math.floor((st.done / clue.total) * 100)}%) · {progress.done.length} of {clue.rows.length} rows
        </p>
        {started && (
          <p className={behind ? "bad" : "good"} style={{ fontWeight: 600 }}>
            {st.gap === 0 ? "Right on target" : behind ? `${num(-st.gap)} stitches behind` : `${num(st.gap)} stitches ahead`}
          </p>
        )}
        {started && st.toGo > 0 && st.rowByEndOfToday && (
          <p className="small muted">{num(st.toGo)} to go today: that gets you to {rowLabel(st.rowByEndOfToday)}.</p>
        )}
        <div className="row" style={{ flexWrap: "wrap" }}>
          <a className="btn primary" href={hrefFor.knit(clueId)}>Go to Knit</a>
          <a className="btn" href={hrefFor.sections(clueId)}>See overview</a>
        </div>
      </section>

      <section className="card">
        <h2>Where to be</h2>
        <table className="days">
          <thead><tr><th>Day</th><th>Target</th><th>Be at</th></tr></thead>
          <tbody>
            {days.map((d) => (
              <tr key={d.day} className={started && d.day === st.day ? "today" : undefined} aria-current={started && d.day === st.day ? "date" : undefined}>
                <td>{d.day}<div className="small muted">{fmt(addDays(progress.start_date, d.day - 1))}</div></td>
                <td>{num(d.target)}</td>
                <td>
                  {d.row ? (<>{rowLabel(d.row)}<div className="small"><Colour code={d.row.col} /></div></>) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}

export function Plan({ clueId }: { clueId: string }) {
  return <ClueGate clueId={clueId}>{({ clue, progress, update }) => <PlanBody clue={clue} progress={progress} update={update} clueId={clueId} />}</ClueGate>;
}
