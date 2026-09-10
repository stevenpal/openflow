## Context

See `proposal.md` - Why/What Changes for motivation and scope. This is a greenfield system: an npm
CLI package plus a set of `/flow:*` skills that a host agent harness (Claude Code, Codex, etc.)
loads inside a workspace folder. The design constraints driving the technical choices below come
straight from the working doc at `discovery/proposed_ux.md`, most centrally: diffs must be clean
(no false-positive drift from rendering variance), retrieval must be exactly reproducible run to
run, and a large workspace must not blow out a single agent's context window during sync.

## Goals / Non-Goals

**Goals:**
- Normalize an open-ended set of source applications into diffable text without a bespoke
  extractor per app.
- Make stream retrieval/transformation instructions precise enough that the same `descriptor` run
  twice (by different agents, on different days) produces the same call.
- Keep sync scalable to many tracked streams by fanning per-stream work out to subagents while
  centralizing the parts that need full-workspace context.
- Keep the ledger safe to hand-edit without silently corrupting agent behavior.

**Non-Goals:**
- Building a UI beyond the CLI/skill surface and the markdown ledger/queue files — no web app, no
  database server.
- Supporting arbitrary automation graphs; derived streams are intentionally constrained to one
  level deep (see `specs/derived-streams`).
- Solving multi-user/concurrent-editing of a single workspace — a workspace is scoped to one
  folder used by one agent session at a time.

## Decisions

### Two-tier normalization: canonical shape + shared renderer + thin adapter
Rather than one extractor per source app, normalization is keyed by content **shape** (~10 shapes
total, see `specs/stream-normalization`). Each shape has:
- a canonical intermediate TypeScript type (e.g. chat/messaging is
  `{author, text, ts, thread_id}[]`),
- one shared renderer per shape that turns the canonical object into the target format (Markdown
  transcript, CSV, etc.), written once and reused by every source of that shape,
- a thin per-source adapter that only maps that source's native field names onto the canonical
  shape (e.g. `adapters/slack.ts`, ~20 lines).

Alternative considered: a bespoke extractor per source app. Rejected — this is the "1000
extractors" trap; every new source would require rewriting rendering logic that's actually
identical across e.g. every chat app.

For sources with no adapter yet (the long tail), Tier 2 has the agent extract content verbatim, in
reading order, into the shape's fixed target template — explicitly forbidding summarizing or
rephrasing — then runs the result through the same deterministic clean-up script used for every
source of that shape (whitespace, bullet/heading normalization, stable sort of order-insensitive
lists). Both tiers land in the same normalized-snapshot format, so the diff step in `/flow:sync`
never needs to know which tier produced it.

Alternative considered: inlining agent-extracted content directly with no clean-up pass. Rejected —
minor agent wording/formatting variance run to run would show up as diff noise indistinguishable
from real content changes.

### Comments and track-changes rendered as separate sections, body stays accepted-state-only
Body diffs answer "what changed in the real content." Comments and pending suggested edits are a
different kind of signal ("who is discussing/proposing what") and are rendered as their own
trailing sections rather than inlined as markup in the body. See `specs/stream-normalization` for
the resulting requirements. Alternative considered: inlining suggestions as insert/delete markup in
the body — rejected because it mixes two different kinds of diff-worthy news into one diff, and
because comment anchor spans are a rendering decision that isn't stable enough run-to-run to trust
as body content.

### Descriptor is free-text but must be a literal, complete recipe
`descriptor` stays a single free-text field (not a structured per-tool schema) because it's
consumed only by the agent that replays it — a structured schema would need a shape per MCP tool,
recreating the same "1000 extractors" problem this design already avoids elsewhere. The correctness
risk (a later sync silently pulling data differently) is addressed by a *writing discipline*
enforced at `/flow:add` time, not by structure: `/flow:add` records the descriptor as a transcript
of the call it actually just executed, not a paraphrase of the user's ask. Relative date parameters
are resolved via two small composable script primitives — `get_date(anchor, offset?)` and
`get_period_start(unit, date?)` — rather than agent arithmetic, since date-math edge cases (quarter
boundaries, leap years) are easy to get subtly and inconsistently wrong. Inclusive/exclusive
endpoints and timezone must be stated explicitly in the descriptor's prose; timezone defaults to
UTC when unstated, never the executing device's local zone, since that would reintroduce
nondeterminism across where a sync happens to run.

Alternative considered: ISO 8601 durations (`P7D`) for relative dates. Rejected — doesn't resolve
what the duration is relative to or endpoint inclusivity, so it adds notation without adding
precision.

