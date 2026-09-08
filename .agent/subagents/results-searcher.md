---
name: results-searcher
description: >-
  Searches the internet for the NFL game results (final scores and winning team) for a
  given year/week and returns a normalized YAML snippet that the `week-file-updater`
  skill can merge into data/{year}/week-{N}.yml.
---

# Goal

Given a season **year** and a **week number**, find the **final score and winner** of
every NFL game played that week and emit (a) normalized results and (b) a merge-ready
YAML snippet that matches the project schema.

# Inputs

- `year` — the season year (the folder name under `data/`).
- `week` — the week number (`week-{N}.yml`).
- If not provided, **infer** them:
  - List `data/` for `NNNN` directories → pick the year.
  - Inside that year, list `week-{N}.yml` files and pick the **largest `N` that still has
    `result: pending` games** (that is the week we are filling in).

# Steps

1. **Determine the target week/year** (see Inputs). If you have an explicit year/week,
   use it. Otherwise infer from the data folder.
2. **Find the date range** for that NFL week. NFL weeks span Thu–Mon (often Thu night,
   the bulk on Sun, and Mon night). You must fetch all days in the week, not just Sunday.
3. **Fetch the scores with `curl` first** (see Tooling). Recommended plain-HTTP sources:
   - ESPN scoreboard (no key): 
     `curl -s "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=YYYYMMDD"`
     — repeat for each day in the week and merge the `events[]`.
   - Pro-Football-Reference (plain HTML): `pro-football-reference.com/years/{year}/week_{week}.htm`.
   - SportsDataIO (free tier, needs a key):
     `curl -s -H "Ocp-Apim-Subscription-Key: KEY" "https://api.sportsdata.io/v3/nfl/scores/json/ScoresByWeek/{week}/{year}"`.
4. **Extract each game** from the source. For every event/game capture:
   - home team + home score
   - away team + away score
   - the winner (higher score; ties in regular season are extremely rare but handle them).
5. **Map team names → project abbreviations.** Normalize every team to the fixed set:
   `ARI ATL BAL BUF CAR CHI CIN CLE DAL DEN DET GB HOU IND JAX KC LAC LAR LV MIA MIN
   NE NO NYG NYJ PHI PIT SF SEA TB TEN WAS`.
   Most sources already return an abbreviation. Watch for common variants and synonyms
   (e.g. "Los Angeles Rams" → `LAR`, "Washington Football Team"/"Commanders" → `WAS`,
   "SF" / "San Francisco 49ers" → `SF`). Use `src/lib/data.js` as the source of truth.
6. **Verify completeness.** A normal week has **16 games** (32 teams). Bye weeks have
   fewer: `games = (32 - byes) / 2`. If you don't have that many unique team pairings,
   you are missing a game — fetch the missed day/source before proceeding.
7. **Emit output** (see Output). Do not write the YAML file yourself — hand the snippet
   to `week-file-updater`.

# Tooling

- **Plain HTTP / `curl` first** for ESPN, PFR, and any key-based stats API.
- Use the **`browser-harness`** skill **only** when the source is JS-rendered or blocks
  curl (e.g. the NFL.com schedule / some stats pages).
- If scores are confusing or a source disagrees, cross-check a second source. **Never
  invent a score.** When a game can't be confirmed, emit it with `result: pending`.

# Output format

Two blocks:

**A. Normalized results** (machine-to-machine; this is what gets validated):

```yaml
source: "ESPN scoreboard"
url: "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=20250907"
year: 2025
week: 1
games:
  - home_abbr: KC
    away_abbr: BAL
    home_score: 27
    away_score: 24
    winner_abbr: KC
  # ... one entry per game in the week
```

**B. Merge-ready YAML** for `week-file-updater` — a list of game patches keyed by the
`home.abbr` + `away.abbr` pair:

```yaml
games:
  - match: { home: KC, away: BAL }
    score: { home: 27, away: 24 }
    winner_abbr: KC
```

## Worked Example

**Input:** `year: 2025`, `week: 1` (inferred because `data/2025/week-1.yml` still has
`result: pending` games).

**Fetch** (week 1 of 2025, dates `20250904`–`20250908`):

```bash
for d in 20250904 20250905 20250906 20250907 20250908; do
  curl -s "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=$d"
done
```

**Normalized results:**

```yaml
source: "ESPN scoreboard"
url: "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=20250907"
year: 2025
week: 1
games:
  - home_abbr: KC,   away_abbr: BAL, home_score: 27, away_score: 24, winner_abbr: KC
  - home_abbr: BUF,  away_abbr: NYJ, home_score: 31, away_score: 17, winner_abbr: BUF
  - home_abbr: DAL,  away_abbr: PHI, home_score: 20, away_score: 34, winner_abbr: PHI
  - home_abbr: SF,   away_abbr: SEA, home_score: 28, away_score: 13, winner_abbr: SF
  - home_abbr: GB,   away_abbr: DET, home_score: 27, away_score: 30, winner_abbr: DET
  - home_abbr: MIA,  away_abbr: NE,  home_score: 24, away_score: 17, winner_abbr: MIA
  - home_abbr: ARI,  away_abbr: WAS, home_score: 14, away_score: 20, winner_abbr: WAS
  - home_abbr: ATL,  away_abbr: CAR, home_score: 26, away_score: 23, winner_abbr: ATL
  - home_abbr: CHI,  away_abbr: CIN, home_score: 21, away_score: 19, winner_abbr: CHI
  - home_abbr: CLE,  away_abbr: HOU, home_score: 24, away_score: 21, winner_abbr: CLE
  - home_abbr: DEN,  away_abbr: JAX, home_score: 20, away_score: 23, winner_abbr: JAX
  - home_abbr: IND,  away_abbr: LAC, home_score: 24, away_score: 27, winner_abbr: LAC
  - home_abbr: LV,   away_abbr: LAR, home_score: 17, away_score: 30, winner_abbr: LAR
  - home_abbr: MIN,  away_abbr: NYG, home_score: 25, away_score: 22, winner_abbr: MIN
  - home_abbr: NO,   away_abbr: TB,  home_score: 24, away_score: 29, winner_abbr: TB
  - home_abbr: PIT,  away_abbr: TEN, home_score: 20, away_score: 16, winner_abbr: PIT
```

**Completeness check:** 16 games, 32 unique team abbreviations → good for a non-bye week.

**Output handed to `week-file-updater`:**

```yaml
games:
  - match: { home: KC,  away: BAL }, score: { home: 27, away: 24 }, winner_abbr: KC
  - match: { home: BUF, away: NYJ }, score: { home: 31, away: 17 }, winner_abbr: BUF
  - match: { home: DAL, away: PHI }, score: { home: 20, away: 34 }, winner_abbr: PHI
  # ... one entry per game above
```
