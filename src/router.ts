import { useEffect, useState } from "react";

export type Route =
  | { name: "catalogue" }
  | { name: "plan" | "knit" | "sections"; clueId: string }
  | { name: "settings" }
  | { name: "help" };

export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, "").split("/").filter(Boolean).map(decodeURIComponent);
  if (parts[0] === "clue" && parts[1]) {
    const view = parts[2];
    if (view === "knit" || view === "sections") return { name: view, clueId: parts[1] };
    return { name: "plan", clueId: parts[1] };
  }
  if (parts[0] === "settings") return { name: "settings" };
  if (parts[0] === "help") return { name: "help" };
  return { name: "catalogue" };
}

export const hrefFor = {
  catalogue: () => "#/",
  plan: (id: string) => `#/clue/${encodeURIComponent(id)}/plan`,
  knit: (id: string) => `#/clue/${encodeURIComponent(id)}/knit`,
  sections: (id: string) => `#/clue/${encodeURIComponent(id)}/sections`,
  settings: () => "#/settings",
  help: () => "#/help",
};

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseHash(location.hash));
  useEffect(() => {
    const onChange = () => setRoute(parseHash(location.hash));
    addEventListener("hashchange", onChange);
    return () => removeEventListener("hashchange", onChange);
  }, []);
  return route;
}
