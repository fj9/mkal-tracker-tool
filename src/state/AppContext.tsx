import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { loadClue } from "../data/catalogue";
import type { Clue, Progress } from "../data/schema";
import { createIndexedDbStore, newProgress, reconcile, type ProgressStore, type Settings } from "./progress";

const store = createIndexedDbStore();
const StoreContext = createContext<ProgressStore>(store);
export const useStore = () => useContext(StoreContext);
export function StoreProvider({ children }: { children: ReactNode }) {
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

const defaultSettings: Settings = { colourNames: {}, colourSwatches: {} };

/** Settings, kept fresh when another tab writes. */
export function useSettings() {
  const s = useStore();
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let live = true;
    const read = () => s.getSettings().then((v) => live && (setSettings(v), setReady(true)));
    read();
    const off = s.subscribe(read);
    return () => { live = false; off(); };
  }, [s]);
  const update = useCallback(
    async (patch: Partial<Settings>) => {
      const next = { ...(await s.getSettings()), ...patch };
      setSettings(next);
      await s.saveSettings(next);
    },
    [s],
  );
  return { settings, update, ready };
}

export interface ClueState {
  clue: Clue | null;
  progress: Progress | null;
  error: string | null;
  /** Set when a rebuilt clue changed under saved progress; dismiss with clearChange. */
  change: { dropped: number } | null;
  clearChange(): void;
  update(fn: (p: Progress) => Progress): Promise<void>;
}

/** Loads a clue and its progress, reconciles on data_version change, and persists updates. */
export function useClue(clueId: string): ClueState {
  const s = useStore();
  const [clue, setClue] = useState<Clue | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [change, setChange] = useState<{ dropped: number } | null>(null);

  useEffect(() => {
    let live = true;
    setClue(null); setProgress(null); setError(null); setChange(null);
    loadClue(clueId)
      .then(async (c) => {
        const stored = await s.load(clueId);
        let p = stored ? stored : newProgress(c);
        // The start date defaults to the day the clue is first opened, so save it right away.
        if (!stored) await s.save(p);
        if (stored) {
          const r = reconcile(stored, c);
          p = r.progress;
          if (r.changed) {
            await s.save(p);
            if (live) setChange({ dropped: r.dropped });
          }
        }
        if (live) { setClue(c); setProgress(p); }
      })
      .catch((e: unknown) => live && setError(e instanceof Error ? e.message : String(e)));
    // Refresh when another tab writes (last write wins, so re-read before the next write).
    const off = s.subscribe(() => s.load(clueId).then((p) => live && p && setProgress(p)));
    return () => { live = false; off(); };
  }, [s, clueId]);

  const update = useCallback(
    async (fn: (p: Progress) => Progress) => {
      const latest = (await s.load(clueId)) ?? progress;
      if (!latest) return;
      const next = fn(latest);
      setProgress(next);
      await s.save(next);
      const st = await s.getSettings();
      if (!st.firstUsed) await s.saveSettings({ ...st, firstUsed: new Date().toISOString() });
      if (next.done.length > 0 && !("__persisted" in window)) {
        (window as unknown as Record<string, boolean>).__persisted = true;
        navigator.storage?.persist?.().catch(() => {});
      }
    },
    [s, clueId, progress],
  );

  return useMemo(
    () => ({ clue, progress, error, change, clearChange: () => setChange(null), update }),
    [clue, progress, error, change, update],
  );
}
