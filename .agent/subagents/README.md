# Subagents

A subagent is a single, scoped agent that owns a stretch of the workflow end-to-end
(decide inputs, run tools, resolve problems, emit output). Each spec below uses YAML
front-matter (`name`, `description`) followed by the agent's goal, inputs, steps, tool
policy, and output contract.

| Subagent | Scope |
|------------------------|-----------------------------------------------------------------------------|
| `results-searcher` | Find the final score and winner of every NFL game for a given year/week and return a normalized YAML snippet ready to merge. |
| `transcript-parser` | Turn a PickEmBros podcast transcript into structured pick entries (team, picker, confidence, rationale, lesson). |

Both produce output that gets handed to the **`week-file-updater`** skill, which writes
the merged result into `data/{year}/week-{N}.yml`.

Shared conventions these subagents rely on:

- **Team abbreviations** are fixed (see `.agent/README.md`). Always normalize to this set.
- **Preserve manual data.** If a transcript is ambiguous or a source disagrees with what
  is already in the week file, flag it rather than silently overwrite.
- **Idempotency.** Re-running the same subagent against the same week must not create
  duplicate games or duplicate lessons.
