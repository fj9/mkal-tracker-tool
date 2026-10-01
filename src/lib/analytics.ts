/**
 * GoatCounter: a small, cookie-free visit counter. Set your site code (the part before
 * ".goatcounter.com") to turn it on; leave it empty and nothing is loaded or sent.
 */
export const GOATCOUNTER_CODE = "";

export const countUrl = (code: string) => `https://${code}.goatcounter.com/count`;

/** "#/clue/abc/knit" -> "/clue/abc/knit"; the hash is where this app's routes live. */
export const pathFromHash = (hash: string): string => hash.replace(/^#/, "") || "/";

interface GoatCounter { count(vars: { path: string; title?: string }): void }
declare global {
  interface Window { goatcounter?: GoatCounter }
}

let ready = false;
let pending: string | null = null;

const enabled = () =>
  !!GOATCOUNTER_CODE &&
  import.meta.env.PROD &&
  !["localhost", "127.0.0.1", "[::1]"].includes(location.hostname) &&
  navigator.doNotTrack !== "1";

/** Loads the counter script once. Page views are sent by trackPage, since routes are hash-based. */
export function initAnalytics(): void {
  if (!enabled() || document.querySelector("script[data-goatcounter]")) return;
  const s = document.createElement("script");
  s.async = true;
  s.src = "https://gc.zgo.at/count.js";
  s.dataset.goatcounter = countUrl(GOATCOUNTER_CODE);
  s.dataset.goatcounterSettings = JSON.stringify({ no_onload: true });
  s.onload = () => {
    ready = true;
    if (pending) window.goatcounter?.count({ path: pending });
    pending = null;
  };
  document.head.appendChild(s);
}

export function trackPage(path: string): void {
  if (!enabled()) return;
  if (ready) window.goatcounter?.count({ path });
  else pending = path;
}
