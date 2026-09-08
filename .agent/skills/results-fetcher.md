---
name: results-fetcher
description: >-
  Fetches official NFL scores for a given season year/week from a public source (curl
  first) and returns them as normalized JSON/YAML: source, url, year, week, and per-game
  {home_abbr, away_abbr, home_score, away_score, winner_abbr}. Verifies the week is
  complete.
---

# Goal

Get the **final score and winner of every game** in an NFL week and normalize it into a
machine-readable structure. This is the pure "fetch + normalize" capability that
`results-searcher` (the end-to-end agent) uses.

# Inputs

- `year` (season year) and `week` (week number).

# Sources (in priority order)

1. **ESPN scoreboard API** — no key, returns JSON. Perfect for curl.
   - Base: `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard`
   - Params: `dates=YYYYMMDD`. An NFL week spans **Thu–Mon**, so fetch each day and merge.
   - JSON shape to read: `events[]` → `competitions[0].competitors[]` (each has
     `team.abbreviation`, `team.displayName`, `score`), and `status.type.completed` tells
     you whether the final score is in.
2. **Pro-Football-Reference** — plain HTML, no key, curl-friendly:
   `https://www.pro-football-reference.com/years/{year}/week_{week}.htm`.
   Parse the score table rows (winner's score shown first/bold).
3. **SportsDataIO** — needs an API key (`Ocp-Apim-Subscription-Key` header), free tier:
   `https://api.sportsdata.io/v3/nfl/scores/json/ScoresByWeek/{week}/{year}`.
4. **NFL.com / stats pages** — often JS-rendered or bot-protected. If curl is blocked,
   **fall back to the `browser-harness` skill** to render and scrape.

# Steps

1. **Resolve the week's date range** for `year`/`week`, or for PFR just use
   `/years/{year}/week_{week}.htm`.
2. **Fetch** with `curl` against the first available source. Example:

```bash
# ESPN (one day at a time; repeat over Thu–Mon of the target week)
curl -s "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=20250907"
```

3. **Extract** each game: read `home`/`away` team, `home`/`away` final score, and compute
   the **winner** (higher score; ties in the regular season are rare — treat equal scores
   as no winner and flag it).
4. **Normalize team abbreviations** to the fixed set:
   `ARI ATL BAL BUF CAR CHI CIN CLE DAL DEN DET GB HOU IND JAX KC LAC LAR LV MIA MIN
   NE NO NYG NYJ PHI PIT SF SEA TB TEN WAS`. Most sources provide an abbreviation already;
   map any long/alternate names (e.g. "Los Angeles Rams"→`LAR`, "Commanders"→`WAS`,
   "49ers"→`SF`) to the fixed set. `src/lib/data.js` is the source of truth.
5. **Verify completeness.** A normal week = **16 games** (32 teams). Bye weeks reduce the
   count: `games = (32 - byes) / 2`. If you don't see that many unique team pairings, you
   dropped a game — fetch the missed day/source and re-merge before emitting.
6. **Emit normalized output.** Do not write to the week file — hand the result to
   `week-file-updater`.

# Output format

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
  # ... one entry per game
```

## Worked Example

**Input:** `year: 2025`, `week: 1`.

**Fetch:**

```bash
for d in 20250904 20250905 20250906 20250907 20250908; do
  curl -s "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=$d"
done
```

**Extract + normalize** (each `event` → one game; team `abbreviation` maps directly to a
project abbr):

```yaml
source: "ESPN scoreboard"
url: "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=20250907"
year: 2025
week: 1
games:
  - { home_abbr: KC,  away_abbr: BAL, home_score: 27, away_score: 24, winner_abbr: KC }
  - { home_abbr: BUF, away_abbr: NYJ, home_score: 31, away_score: 17, winner_abbr: BUF }
  - { home_abbr: DAL, away_abbr: PHI, home_score: 20, away_score: 34, winner_abbr: PHI }
  - { home_abbr: SF,  away_abbr: SEA, home_score: 28, away_score: 13, winner_abbr: SF }
  - { home_abbr: GB,  away_abbr: DET, home_score: 27, away_score: 30, winner_abbr: DET }
  - { home_abbr: MIA, away_abbr: NE,  home_score: 24, away_score: 17, winner_abbr: MIA }
  - { home_abbr: ARI, away_abbr: WAS, home_score: 14, away_score: 20, winner_abbr: WAS }
  - { home_abbr: ATL, away_abbr: CAR, home_score: 26, away_score: 23, winner_abbr: ATL }
  - { home_abbr: CHI, away_abbr: CIN, home_score: 21, away_score: 19, winner_abbr: CHI }
  - { home_abbr: CLE, away_abbr: HOU, home_score: 24, away_score: 21, winner_abbr: CLE }
  - { home_abbr: DEN, away_abbr: JAX, home_score: 20, away_score: 23, winner_abbr: JAX }
  - { home_abbr: IND, away_abbr: LAC, home_score: 24, away_score: 27, winner_abbr: LAC }
  - { home_abbr: LV,  away_abbr: LAR, home_score: 17, away_score: 30, winner_abbr: LAR }
  - { home_abbr: MIN, away_abbr: NYG, home_score: 25, away_score: 22, winner_abbr: MIN }
  - { home_abbr: NO,  away_abbr: TB,  home_score: 24, away_score: 29, winner_abbr: TB }
  - { home_abbr: PIT, away_abbr: TEN, home_score: 20, away_score: 16, winner_abbr: PIT }
```

**Completeness:** 16 games / 32 unique teams → this is a complete, non-bye week. Hand this
to `week-file-updater`.

# Fallback plan

- If ESPN is unreachable or returns incomplete data, try **PFR** (plain HTML), then
  **SportsDataIO** (if a key is available).
- If all curl sources are blocked, switch to the **`browser-harness`** skill.
- If a game still can't be confirmed, emit it with `winner_abbr: null` and let
  `week-file-updater` keep `result: pending`. Never invent a score.
