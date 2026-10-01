import { useEffect, useState } from "react";
import { getCatalogue, loadClue } from "../data/catalogue";
import type { CatalogueClue, CatalogueMkal } from "../data/schema";
import { stitchesDone } from "../lib/plan";
import { hrefFor } from "../router";
import { useStore } from "../state/AppContext";

/** clue_id -> fraction of stitches done, for every clue version the user has started. */
function useProgressFractions(): Record<string, number> {
  const store = useStore();
  const [fractions, setFractions] = useState<Record<string, number>>({});
  useEffect(() => {
    let live = true;
    const read = async () => {
      const out: Record<string, number> = {};
      for (const p of await store.listAll()) {
        if (p.done.length === 0) continue;
        try {
          const clue = await loadClue(p.clue_id);
          out[p.clue_id] = clue.total > 0 ? stitchesDone(clue.rows, new Set(p.done)) / clue.total : 0;
        } catch {
          /* a clue no longer shipped: leave it out */
        }
      }
      if (live) setFractions(out);
    };
    read();
    const off = store.subscribe(read);
    return () => { live = false; off(); };
  }, [store]);
  return fractions;
}

const pct = (f: number) => `${Math.floor(f * 100)}%`;

function ClueItem({ clue, fractions }: { clue: CatalogueClue; fractions: Record<string, number> }) {
  const [open, setOpen] = useState(false);
  const single = clue.variants.length === 1;
  const best = Math.max(0, ...clue.variants.map((v) => fractions[v.clue_id] ?? 0));
  const inner = (
    <>
      <div className="grow">
        <strong>{clue.title}</strong>
        <div className="small muted">
          {single
            ? `${clue.variants[0].total.toLocaleString()} stitches · ${clue.variants[0].rows} rows`
            : `${clue.variants.length} versions`}
        </div>
        {best > 0 && (
          <div className="bar" style={{ marginTop: 6 }} role="progressbar" aria-valuenow={Math.floor(best * 100)} aria-valuemin={0} aria-valuemax={100}>
            <span style={{ width: pct(best) }} />
          </div>
        )}
      </div>
      {best > 0 && <span className="pill">{pct(best)}</span>}
      <span aria-hidden>{single ? "›" : open ? "⌃" : "⌄"}</span>
    </>
  );
  return (
    <li>
      {single ? (
        <a className="link-row" href={hrefFor.plan(clue.variants[0].clue_id)}>{inner}</a>
      ) : (
        <>
          <button className="link-row" aria-expanded={open} onClick={() => setOpen(!open)}>{inner}</button>
          {open && (
            <ul className="list" style={{ paddingLeft: 12 }}>
              {clue.variants.map((v) => (
                <li key={v.clue_id}>
                  <a className="link-row" href={hrefFor.plan(v.clue_id)}>
                    <div className="grow">
                      <strong>{v.name}</strong>
                      <div className="small muted">{v.total.toLocaleString()} stitches · {v.rows} rows</div>
                    </div>
                    {fractions[v.clue_id] ? <span className="pill">{pct(fractions[v.clue_id])}</span> : null}
                    <span aria-hidden>›</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </li>
  );
}

function MkalCard({ mkal, fractions }: { mkal: CatalogueMkal; fractions: Record<string, number> }) {
  const [open, setOpen] = useState(false);
  const versions = mkal.clues.reduce((n, c) => n + c.variants.length, 0);
  const started = mkal.clues.filter((c) => c.variants.some((v) => (fractions[v.clue_id] ?? 0) > 0)).length;
  return (
    <section className={`mkal-card${open ? " is-open" : ""}`}>
      <button className="mkal-head" aria-expanded={open} aria-controls={`clues-${mkal.mkal_id}`} onClick={() => setOpen(!open)}>
        <span className="grow" style={{ textAlign: "left" }}>
          <span className="mkal-year">{mkal.year}</span>
          <span className="mkal-name">{mkal.name}</span>
          <span className="small muted">
            {mkal.designer} · {mkal.clues.length} clue{mkal.clues.length === 1 ? "" : "s"}
            {versions > mkal.clues.length ? `, ${versions} versions` : ""}
            {started > 0 ? ` · ${started} started` : ""}
          </span>
        </span>
        <span className="mkal-chevron" aria-hidden>{open ? "⌃" : "⌄"}</span>
      </button>
      {open && (
        <ul className="list" id={`clues-${mkal.mkal_id}`} style={{ padding: "0 18px 10px" }}>
          {mkal.clues.map((c) => <ClueItem key={c.base_clue_id} clue={c} fractions={fractions} />)}
        </ul>
      )}
    </section>
  );
}

export function Catalogue() {
  const fractions = useProgressFractions();
  const { mkals } = getCatalogue();
  if (mkals.length === 0)
    return <p className="muted">No clues are bundled with this build yet.</p>;
  return (
    <>
      <p className="muted">Pick your MKAL, then the clue you are knitting.</p>
      {mkals.map((m) => <MkalCard key={m.mkal_id} mkal={m} fractions={fractions} />)}
    </>
  );
}
