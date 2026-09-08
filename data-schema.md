# PickEmBros Data Schema

All picks data lives in `data/{year}/week-{number}.yml` (e.g. `data/2025/week-1.yml`).
The site is statically built: the Vite build reads every YAML file and injects it into the
bundle at build time. Add/edit these files and push — GitHub Actions rebuilds and redeploys.

For local development you can create a `mock_data/` tree with the same shape (the data
directory is selected by the `VITE_DATA_DIR` env var, see `vite.config.js`).

## Week file (`data/2025/week-1.yml`)

```yaml
# Metadata
year: 2025            # season year
week: 1               # week number
season: "2025 Season" # (optional) label shown on the win-rate banner
title: "Week 1"       # (optional) display title
intro: "Short blurb about this week."  # (optional)

# Games
games:
  - home: { name: "Kansas City Chiefs", abbr: KC,  logo: kc.png }
    away: { name: "Baltimore Ravens",   abbr: BAL, logo: bal.png }
    pick: KC            # abbreviation of the team we picked to win
    picker: "Dwash"     # (optional) which brother made the call
    confidence: 4       # (optional) 1–5 confidence
    rationale: "Why we think this team wins."
    # Result is one of: correct | wrong | pending
    result: pending
    # Only used when the pick was wrong (or any lesson worth noting):
    lesson: "What we learned / how we got it wrong."
    # (optional) final score
    score: { home: 24, away: 27 }
```

## Fields

| Field        | Type              | Required | Notes |
|--------------|-------------------|----------|-------|
| `year`       | number            | yes      | Season year; names the data folder. |
| `week`       | number            | yes      | Week number; `week-{N}.yml` should match. |
| `season`     | string            | no       | Label for the banner (defaults to `"<year> Season"`). |
| `title`      | string            | no       | Human-friendly title for the week. |
| `intro`      | string            | no       | Short description shown under the section heading. |
| `games`      | array of game     | yes      | List of games for the week. |
| `home.name`  | string            | yes      | Full team name. |
| `home.abbr`  | string (uppercase)| yes      | Team abbreviation (must be in `src/lib/data.js` `TEAMS`). |
| `home.logo`  | string            | no       | Filename in `public/assets/teams/`. Defaults to `<abbr>.png`. |
| `away.*`     | —                 | yes      | Same shape as `home`. |
| `pick`       | string (abbr)     | yes      | The team abbreviation we picked to win. |
| `picker`     | string            | no       | Who made the pick. |
| `confidence` | number (1–5)      | no       | Confidence level. |
| `rationale`  | string            | no       | Why we made the pick. |
| `result`     | `correct`/`wrong`/`pending` | yes | Outcome of the pick. |
| `lesson`     | string            | no       | What we learned (especially for wrong picks). |
| `score`      | `{home, away}`    | no       | Final score. |

## Team abbreviations

`ARI ATL BAL BUF CAR CHI CIN CLE DAL DEN DET GB HOU IND JAX KC LAC LAR LV MIA MIN NE NO NYG NYJ PHI PIT SF SEA TB TEN WAS`

## Example: wrong pick with a lesson

```yaml
games:
  - home: { name: "Dallas Cowboys", abbr: DAL, logo: dal.png }
    away: { name: "Philadelphia Eagles", abbr: PHI, logo: phi.png }
    pick: DAL
    picker: "Dwash"
    confidence: 5
    rationale: "The Cowboys' defense should stuff the run and force turnovers."
    result: wrong
    lesson: "We learned not to trust the Cowboys in primetime — the Eagles' O-line wore them down."
    score: { home: 20, away: 34 }
```
