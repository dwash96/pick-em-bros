---
name: transcript-parser
description: >-
  Parses a PickEmBros podcast transcript to extract our picks (which team we picked,
  which brother, confidence), the rationale quote, and any "we got it wrong / what we
  learned" statement, producing structured YAML pick entries for the week-file-updater.
---

# Goal

Turn a raw episode transcript into a structured list of **pick entries** — one per game
the brothers discussed — matching the project schema enough that `week-file-updater` can
merge them into `data/{year}/week-{N}.yml`.

# Inputs

- `transcript` — path to the transcript file (`.txt` or `.md`/`.srt`/`.vtt`).
- `year` / `week` — the season week this episode covers (infer from file name or data
  folder if not given).
- The two pickers are **`Dwash`** and **`The Bro`**. Attribute each pick to the speaker
  who makes it.

# Steps

1. **Read the transcript** and locate the section covering the games for the week.
2. **Split it into per-game segments.** Each segment discusses one matchup. Segments are
   usually introduced by the two team names (e.g. "Chiefs and Ravens", "the Eagles and
   the Cowboys"), or by the brothers moving to "next game".
3. **For each segment, extract:**
   - **Home & away teams** → map to project abbreviations (see the fixed set below).
   - **The pick** (which team we're taking). Cue phrases:
     `"we're taking"`, `"we're going with"`, `"our pick is"`, `"give me"`, `"lock"`,
     `"I like"`, `"let's take"`, `"we'll ride with"`.
   - **The picker** — `"Dwash says"`, `"The Bro says"`, or infer from who is speaking.
   - **Rationale** — the sentence(s) immediately after the pick giving the reason
     (verbatim quote, keep it concise).
   - **Confidence** — map language to a 1–5 number (see Confidence map).
   - **Result/lesson** — scan for
     `"we got it wrong"`, `"we missed"`, `"that one stung"`, `"we blew that pick"`,
     `"muffed it"` and `"what we learned"`, `"lesson learned"`, `"never again"`.
     Capture the lesson text, and set `result: wrong` for that game later
     (`week-file-updater` reconciles against the actual score).
4. **Normalize team names.** Use the fixed abbreviations:
   `ARI ATL BAL BUF CAR CHI CIN CLE DAL DEN DET GB HOU IND JAX KC LAC LAR LV MIA MIN
   NE NO NYG NYJ PHI PIT SF SEA TB TEN WAS`. Resolve nicknames/synonyms (e.g.
   "Chiefs" → `KC`, "Ravens" → `BAL`, "Pats" → `NE`, "Philly" → `PHI`, "Niners" → `SF`,
   "Hawks" → `SEA`).
5. **Emit the pick entries** (see Output). Do **not** write the YAML file yourself —
   hand the snippet to `week-file-updater`.

# Confidence map

| Language heard | Confidence |
|----------------|-----------:|
| "lock of the week", "no doubt", "bank it", "best team" | 5 |
| "high confidence", "I'm pretty sure", "should win comfortably" | 4 |
| "they should win", "I think they take it" | 3 |
| "not sure", "could go either way", "it's a toss-up" | 2 |
| "coin flip", "honestly no idea", "gut call" | 1 |

When unsure, keep the pick (best guess) but **flag it** so `week-file-updater` treats it
as low confidence:

```yaml
uncertain: true
```

# Handling unsure / toss-up / no pick

- **Toss-up but we still name a team:** keep the pick, set confidence 1–2, mark
  `uncertain: true`, and capture the hedging quote as the rationale.
- **Genuinely no pick** ("we're skipping this one", "no opinion"): omit the game entry
  and record it in an `unresolved` list at the bottom of your output so the week file
  keeps the game but you don't invent a pick.
- **Never fabricate.** If the transcript doesn't support a pick/confidence/lesson, leave
  that field out rather than guess.

# Output format

A YAML snippet with a `games` array. Each entry uses fields that map directly onto the
week-file schema. Include `home`/`away` as `{name, abbr, logo}` (logo defaults to
`<abbr>.png`).

```yaml
games:
  - home: { name: "Kansas City Chiefs", abbr: KC, logo: kc.png }
    away: { name: "Baltimore Ravens",   abbr: BAL, logo: bal.png }
    pick: KC
    picker: "Dwash"
    confidence: 4
    rationale: "Reigning champs at home in the opener; Mahomes with a full toolbox."
    result: pending
  # ... one entry per game
unresolved: []   # games we could not confidently parse a pick for
```

## Worked Example

**Transcript snippet:**

> **Dwash:** "Alright, next up — the Chiefs host the Ravens. We're going with Kansas City.
> They're the reigning champs at home in the opener, Mahomes has a full toolbox. That's
> a confident four."
>
> **The Bro:** "Yeah, I'll lock that at a four too. Now the Eagles go to Dallas. We're
> taking Philly — their trenches win this one, and we keep falling for the Cowboys in
> primetime. That's a three."
>
> **Dwash:** "And the Lions at Green Bay. Honestly that's a coin flip. I'll take Detroit
> though, their speed on offense should edge it. Confidence two, and honestly it could go
> either way."

**Parsed output:**

```yaml
year: 2025
week: 1
games:
  - home: { name: "Kansas City Chiefs", abbr: KC, logo: kc.png }
    away: { name: "Baltimore Ravens",   abbr: BAL, logo: bal.png }
    pick: KC
    picker: "Dwash"
    confidence: 4
    rationale: "Reigning champs at home in the opener; Mahomes has a full toolbox."
    result: pending
  - home: { name: "Dallas Cowboys", abbr: DAL, logo: dal.png }
    away: { name: "Philadelphia Eagles", abbr: PHI, logo: phi.png }
    pick: PHI
    picker: "Dwash"
    confidence: 3
    rationale: "Their trenches win this one; we keep falling for the Cowboys in primetime."
    result: pending
  - home: { name: "Green Bay Packers", abbr: GB, logo: gb.png }
    away: { name: "Detroit Lions", abbr: DET, logo: det.png }
    pick: DET
    picker: "Dwash"
    confidence: 2
    rationale: "Coin flip; their speed on offense should edge it, but it could go either way."
    uncertain: true
    result: pending
unresolved: []
```

This snippet is handed straight to `week-file-updater`.
