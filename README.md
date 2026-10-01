# Freya'd Knot's Knitting Tracker

A free, just-for-fun progress tracker for mystery knit-alongs (MKALs). Pick a clue, tick off rows as you knit, and see where you should be each day. It works in the browser, installs to a phone's home screen, and keeps everything on your own device.

Made by [Freya'd Knot](https://www.ravelry.com/people/freyadknot) ([Instagram](https://www.instagram.com/freyaj9/), [GitHub](https://github.com/fj9)). I'm not trying to sell anything; knitting isn't a race.

## What it does

- **Catalogue**: choose an MKAL, then a clue, then a version (size or stitch option) where there is one.
- **Plan**: set a start date and number of days; it shares the stitches evenly and shows the row to be at the end of each day, plus how far ahead or behind you are today.
- **Knit**: the next row at a glance (colour, side, start/work/end stitches, increases and decreases, place in the repeat), a big Done button, Undo, and a Check in button to say "I have knitted up to here".
- **Overview**: every section as a spreadsheet-style grid with done rows tinted, colours filled in, and the row you are up to highlighted. Ticking a row ticks everything before it.
- **Settings**: your own colour names and swatches for each MKAL, light or dark mode, the counting rules behind the numbers, back up and restore, reset.
- **Help** and **About**.

Progress and stitches use *stitches worked*, not row counts, because rows differ hugely in effort (a bind-off or I-cord row can be several times a normal row). The app never works out stitch counts itself; it reads them from the clue data and adds up what you have ticked.

## Privacy

There is no backend, account or tracking. Progress is saved in your browser (IndexedDB). Use Back up in Settings to save a file you can restore on another device.

## The clue data

Each clue is a JSON file of rows and stitch counts (see `src/data/schema.ts`). The files in `content/clues/` are the **public** versions: every row's instruction text is blank, so the app shows row labels, colours and counts only and you follow your own copy of the pattern. The patterns belong to their designers and are not included here. This project is not affiliated with or endorsed by any designer.

Currently shipped: Mystery MusiKAL 2025 (WestKnits). Older MKALs used as test data live in `fixtures/clues/` and are not shown in the app.

### Adding a clue

1. Put its `*_clue.public.json` in `content/clues/`. Files that share a `base_clue_id` become the versions of one clue.
2. Run `npm run dev` or `npm run build`. The build validates every clue and fails with a clear message if a check fails: contiguous rows with unique ids, totals that add up, stitch counts that follow on from row to row, and printed counts that match.
3. Private files named `*_clue.json` are git-ignored and, if present locally, are used by a private build.

## Development

Vite, React, TypeScript, Vitest, IndexedDB (`idb`) and a PWA service worker (`vite-plugin-pwa`).

```bash
npm install
npm run dev          # dev server; validates clues and regenerates the catalogue first
npm test             # build checks, plan maths, progress store, helpers
npm run build        # private build (uses clue.json when present, else clue.public.json)
npm run build:public # public build, then fails if any instruction text is in dist/
```

```text
src/data/      types and the clue loader
src/lib/       pure functions: plan.ts (targets, where to be, ahead/behind), rows, colours, theme
src/state/     progress store (IndexedDB behind a small interface), app context
src/screens/   Catalogue, Plan, Knit, Overview (Sections.tsx), Settings, Help, About
content/       shipped clue data and the help/about copy as markdown
fixtures/      test-only clue data
scripts/       build-time validation and catalogue generation
```

## Hosting on GitHub Pages

`.github/workflows/deploy.yml` runs the tests, builds with `PUBLIC_BUILD=1` and deploys `dist/` on every push to `main`. In the repository settings, set Pages > Source to "GitHub Actions". The app uses relative paths and hash routes, so it works under `https://<user>.github.io/<repo>/`.

## Credits

The first version of my trackers was adapted from Anne Reimer's (plaidnuthatch) Starflake MKAL tracker. Thank you.

## Licence

No licence has been chosen yet, so all rights are reserved by default. Feel free to read the code and get in touch.
