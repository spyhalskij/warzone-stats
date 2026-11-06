# Warzone Stats

A static, unofficial site for Jack Spyhalski's Warzone friends: current in-game leaderboards and his archived original-Warzone record. No Activision or Call of Duty branding, no official affiliation.

**Live:** https://spyhalskij.github.io/warzone-stats/

## Stack and setup

- Astro 4, fully static output, no runtime APIs or external asset calls.
- Mode/era selection and sorting run locally (`public/app.js`), saved in `localStorage`, and reflected in `?era=wz2&mode=br`. Both choices persist across eras; Plunder is intentionally retained only as archived data, not exposed as a mode switch.
- Four pre-rendered static pages plus a query-aware Pages fallback serve the same base app. Fonts are self-hosted IBM Plex families.
- The GitHub Pages deployment copies `spyhalskij/platinum-kaizo-guide`: Node 20, `npm ci`, then `actions/upload-pages-artifact` and `actions/deploy-pages`.

```sh
npm ci
npm run check
npm run build
```

`SITE_URL` and `BASE_PATH` in `.github/workflows/deploy.yml` set the correct project-page paths.

## Source data

All transcribed source values live in `src/data/wz1.json` and `src/data/wz2.json`. Each carries a source note and the Nov 5, 2026 capture date. WZ2 uses six in-game Friends Only screenshots and `ingame.md`; the 11-player rows merge career, eliminations, and placements. Missing tabs are shown as blanks, never zero. BR time-played values preserve the apparent screen truncation. WZ1 uses Tracker.gg's read-only archive and the saved screenshots; no missing data was guessed. Plunder is archived in JSON although the current UI uses only BR and Resurgence.

`scripts/build-data.mjs` checks the 11-player/two-mode/three-tab structure, E/D arithmetic, and season totals, then writes `src/data/callouts.json` from source maxima. Callouts are not edited by hand. The design brief was applied: one dark neutral palette, amber accents for Jack and the current controls, condensed display type, tabular monospace stats, sticky global controls, rank/name freeze, and compact numeric views. Styling is centralized in `src/styles/site.css`.

## Archive limitations

WZ1 Details panels and Seasons processed-match panels use different denominators. The site identifies them separately and does not force reconciliations. WZ1 lifetime Resurgence has no displayed playtime. Daily Performance/Daily Progression, Level, and weapon data were unavailable. Cached match records are last-update data from a Tracker page reporting Activision-server failures, not a fresh verified match feed. The small archived match image cannot be read at enough resolution to independently re-check all cached match-by-match numbers; its transcription comes only from the supplied `stats.md` and carries that qualification.

## Verification

Browser checks cover query-first loading, era/mode persistence, four views, column groups, reversible sorting, missing values, WZ1 detail/season expansions, frozen names while horizontally scrolling, and 320px/390px/1280px document widths. `shots/` holds the live-site images at 390 and 1280 widths, including the switch controls. `playwright/` is development-only and ignored by Git.
