# 🐴 PickEmBros

Public host for the **PickEmBros** podcast — where two brothers pick the winner of every NFL game each week, track results, and (occasionally) admit what we got wrong and what we learned.

This is a **statically built** site (Vite + Vue) that lives on GitHub Pages. All picks data is stored as YAML in the repo and compiled into the site at build time.

## How it works

- **Main page** = the current week's picks.
- **Win-rate banner** (top) = season correct / wrong / pending counts.
- **Past Picks** section = page through previous weeks (and seasons).
- Click any game to see our **rationale**; on games we got wrong, the popup shows the **lesson we learned**.

## Data

Pick data lives in `data/{year}/week-{N}.yml`. See [`data-schema.md`](data-schema.md) for the full schema.

```yaml
year: 2025
week: 1
season: "2025 Season"
title: "Week 1"
intro: "Season opener!"
games:
  - home: { name: "Kansas City Chiefs", abbr: KC, logo: kc.png }
    away: { name: "Baltimore Ravens", abbr: BAL, logo: bal.png }
    pick: KC
    picker: "Dwash"
    confidence: 4
    rationale: "Reigning champs at home in the opener."
    result: pending   # correct | wrong | pending
    lesson: "..."     # only when we got it wrong (or learned something)
    score: { home: 34, away: 28 }
```

Add or edit these files and push — GitHub Actions rebuilds and redeploys automatically.

## Local development

```bash
npm install
npm run dev            # dev server (reads ../data)
VITE_DATA_DIR=mock_data npm run dev   # use the sample mock_data instead
npm run build          # production build
npm run preview        # serve the build locally
```

- The data directory is chosen by `VITE_DATA_DIR` (default `data`). `mock_data/` holds sample fixtures for local testing.
- `public/assets/teams/` holds the 32 NFL team logos.

## Deployment

GitHub Pages is configured via GitHub Actions (`.github/workflows/deploy.yml`). On push to `main`, the site is built with Vite and published to Pages.

## Automating data entry (`.agent/`)

See [`.agent/README.md`](.agent/README.md) for skills and subagents that help fetch game results and parse podcast transcripts into the YAML schema.
