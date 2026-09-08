# .agent — PickEmBros podcast automation

This folder documents and defines the agents and skills used to automate the weekly
PickEmBros data-entry workflow. Everything here is **documentation/config only** —
it never modifies the app source. The goal is that any future agent in this repo can,
each week:

1. **Fetch the results** of the games just played (`results-fetcher` skill /
   `results-searcher` subagent).
2. **Read the podcast transcript** and extract our picks, rationale, confidence, and
   lessons (`transcript-parser` skill / subagent).
3. **Merge** both into the right week file, `data/{year}/week-{N}.yml`
   (`week-file-updater` skill).

All decisions, tool choices, steps, and worked examples are captured here so the
workflow is repeatable and re-runnable (idempotent).

## Layout

| Path | What it is |
|----------------------------------|-----------------------------------------------------------------|
| `README.md` | This overview. |
| `subagents/` | Named, end-to-end agent specs (a job with a goal + steps + output). |
| `subagents/results-searcher.md` | Agent that finds NFL results for a given year/week. |
| `subagents/transcript-parser.md` | Agent that extracts our picks from an episode transcript. |
| `skills/` | Single, focused capability prompts (one job, re-usable). |
| `skills/results-fetcher.md` | Skill: fetch and normalize an NFL week's scores. |
| `skills/transcript-parser.md` | Skill: transcript → structured pick entries. |
| `skills/week-file-updater.md` | Skill: merge results/picks into the YAML week file. |

## Data model (what we write)

- Picks data lives in `data/{year}/week-{N}.yml`. The schema is documented in
  [`data-schema.md`](../data-schema.md).
- Team abbreviation/logo map is in [`src/lib/data.js`](../src/lib/data.js). The fixed
  abbreviations are:
  `ARI ATL BAL BUF CAR CHI CIN CLE DAL DEN DET GB HOU IND JAX KC LAC LAR LV MIA MIN
  NE NO NYG NYJ PHI PIT SF SEA TB TEN WAS`.
- Logo files are `public/assets/teams/{abbr-lower}.png` (e.g. `kc.png`).

## The weekly pipeline

```
[transcript .txt] ──► transcript-parser ──► picks (YAML snippet)
                                                      │
[NFL scores API] ──► results-fetcher ──► results (YAML snippet)
                                                      │
                                                      ▼
                                        week-file-updater
                                                      │
                                                      ▼
                                    data/{year}/week-{N}.yml
```

1. Run `results-fetcher` to get this week's official scores.
2. Run `transcript-parser` over the latest episode transcript.
3. Run `week-file-updater` to write both into the correct `week-{N}.yml`, preserving
   any manual edits already in the file.

## Tooling policy

- **Prefer plain HTTP** (`curl`) against the public ESPN / stats endpoints first; they
  are fast and reliable for scoreboards.
- Use the **`browser-harness`** skill **only** when a page is JS-rendered or
  bot-protected (e.g. the NFL.com schedule, or a page that blocks curl).
- Never invent scores. If a source can't be confirmed, leave `result: pending` and
  record what was unresolved.

## Editing rules

- These docs are self-contained: each skill has its own goal, steps, input/output
  format, and a `## Worked Example`.
- Subagent specs use YAML front-matter (`name`, `description`) followed by the agent's
  instructions.
- Do not add code files to the repo under `.agent/` — only these Markdown docs and the
  data they describe.
