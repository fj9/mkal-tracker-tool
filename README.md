# Freya'd Knot's Knitting Tracker

Client-only Vite + React + TypeScript web app (installable PWA). Tick rows as you knit and see where you should be each day. Progress is stored on the device in IndexedDB.

## Commands

- `npm run dev` – dev server (validates clues and regenerates the catalogue first)
- `npm test` – Vitest (build checks, plan maths, progress store, helpers)
- `npm run build` – private build (uses `clue.json` when present, else `clue.public.json`)
- `npm run build:public` – `PUBLIC_BUILD=1`: public files only, then scans `dist/` and fails if any instruction text is found

## Adding a clue

Put the clue's `*_clue.public.json` in `content/clues/` (only shipped clues live there; older MKALs used as test data are in `fixtures/clues/`) and rebuild. Files sharing a `base_clue_id` become versions of one clue. The build fails with a clear message if any spec check fails or two files share a `clue_id`. Private `*_clue.json` files are git-ignored.

## Layout

`src/data` types and loader · `src/lib` pure maths (`plan.ts`) · `src/state` progress store · `src/screens` Catalogue, Plan, Knit, Sections, Settings, Help · `content/help` help copy as markdown · `scripts` build-time validation and catalogue generation.

## Hosting on GitHub Pages

`.github/workflows/deploy.yml` runs the tests, builds with `PUBLIC_BUILD=1` (which also fails if any instruction text is in `dist/`) and deploys `dist/` on every push to `main`. In the repository settings, set Pages > Source to "GitHub Actions". The app uses relative asset paths and hash routes, so it works under `https://<user>.github.io/<repo>/` without extra config. Note that the public clue data in `content/clues/` is committed to the repository.

Local check of what Pages will serve: `npm run build:public && npx vite preview --host`.
