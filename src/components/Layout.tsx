import type { ReactNode } from "react";
import { hrefFor, type Route } from "../router";

interface Props {
  route: Route;
  title: string;
  back?: string;
  children: ReactNode;
}

/** Top bar with a "?" on every screen, plus the Plan / Knit / Sections tabs inside a clue. */
export function Layout({ route, title, back, children }: Props) {
  const clueId = "clueId" in route ? route.clueId : null;
  return (
    <div className="app">
      <header className="topbar">
        {back && (
          <a className="icon-btn" href={back} aria-label="Back" style={{ display: "grid", placeItems: "center", textDecoration: "none" }}>
            ‹
          </a>
        )}
        <h1>{title}</h1>
        {route.name !== "settings" && (
          <a className="icon-btn" href={hrefFor.settings()} aria-label="Settings" style={{ display: "grid", placeItems: "center", textDecoration: "none" }}>
            ⚙
          </a>
        )}
        {route.name !== "help" && (
          <a className="icon-btn" href={hrefFor.help()} aria-label="Help" style={{ display: "grid", placeItems: "center", textDecoration: "none" }}>
            ?
          </a>
        )}
      </header>
      <main className="main">{children}</main>
      {clueId && (
        <nav className="tabbar" aria-label="Clue sections">
          {(["plan", "knit", "sections"] as const).map((n) => (
            <a key={n} href={hrefFor[n](clueId)} aria-current={route.name === n ? "page" : undefined}>
              {n[0].toUpperCase() + n.slice(1)}
            </a>
          ))}
        </nav>
      )}
    </div>
  );
}
