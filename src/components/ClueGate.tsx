import type { ReactNode } from "react";
import type { Clue, Progress } from "../data/schema";
import { hrefFor } from "../router";
import { useClue, type ClueState } from "../state/AppContext";
import { MkalContext } from "../state/MkalContext";

/** Loads a clue and shows loading, error and "clue updated" states around the screen body. */
export function ClueGate({
  clueId,
  children,
}: {
  clueId: string;
  children: (s: ClueState & { clue: Clue; progress: Progress }) => ReactNode;
}) {
  const s = useClue(clueId);
  if (s.error)
    return <p>Could not open this clue: {s.error} <a href={hrefFor.catalogue()}>Back to the catalogue</a></p>;
  if (!s.clue || !s.progress) return <p className="muted">Loading…</p>;
  return (
    <MkalContext.Provider value={s.clue.mkal_id}>
      {s.change && (
        <div className="notice" role="status">
          <strong>This clue has been updated.</strong>{" "}
          Your ticks are kept for every row that still exists
          {s.change.dropped > 0 ? `; ${s.change.dropped} ticked row${s.change.dropped === 1 ? " is" : "s are"} no longer in the clue and ${s.change.dropped === 1 ? "was" : "were"} dropped` : ""}.
          Check your place in Sections.
          <div><button className="btn" style={{ minHeight: 40, marginTop: 8 }} onClick={s.clearChange}>OK</button></div>
        </div>
      )}
      {children({ ...s, clue: s.clue, progress: s.progress })}
    </MkalContext.Provider>
  );
}
