import { useEffect, useRef, useState } from "react";
import { getCatalogue, loadClue } from "../data/catalogue";
import type { Clue } from "../data/schema";
import type { Settings as SettingsData } from "../state/progress";
import { backupReminderDue } from "../lib/backup";
import { PRESETS, colourFor, readableInk, withColour } from "../lib/colours";
import { hrefFor } from "../router";
import { useSettings, useStore } from "../state/AppContext";

const variants = getCatalogue().mkals.flatMap((m) =>
  m.clues.flatMap((c) => c.variants.map((v) => ({ id: v.clue_id, label: `${m.name} ${m.year} · ${c.title}${v.name ? ` · ${v.name}` : ""}` }))),
);

const CONVENTION_TEXT: Record<string, string> = {
  bind_off: "Bind-off stitches count as effort",
  icord_bo_weight: "I-cord bind-off counts each stitch this many times",
  icord_run: "A long I-cord cast-on is counted as",
  held_placement: "Placing held stitches counts as",
  graft: "Kitchener graft counts as",
  cast_on_counts: "Cast-on stitches count as effort",
  short_rows: "Short rows count",
  decreases: "Decreases are counted at the",
  finishing_steps: "Finishing steps count as",
};

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function Settings({ initialMkal }: { initialMkal?: string }) {
  const store = useStore();
  const { settings, update: patch } = useSettings();
  const update = (next: Parameters<typeof patch>[0] | SettingsData) => patch(next as Partial<SettingsData>);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState<string | null>(null);
  const [clueId, setClueId] = useState(variants[0]?.id ?? "");
  const mkals = getCatalogue().mkals;
  const [mkalId, setMkalId] = useState(mkals.find((m) => m.mkal_id === initialMkal)?.mkal_id ?? mkals[0]?.mkal_id ?? "");
  const [codes, setCodes] = useState<string[]>([]);
  const [clue, setClue] = useState<Clue | null>(null);
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!clueId) return;
    let live = true;
    loadClue(clueId).then((c) => live && setClue(c)).catch(() => live && setClue(null));
    return () => { live = false; };
  }, [clueId]);
  // The colour codes used by this MKAL's clues, in order of first use.
  useEffect(() => {
    let live = true;
    const ids = mkals.find((m) => m.mkal_id === mkalId)?.clues.flatMap((c) => c.variants.map((v) => v.clue_id)) ?? [];
    Promise.all(ids.map((id) => loadClue(id).catch(() => null))).then((clues) => {
      if (!live) return;
      const seen: string[] = [];
      for (const c of clues) for (const code of c?.colours ?? []) if (!seen.includes(code)) seen.push(code);
      setCodes(seen);
    });
    return () => { live = false; };
  }, [mkalId, mkals]);
  useEffect(() => { navigator.storage?.persisted?.().then(setPersisted).catch(() => {}); }, []);

  const backUp = async () => {
    const text = await store.export();
    download(`clue-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`, text);
    await update({ lastBackedUp: new Date().toISOString() });
    setMessage("Backup saved to your downloads.");
  };
  const restore = async (file: File) => {
    try {
      const r = await store.import(await file.text());
      setMessage(`Restored progress for ${r.clues} clue${r.clues === 1 ? "" : "s"}.`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not restore that file.");
    }
  };
  const reset = async (id: string) => {
    if (id === "*") for (const p of await store.listAll()) await store.remove(p.clue_id);
    else await store.remove(id);
    setConfirmReset(null);
    setMessage("Progress reset.");
  };

  const due = backupReminderDue(settings.firstUsed, settings.lastBackedUp);
  return (
    <>
      {message && <div className="notice" role="status">{message}</div>}
      {due && <div className="notice">It has been a week or more since you last backed up. Use Back up below.</div>}

      <section className="card">
        <h2>Your colours</h2>
        <p className="small muted">Say which yarn you are using for each colour code, and it shows up everywhere in the app. Each MKAL has its own set.</p>
        <label className="field">
          MKAL
          <select value={mkalId} onChange={(e) => setMkalId(e.target.value)}>
            {mkals.map((m) => <option key={m.mkal_id} value={m.mkal_id}>{m.name} {m.year}</option>)}
          </select>
        </label>
        {codes.map((code) => {
          const c = colourFor(settings, mkalId, code);
          return (
            <fieldset key={code} style={{ border: 0, padding: 0, margin: "0 0 16px" }}>
              <legend className="row" style={{ padding: 0, marginBottom: 6 }}>
                <span className="swatch" style={{ width: 30, height: 30, background: c.hex ?? "transparent", borderStyle: c.hex ? "solid" : "dashed" }} aria-hidden />
                <strong>{code}</strong>
                <span className="muted small">{c.hex ? c.name || "unnamed" : "not set"}</span>
              </legend>
              <div className="chips" role="group" aria-label={`Quick colours for ${code}`}>
                {PRESETS.map((p) => (
                  <button key={p.name} type="button" className="chip" aria-pressed={c.hex?.toLowerCase() === p.hex}
                    style={{ background: p.hex, color: readableInk(p.hex) }}
                    onClick={() => update(withColour(settings, mkalId, code, p))}>
                    {p.name}
                  </button>
                ))}
              </div>
              <div className="row" style={{ marginTop: 8 }}>
                <input aria-label={`Name for ${code}`} placeholder="Name, e.g. Charcoal" value={c.name} className="text-input"
                  onChange={(e) => update(withColour(settings, mkalId, code, { name: e.target.value }))} />
                <input type="color" aria-label={`Custom colour for ${code}`} value={c.hex ?? "#cccccc"} className="colour-input"
                  onChange={(e) => update(withColour(settings, mkalId, code, { hex: e.target.value }))} />
              </div>
            </fieldset>
          );
        })}
      </section>

      <section className="card">
        <h2>Counting rules used</h2>
        <label className="field">
          Clue
          <select value={clueId} onChange={(e) => setClueId(e.target.value)}>
            {variants.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
          </select>
        </label>
        {clue ? (
          <ul className="list">
            {Object.entries(clue.conventions).map(([k, v]) => {
              const c = v as { value: unknown; status: string };
              return (
                <li key={k} style={{ padding: "6px 0" }}>
                  <div>{CONVENTION_TEXT[k] ?? k}: <strong>{String(c.value)}</strong></div>
                  <div className="small muted">{c.status === "confirmed" ? "Confirmed" : "Assumed, may change"}</div>
                </li>
              );
            })}
          </ul>
        ) : <p className="muted">Loading…</p>}
      </section>

      <section className="card">
        <h2>Back up and restore</h2>
        <p className="small muted">
          Progress is saved on this device only.{" "}
          {settings.lastBackedUp ? `Last backed up ${new Date(settings.lastBackedUp).toLocaleString()}.` : "You have not backed up yet."}
          {persisted === false && " Your browser may clear this data; adding the app to your home screen helps."}
        </p>
        <div className="row" style={{ flexWrap: "wrap" }}>
          <button className="btn primary" onClick={backUp}>Back up</button>
          <button className="btn" onClick={() => fileRef.current?.click()}>Restore</button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden
            onChange={(e) => { const f = e.target.files?.[0]; if (f) restore(f); e.target.value = ""; }} />
        </div>
      </section>

      <section className="card">
        <h2>Reset progress</h2>
        <label className="field">
          Clue
          <select value={clueId} onChange={(e) => { setClueId(e.target.value); setConfirmReset(null); }}>
            {variants.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
          </select>
        </label>
        {confirmReset ? (
          <div className="notice" role="alertdialog">
            {confirmReset === "*" ? "Reset progress for every clue?" : "Reset progress for this clue?"} This cannot be undone.
            <div className="row" style={{ marginTop: 8 }}>
              <button className="btn danger" onClick={() => reset(confirmReset)}>Yes, reset</button>
              <button className="btn" onClick={() => setConfirmReset(null)}>Cancel</button>
            </div>
          </div>
        ) : (
          <div className="row" style={{ flexWrap: "wrap" }}>
            <button className="btn danger" onClick={() => setConfirmReset(clueId)}>Reset this clue</button>
            <button className="btn danger" onClick={() => setConfirmReset("*")}>Reset everything</button>
          </div>
        )}
      </section>

      <section className="card">
        <h2>Help</h2>
        <a className="btn" href={hrefFor.help()}>How to use this app</a>
      </section>
    </>
  );
}
