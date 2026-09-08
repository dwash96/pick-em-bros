---
name: week-file-updater
description: >-
  Merges new game results (from results-fetcher) and parsed picks (from transcript-parser)
  into an existing data/{year}/week-{N}.yml file, preserving manual corrections and the
  data-schema. Idempotent: re-running never duplicates a game.
---

# Goal

Update a single week file `data/{year}/week-{N}.yml` with the latest **results** and/or
**picks**, while keeping any manual edits already present and staying void of the schema
in `data-schema.md`.

# Inputs

- `year` / `week` — target (the file `data/{year}/week-{N}.yml`).
- `results` (optional) — normalized results from `results-fetcher`: per-game
  `{ home_abbr, away_abbr, home_score, away_score, winner_abbr }`.
- `picks` (optional) — pick entries from `transcript-parser`: per-game
  `{ home, away, pick, picker?, confidence?, rationale?, uncertain? }`.

You may provide only results, only picks, or both.

# Steps

1. **Load and validate.** Read `data/{year}/week-{N}.yml` (or start fresh if it doesn't
   exist). Confirm required metadata (`year`, `week`, `games`) and that every game has the
   schema fields. If a field is missing, add the default (e.g. `result: pending`).
2. **Match games by a stable key.** The key is the
   `home.abbr` + `away.abbr` pairing. Build an index of existing games by that key. This
   is what makes the operation **idempotent** — a game is identified by its two teams, not
   by array position.
3. **Merge results.** For each incoming result:
   - Find the game with the same `home.abbr`/`away.abbr`.
   - If it exists, set `score` and compute `result` from the winner (see rule below).
   - If it does **not** exist, append a new game entry, still honoring the schema and the
     fixed team abbreviations.
4. **Merge picks.** For each incoming pick entry:
   - If a game with that `home.abbr`/`away.abbr` exists, fill in only the fields that are
     **missing** (`pick`, `picker`, `confidence`, `rationale`). **Do not overwrite** a
     manually-entered `pick`/`rationale` that is already present and correct.
   - If the pick entry has `uncertain: true` and we already have a confident pick, keep the
     existing pick.
   - If no game exists, append it.
5. **Set `result` from the final score.** Compare the picked team with the winner:
   - `winner_abbr == pick` → `result: correct`
   - `winner_abbr != pick` → `result: wrong`
   - No score / winner not decided → `result: pending`
6. **Add/keep `lesson` on wrong picks.** When `result` becomes `wrong`:
   - If the transcript supplied a `lesson`, use it.
   - If there's no lesson yet, leave it empty or add a placeholder like
     `"TBD — we got this one wrong."` and flag it for a human.
   - **Never overwrite** an existing lesson to make a pick look better.
7. **Preserve manual data.** Do not touch `intro`, `title`, `season`, `year`, or any game
   field that the current operation didn't supply. Only add/update what the inputs provide.
8. **Write the file back** with the same YAML shape and key ordering (metadata first, then
   `games:`). Keep it readable — don't collapse the `home`/`away` objects onto one line
   unless that was the original style.

# Idempotency rules

- The game key is `home.abbr`+`away.abbr`. **Never append a second entry for a key that
  already exists.** Re-running against an already-updated file must be a no-op for the
  games it already handled.
- Updating a game is a **field merge**, not a replace: only the fields supplied by the
  current call are modified; untouched fields keep their value.
- If you run `week-file-updater` twice with the same inputs, the file is byte-identical
  the second time.

## Worked Example

**Before** (`data/2025/week-1.yml` excerpt):

```yaml
year: 2025
week: 1
season: "2025 Season"
games:
  - home: { name: "Kansas City Chiefs", abbr: KC, logo: kc.png }
    away: { name: "Baltimore Ravens",   abbr: BAL, logo: bal.png }
    pick: KC
    picker: "Dwash"
    confidence: 4
    rationale: "Reigning champs at home in the opener. Mahomes with a full toolbox to start the year."
    result: pending
  - home: { name: "Dallas Cowboys", abbr: DAL, logo: dal.png }
    away: { name: "Philadelphia Eagles", abbr: PHI, logo: phi.png }
    pick: PHI
    picker: "Dwash"
    confidence: 3
    rationale: "Eagles' trenches win this one. We keep falling for the Cowboys in primetime."
    result: pending
```

**Inputs:**

```yaml
results:
  - { home_abbr: KC,  away_abbr: BAL, home_score: 27, away_score: 24, winner_abbr: KC }
  - { home_abbr: DAL, away_abbr: PHI, home_score: 20, away_score: 34, winner_abbr: PHI }
picks:
  # (optional) a lesson transcribed after the loss
  - { home_abbr: DAL, away_abbr: PHI, lesson: "We learned not to trust the Cowboys in primetime — the Eagles' O-line wore them down." }
```

**After**:

```yaml
year: 2025
week: 1
season: "2025 Season"
games:
  - home: { name: "Kansas City Chiefs", abbr: KC, logo: kc.png }
    away: { name: "Baltimore Ravens",   abbr: BAL, logo: bal.png }
    pick: KC
    picker: "Dwash"
    confidence: 4
    rationale: "Reigning champs at home in the opener. Mahomes with a full toolbox to start the year."
    result: correct
    score: { home: 27, away: 24 }
  - home: { name: "Dallas Cowboys", abbr: DAL, logo: dal.png }
    away: { name: "Philadelphia Eagles", abbr: PHI, logo: phi.png }
    pick: PHI
    picker: "Dwash"
    confidence: 3
    rationale: "Eagles' trenches win this one. We keep falling for the Cowboys in primetime."
    result: correct
    score: { home: 20, away: 34 }
```

**If the pick had lost** (say we picked `DAL` but `PHI` won, `result: wrong`), the same
merge would add the lesson and keep the score:

```yaml
  - home: { name: "Dallas Cowboys", abbr: DAL, logo: dal.png }
    away: { name: "Philadelphia Eagles", abbr: PHI, logo: phi.png }
    pick: DAL
    picker: "Dwash"
    confidence: 3
    rationale: "Eagles' trenches win this one. We keep falling for the Cowboys in primetime."
    result: wrong
    lesson: "We learned not to trust the Cowboys in primetime — the Eagles' O-line wore them down."
    score: { home: 20, away: 34 }
```

Re-running the same `results`/`picks` again changes nothing.
