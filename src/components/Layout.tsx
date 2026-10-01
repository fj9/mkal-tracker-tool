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
      <main className="main">
        {children}
        <footer className="site-footer">
          <div>Made by Freya'd Knot</div>
          <div className="row" style={{ justifyContent: "center", gap: 16 }}>
            <a href="https://www.ravelry.com/people/freyadknot" target="_blank" rel="noopener noreferrer">Ravelry</a>
            <a href="https://www.instagram.com/freyaj9/" target="_blank" rel="noopener noreferrer">Instagram</a>
            <a href="https://github.com/fj9" target="_blank" rel="noopener noreferrer">GitHub</a>
          </div>
        </footer>
      </main>
      {clueId && (
        <nav className="tabbar" aria-label="Clue sections">
          {(["plan", "knit", "sections"] as const).map((n) => (
            <a key={n} href={hrefFor[n](clueId)} aria-current={route.name === n ? "page" : undefined}>
              {n === "sections" ? "Overview" : n[0].toUpperCase() + n.slice(1)}
            </a>
          ))}
        </nav>
      )}
    </div>
  );
}
