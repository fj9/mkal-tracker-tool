import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { loadClueFile } from "../../scripts/fixtures";
import { createIndexedDbStore, newProgress, parseBackup, reconcile, setPlace, setTicked, tickUpTo, untickFrom } from "./progress";

const clue = loadClueFile("twists_turns_clue1");

describe("reconcile", () => {
  it("leaves progress alone when data_version matches", () => {
    const p = { ...newProgress(clue), done: [clue.rows[0].row_id] };
    expect(reconcile(p, clue)).toEqual({ progress: p, dropped: 0, changed: false });
  });

  it("keeps ticks for rows that still exist, drops the rest, adopts the new data_version", () => {
    const p = { ...newProgress(clue), data_version: "old", done: [clue.rows[0].row_id, clue.rows[1].row_id, "gone:1"] };
    const r = reconcile(p, clue);
    expect(r.changed).toBe(true);
    expect(r.dropped).toBe(1);
    expect(r.progress.done).toEqual([clue.rows[0].row_id, clue.rows[1].row_id]);
    expect(r.progress.data_version).toBe(clue.data_version);
  });
});

describe("ticking", () => {
  it("ticks and unticks a single row", () => {
    let p = newProgress(clue);
    p = setTicked(p, clue.rows[3].row_id, true);
    expect(p.done).toEqual([clue.rows[3].row_id]);
    p = setTicked(p, clue.rows[3].row_id, false);
    expect(p.done).toEqual([]);
  });

  it("tick up to here marks every row up to and including the chosen one, in order", () => {
    const p = tickUpTo(clue, setTicked(newProgress(clue), clue.rows[8].row_id, true), clue.rows[5].row_id);
    expect(p.done).toEqual(clue.rows.slice(0, 6).concat(clue.rows[8]).map((r) => r.row_id));
  });
});

describe("setPlace (check in)", () => {
  it("ticks everything up to the row and leaves later ticks alone by default", () => {
    const start = setTicked(newProgress(clue), clue.rows[20].row_id, true);
    const p = setPlace(clue, start, clue.rows[9].row_id);
    expect(p.done).toEqual(clue.rows.slice(0, 10).concat(clue.rows[20]).map((r) => r.row_id));
  });
  it("can also untick rows after it, for when you have frogged back", () => {
    const ticked = setPlace(clue, newProgress(clue), clue.rows[30].row_id);
    const p = setPlace(clue, ticked, clue.rows[9].row_id, true);
    expect(p.done).toEqual(clue.rows.slice(0, 10).map((r) => r.row_id));
  });
  it("ignores an unknown row", () => {
    const p = newProgress(clue);
    expect(setPlace(clue, p, "nope")).toBe(p);
  });
});

describe("untickFrom", () => {
  it("unticks the row and everything after it, keeping the rows before", () => {
    const ticked = setPlace(clue, newProgress(clue), clue.rows[12].row_id);
    expect(untickFrom(clue, ticked, clue.rows[5].row_id).done).toEqual(clue.rows.slice(0, 5).map((r) => r.row_id));
  });
  it("unticking the first row clears everything", () => {
    const ticked = setPlace(clue, newProgress(clue), clue.rows[3].row_id);
    expect(untickFrom(clue, ticked, clue.rows[0].row_id).done).toEqual([]);
  });
});

describe("IndexedDB store", () => {
  it("saves, loads, lists and removes progress", async () => {
    const store = createIndexedDbStore("test-basic");
    const p = setTicked(newProgress(clue), clue.rows[0].row_id, true);
    await store.save(p);
    expect(await store.load(clue.clue_id)).toEqual(p);
    expect(await store.listAll()).toHaveLength(1);
    await store.remove(clue.clue_id);
    expect(await store.load(clue.clue_id)).toBeUndefined();
  });

  it("round-trips a backup between two stores", async () => {
    const a = createIndexedDbStore("test-a");
    const b = createIndexedDbStore("test-b");
    await a.save(setTicked(newProgress(clue), clue.rows[0].row_id, true));
    await a.saveSettings({ colourNames: { MC: "Grey" }, colourSwatches: { MC: "#888888" } });
    expect(await b.import(await a.export())).toEqual({ clues: 1 });
    expect((await b.load(clue.clue_id))?.done).toEqual([clue.rows[0].row_id]);
    expect((await b.getSettings()).colourNames).toEqual({ MC: "Grey" });
  });

  it("notifies subscribers on write", async () => {
    const store = createIndexedDbStore("test-notify");
    let n = 0;
    const off = store.subscribe(() => n++);
    await store.save(newProgress(clue));
    off();
    await store.save(newProgress(clue));
    expect(n).toBe(1);
  });
});

describe("parseBackup", () => {
  it("rejects files that are not backups", () => {
    expect(() => parseBackup("nope")).toThrow(/valid JSON/);
    expect(() => parseBackup("{}")).toThrow(/not a Knitting Clue Tracker backup/);
  });
});
