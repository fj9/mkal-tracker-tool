# Knitting Clue Tracker

Client-only Vite + React + TypeScript web app (installable PWA). Tick rows as you knit and see where you should be each day. Progress is stored on the device in IndexedDB.

## Commands

- `npm run dev` – dev server (validates clues and regenerates the catalogue first)
- `npm test` – Vitest (build checks, plan maths, progress store, helpers)
- `npm run build` – private build (uses `clue.json` when present, else `clue.public.json`)
- `npm run build:public` – `PUBLIC_BUILD=1`: public files only, then scans `dist/` and fails if any instruction text is found

## Adding a clue

Put the clue's `*_clue.public.json` in `content/clues/` and rebuild. Files sharing a `base_clue_id` become versions of one clue. The build fails with a clear message if any spec check fails or two files share a `clue_id`. Private `*_clue.json` files are git-ignored.

## Layout

`src/data` types and loader · `src/lib` pure maths (`plan.ts`) · `src/state` progress store · `src/screens` Catalogue, Plan, Knit, Sections, Settings, Help · `content/help` help copy as markdown · `scripts` build-time validation and catalogue generation.
