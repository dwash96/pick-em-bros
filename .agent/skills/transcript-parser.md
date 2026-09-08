---
name: transcript-parser
description: >-
  Turns a podcast transcript into structured pick entries (the picks + the reasoning +
  confidence), so the output can be handed to week-file-updater. Handles unsure/toss-up
  calls and captures confidence.
---

# Goal

Extract a structured **pick entry** for every game the brothers discuss, so the output
feeds directly into `week-file-updater`.

# Inputs

- `transcript` — text (`.txt`), or subtitle text (`.srt`/`.vtt`/`.md`).
- Optionally the known `year` / `week`.

Pick record fields to produce per game:
`home`, `away`, `pick`, `picker`, `confidence`, `rationale`, `result`, and (on wrong picks)
`lesson`. Note the two brothers are **`Dwash`** and **`The Bro`**.

# Steps

1. **Read the transcript.** Split into a list of segments, one per matchup (segments are
   delimited by mentions of a new pair of teams, e.g. "next up", "Chiefs and Ravens").
2. **For each segment, extract the pick:**
   Cue phrases: `"we're taking"`, `"we're going with"`, `"our pick is"`, `"give me"`,
   `"let's take"`, `"I like"`, `"lock"`, `"we'll ride with"`. The team named right after
   the cue is our pick.
3. **Extract the picker.** Look for speaker attribution (`"Dwash says"`, `"The Bro says"`),
   or use the speaker label if the transcript is timestamped by speaker. Default to the
   brother speaking the cue.
4. **Capture the rationale.** Keep the 1–2 sentences right after the pick that explain it.
   Quote verbatim where possible; trim filler.
5. **Assign confidence.** Map the language to 1–5 using the Confidence map below. If no
   confidence language is present, default to `3` (or omit the field).
6. **Detect wrong/lesson.** Search the whole segment for
   `"we got it wrong"`, `"we missed"`, `"that one stung"`, `"we blew that pick"`,
   `"muffed it"` and `"what we learned"`, `"lesson learned"`, `"never again"`. If a
   "wrong"/"learned" phrase appears, capture the sentence as `lesson` and set
   `result: wrong`.
7. **Normalize team names** to the fixed abbreviations. This is where you resolve synonyms
   (Chiefs→`KC`, Ravens→`BAL`, Pats→`NE`, Philly→`PHI`, Niners→`SF`, Hawks→`SEA`,
   Commanders→`WAS`).
8. **Emit the entries.** Do not write the YAML file; hand the snippet to
   `week-file-updater`.

# Confidence map

| Language heard | Confidence |
|----------------|-----------:|
| "lock of the week", "no doubt", "bank it", "best team" | 5 |
| "high confidence", "pretty sure", "should win comfortably" | 4 |
| "they should win", "I think they take it" | 3 |
| "not sure", "could go either way", "toss-up" | 2 |
| "coin flip", "honestly no idea", "gut call" | 1 |

# Handling unsure / toss-up

- If the brothers lean one way but hedge ("coin flip", "could go either way"), **keep the
  pick**, lower the confidence to 1–2, and add a flag so the updater knows this is a shaky
  take:
  ```yaml
  uncertain: true
  ```
- If they genuinely have no opinion, **omit the entry** and add the matchup to an
  `unresolved` list. Do not invent a pick.

# Output format

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

## Worked Example

**Transcript snippet:**

> **The Bro:** "Eagles are on the road at Dallas. We're taking Philly — their trenches win
> this one, and we keep falling for the Cowboys in primetime. That's a confident three."
>
> **Dwash:** "And the Lions over in Green Bay. That's a coin flip for me. I'll take
> Detroit, their speed on offense should edge it, but honestly it could go either way."
>
> **The Bro:** "Yeah, and the Chiefs host the Ravens — lock of the week, four, Mahomes
> with the full toolbox."

**Parsed output:**

```yaml
year: 2025
week: 1
games:
  - home: { name: "Dallas Cowboys", abbr: DAL, logo: dal.png }
    away: { name: "Philadelphia Eagles", abbr: PHI, logo: phi.png }
    pick: PHI
    picker: "The Bro"
    confidence: 3
    rationale: "Their trenches win this one; we keep falling for the Cowboys in primetime."
    result: pending
  - home: { name: "Green Bay Packers", abbr: GB, logo: gb.png }
    away: { name: "Detroit Lions", abbr: DET, logo: det.png }
    pick: DET
    picker: "Dwash"
    confidence: 1
    rationale: "Coin flip; their speed on offense should edge it, but it could go either way."
    uncertain: true
    result: pending
  - home: { name: "Kansas City Chiefs", abbr: KC, logo: kc.png }
    away: { name: "Baltimore Ravens",   abbr: BAL, logo: bal.png }
    pick: KC
    picker: "The Bro"
    confidence: 4
    rationale: "Lock of the week; Mahomes with the full toolbox."
    result: pending
unresolved: []
```

Hand this to `week-file-updater`. Note: "lock of the week" mapped to confidence 5 in the
map, but The Bro said "four" explicitly — the explicit number wins over the inference.
