import { useEffect, useState } from "react";
import { registerSW } from "virtual:pwa-register";

/** Registers the service worker and asks the user to reload when a new version has been cached. */
export function UpdatePrompt() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [update, setUpdate] = useState<(() => Promise<void>) | null>(null);
  useEffect(() => {
    const fn = registerSW({ onNeedRefresh: () => setNeedRefresh(true) });
    setUpdate(() => fn);
  }, []);
  if (!needRefresh) return null;
  return (
    <div className="overlay" role="alertdialog" aria-label="Update available">
      <div className="sheet">
        <h2>A new version is ready</h2>
        <p>Reload to get the latest clue data and fixes. Your progress is kept.</p>
        <div className="row">
          <button className="btn" onClick={() => setNeedRefresh(false)}>Later</button>
          <div className="grow" />
          <button className="btn primary" onClick={() => update?.()}>Reload</button>
        </div>
      </div>
    </div>
  );
}