`origin` and `source_stream_ids` stay structured ledger fields rather than folding into
`descriptor` prose, because code (not just the agent) needs to query them deterministically: the
one-level-deep derived-stream constraint and the sync/removal dependency graph are structural
queries, not something to re-derive from prose on every run.

### Ledger mutation goes through validating scripts; reads go through a validating accessor
Two independent safety nets, because they guard against different failure sources:
- `add_stream`/`remove_stream`/`update_stream` scripts are the only path for *agent* writes, and
  enforce schema + referential integrity before writing.
- `get_streams`, a validating read accessor called at the start of every `/flow:*` skill, catches
  *human* hand-edits that bypass the write scripts entirely — it re-validates on every read and
  reports (never silently drops) anything invalid.

Alternative considered: validating only on write. Rejected — the ledger is explicitly designed to
be human-editable, so write-time validation alone would leave hand-edit corruption invisible until
something downstream broke confusingly.

Alternative considered (for read failures): silently filtering invalid entries. Rejected — a stream
going quiet with no visible signal undermines trust in the tool; the fix is always to report and
continue with the valid subset.

Ledger snapshotting before every mutation reuses the same versioning approach as stream snapshots,
and is also what backs recoverability for `intents` entries that get rewritten in place rather than
appended (see `specs/stream-ledger`) — history lives in snapshots, not in a growing live list.

### Sync fans out per-stream diffing to subagents; synthesis stays centralized
`/flow:sync`'s main agent dispatches one subagent per syncable source stream to pull + diff +
report a structured finding, then does synthesis itself: matching findings against ledger
`intents`, deciding queue-worthiness, writing intent-focused queue items, and rewriting `intents`
in place. This split exists because a per-stream subagent only has that one stream's context — it
can't reliably judge what an *intent-focused* queue item should say, since that requires the whole
ledger's picture of why things matter. Recomputing a derived stream (when its sources changed) is
currently kept in the main agent for the same reason; whether to delegate that specific step to its
own subagent is called out as an open question below.

Alternative considered: one flat sync pass over every stream in the main agent. Rejected —
doesn't scale; a workspace with many tracked streams would blow past useful context before
synthesis even starts.

### Pre-work sync in `/flow:work` is scoped, not a full sync
Before acting on a queue item, `/flow:work` re-syncs only the stream(s) that item touches, using
the same per-stream subagent dispatch as full sync's step 1, and does so without asking for
approval first (sync is non-destructive and versioned). Scope is deliberately narrow: a full sync
would surface unrelated changes across the whole workspace, pulling the user's attention away from
the item at hand.

## Risks / Trade-offs

- **Tier 2 (agent extraction) still varies slightly run to run** → mitigated by the shared
  deterministic clean-up pass, but not eliminated; a contributed Tier 1 adapter is the real fix for
  a given source, and Tier 2 is explicitly a "less pristine, never unsupported" fallback rather than
  a promise of Tier-1-quality diffs. Future direction (explicitly out of scope for this change): have
  the agent author a Tier 1 adapter on-demand the first time it encounters a new source — e.g. when
  adding a stream for a new chat app, the agent inspects the MCP tool/API response shape once and
  writes a thin deterministic adapter for it, rather than re-extracting verbatim on every sync. Every
  subsequent sync then replays that script instead of doing fresh agent extraction, which would
  eliminate run-to-run variance for that source entirely rather than just cleaning it up after the
  fact.
- **Free-text `descriptor` and `intents` depend on the writing discipline of whichever agent wrote
  them** (no schema enforces recipe completeness or relative-date correctness) → mitigated by
  `/flow:add`'s echo-back confirmation shown on every add, and by the fact that `descriptor`
  is captured as a transcript of an actually-executed call rather than typed from scratch — but a
  low-quality descriptor written by a careless agent run is still possible and would only surface as
  a confusing future diff.
- **Local file streams can silently go stale if moved/renamed** without the agent being told →
  handled as a standard sync failure (reported, last-good-snapshot retained), not prevented, since
  there's no OS-level way for the agent to discover the new path on its own.
- **Centralizing sync synthesis in the main agent caps how much per-sync context can be off-loaded**
  → acceptable trade-off given intent-matching requires full-ledger context; if this becomes a
  bottleneck for very large workspaces, revisit whether synthesis itself can be sharded by
  intent/topic rather than by stream.

## Open Questions

- Whether recomputing a derived stream (step 3 of the sync execution model) should be delegated to
  its own subagent, the way source-stream diffing is, or stay with the main sync agent — deferred
  because it doesn't change any spec, approach, or task in this change; delegating would only
  require passing along enough ledger/intent context for the subagent to do a good job, which is an
  implementation refinement, not a behavior change.
