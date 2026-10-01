import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Clue, Progress } from "../data/schema";

/** Settings kept beside progress on this device. */
export interface Settings {
  /** Light, dark, or follow the phone (default). */
  theme?: "light" | "dark" | "system";
  /** Colours per MKAL: mkal_id -> colour code -> name and swatch. */
  mkalColours?: Record<string, Record<string, { name: string; hex: string }>>;
  /** Older one-set-for-everything colours; still read as a fallback. */
  colourNames: Record<string, string>; // colour code -> user's name
  colourSwatches: Record<string, string>; // colour code -> #rrggbb
  lastBackedUp?: string; // ISO
  firstUsed?: string; // ISO
  welcomeSeen?: boolean;
  installHintSeen?: boolean;
}

export interface Backup {
  app: "knitting-clue-tracker";
  version: 1;
  exported_at: string;
  progress: Progress[];
  settings: Settings;
}

/** Small interface so sync can replace IndexedDB later without touching the screens. */
export interface ProgressStore {
  load(clueId: string): Promise<Progress | undefined>;
  save(progress: Progress): Promise<void>;
  listAll(): Promise<Progress[]>;
  remove(clueId: string): Promise<void>;
  export(): Promise<string>;
  import(json: string): Promise<{ clues: number }>;
  getSettings(): Promise<Settings>;
  saveSettings(settings: Settings): Promise<void>;
  /** Called after any write, from this tab or another. Returns an unsubscribe function. */
  subscribe(listener: () => void): () => void;
}

interface Schema extends DBSchema {
  progress: { key: string; value: Progress };
  settings: { key: string; value: Settings };
}

const DB_NAME = "knitting-clue-tracker";
const SETTINGS_KEY = "settings";
const emptySettings = (): Settings => ({ colourNames: {}, colourSwatches: {} });

export function createIndexedDbStore(name = DB_NAME): ProgressStore {
  let dbPromise: Promise<IDBPDatabase<Schema>> | undefined;
  const db = () =>
    (dbPromise ??= openDB<Schema>(name, 1, {
      upgrade(d) {
        d.createObjectStore("progress", { keyPath: "clue_id" });
        d.createObjectStore("settings");
      },
    }));
  const listeners = new Set<() => void>();
  const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(name) : undefined;
  const notify = () => listeners.forEach((l) => l());
  channel?.addEventListener("message", notify);
  const changed = () => {
    channel?.postMessage("changed");
    notify();
  };

  return {
    async load(clueId) {
      return (await db()).get("progress", clueId);
    },
    async save(progress) {
      await (await db()).put("progress", progress);
      changed();
    },
    async listAll() {
      return (await db()).getAll("progress");
    },
    async remove(clueId) {
      await (await db()).delete("progress", clueId);
      changed();
    },
    async getSettings() {
      return { ...emptySettings(), ...(await (await db()).get("settings", SETTINGS_KEY)) };
    },
    async saveSettings(settings) {
      await (await db()).put("settings", settings, SETTINGS_KEY);
      changed();
    },
    async export() {
      const backup: Backup = {
        app: "knitting-clue-tracker",
        version: 1,
        exported_at: new Date().toISOString(),
        progress: await this.listAll(),
        settings: await this.getSettings(),
      };
      return JSON.stringify(backup, null, 1);
    },
    async import(json) {
      const backup = parseBackup(json);
      const d = await db();
      const tx = d.transaction(["progress", "settings"], "readwrite");
      for (const p of backup.progress) await tx.objectStore("progress").put(p);
      await tx.objectStore("settings").put({ ...emptySettings(), ...backup.settings }, SETTINGS_KEY);
      await tx.done;
      changed();
      return { clues: backup.progress.length };
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export function parseBackup(json: string): Backup {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    throw new Error("That file is not a backup: it is not valid JSON.");
  }
  const b = data as Partial<Backup>;
  if (b?.app !== "knitting-clue-tracker" || b.version !== 1 || !Array.isArray(b.progress))
    throw new Error("That file is not a Knitting Clue Tracker backup.");
  for (const p of b.progress)
    if (typeof p.clue_id !== "string" || !Array.isArray(p.done))
      throw new Error("The backup contains a progress record that is not readable.");
  return b as Backup;
}

export interface Reconciled {
  progress: Progress;
  /** Ticks dropped because their row no longer exists in the clue. */
  dropped: number;
  /** True when the stored data_version differed from the loaded clue. */
  changed: boolean;
}

/**
 * When the clue's data_version differs from the stored one, keep every tick whose row_id still
 * exists and drop the rest. New rows stay unticked.
 */
export function reconcile(progress: Progress, clue: Clue): Reconciled {
  if (progress.data_version === clue.data_version) return { progress, dropped: 0, changed: false };
  const ids = new Set(clue.rows.map((r) => r.row_id));
  const done = progress.done.filter((id) => ids.has(id));
  return {
    progress: { ...progress, data_version: clue.data_version, done },
    dropped: progress.done.length - done.length,
    changed: true,
  };
}

const isoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const todayIso = () => isoDate(new Date());

/** A fresh record: 7 days starting today, nothing ticked. */
export function newProgress(clue: Clue, today = todayIso()): Progress {
  return {
    clue_id: clue.clue_id,
    data_version: clue.data_version,
    start_date: today,
    days: 7,
    done: [],
    updated_at: new Date().toISOString(),
  };
}

/**
 * Check in at a row: tick every row up to and including it (in row order), keeping existing
 * ticks. With untickAfter, rows after it are unticked too, for when you have frogged back.
 */
export function setPlace(clue: Clue, progress: Progress, rowId: string, untickAfter = false): Progress {
  const idx = clue.rows.findIndex((r) => r.row_id === rowId);
  if (idx < 0) return progress;
  const done = new Set(progress.done);
  clue.rows.forEach((r, i) => {
    if (i <= idx) done.add(r.row_id);
    else if (untickAfter) done.delete(r.row_id);
  });
  return { ...progress, done: clue.rows.filter((r) => done.has(r.row_id)).map((r) => r.row_id), updated_at: new Date().toISOString() };
}

/** Untick this row and every row after it, so what stays ticked is still a continuous run. */
export function untickFrom(clue: Clue, progress: Progress, rowId: string): Progress {
  const idx = clue.rows.findIndex((r) => r.row_id === rowId);
  if (idx < 0) return progress;
  if (idx === 0) return { ...progress, done: [], updated_at: new Date().toISOString() };
  return setPlace(clue, progress, clue.rows[idx - 1].row_id, true);
}

export const tickUpTo = (clue: Clue, progress: Progress, rowId: string): Progress => setPlace(clue, progress, rowId);

export function setTicked(progress: Progress, rowId: string, ticked: boolean): Progress {
  const has = progress.done.includes(rowId);
  if (has === ticked) return progress;
  return {
    ...progress,
    done: ticked ? [...progress.done, rowId] : progress.done.filter((id) => id !== rowId),
    updated_at: new Date().toISOString(),
  };
}
