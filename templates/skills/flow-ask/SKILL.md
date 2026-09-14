---
name: flow-ask
description: Deep research across all tracked streams in the OpenFlow workspace for a question that doesn't map to a single queue item. Use when the user asks a question that may span multiple tracked streams.
allowed-tools: Bash(openflow:*), Grep, Glob, Read
user-invocable: false
---

Answer a question by researching across every tracked stream in this OpenFlow workspace.
Streams live on disk under `streams/<id>/normalized/` (and `streams/<id>/raw/`) relative to the
workspace root, sorted oldest-first by filename — you can navigate this corpus directly instead of
piping everything through `openflow` commands. Pick whichever method is most token-efficient for
each step; don't default to loading full files when a targeted search will do.

**Steps**

1. **Read the ledger** with `openflow ledger get` to see every tracked stream's `id`, `description`,
   and `intents`.

2. **Narrow to plausibly relevant streams** by scanning `description` and `intents` first. Don't
   assume the answer lives in a single stream — a question that doesn't map to one existing queue
   item is exactly the case this command exists for.

3. **Investigate each candidate stream using whatever mix of tools is most efficient**, similar to
   how you'd explore an unfamiliar codebase rather than loading it wholesale:
   - Use `Grep` (optionally across `streams/**/normalized/*`) to search for keywords or entities
     across many streams at once before deciding which are actually worth reading in full.
   - Use `Glob`/`openflow streams list --id <id> --kind normalized` to see what snapshots exist for
     a stream (e.g. if the question is about change over time, not just current state).
   - Use `Read` on a specific snapshot (usually the latest, via
     `openflow streams latest --id <id> --kind normalized`) only once you have reason to believe it
     matters — full or partial (offset/limit) as fits the question.
   - If a broad search would return more than you need in context, redirect it into a temp file
     under your scratchpad directory and read back only the relevant portion.
   Escalate from cheap/narrow (grep) to expensive/broad (reading full files) only as the question
   demands it — a question about one fact in one stream shouldn't cost a full-corpus read.

4. **Synthesize an answer** that draws on everything relevant found across those streams, citing
   which stream(s) each part of the answer came from.

**Guardrails**
- This is read-only research: it must not mutate the ledger or queue on its own, and must not
  modify anything under `streams/`. If the research surfaces something actionable, tell the user
  and let them decide whether to route it through `/flow:work` or `/flow:add`.
