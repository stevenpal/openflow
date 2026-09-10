## Why

Knowledge workers pull context for their work from many places — Slack threads, Google Docs,
tickets, queries, transcripts — and re-explain that context to a coding-agent-style tool
(Claude Code, Codex, Cursor, etc.) every session because nothing persists it. OpenFlow gives
those agents a local, versioned memory of the "streams" a workspace cares about, so an agent can
track what changed, surface what needs a human decision, and work through it with the user across
sessions without re-onboarding each time. This proposal establishes the first version of that
system end to end, from `openflow init` through the full `/flow:*` command surface.

## What Changes

- New CLI package (`@stevenpal/openflow`) with `openflow init`, which scaffolds a workspace: skill
  files, folder layout, and an initial empty intent ledger.
- New **intent ledger** — a single per-workspace YAML file listing every tracked stream (source or
  derived), its classification (static/syncable), its `descriptor` retrieval/transformation
  recipe, and a free-text `intents` list rewritten in place as relevance changes. Ledger writes go
  through validating scripts (`add_stream`/`remove_stream`/`update_stream`); reads go through a
  validating accessor that reports (never silently drops) invalid entries; the ledger is
  snapshotted before every mutation.
- New `/flow:add` command: adds a source stream (file, URL, or description) or a derived stream
  (computed from existing source streams). Infers static-vs-syncable classification from type
  defaults and prompt language, with a lightweight confirmation note that fades out once the
  ledger is established. Can act immediately on obviously-actionable content instead of only
  queuing it.
- New raw → normalized conversion pipeline: a two-tier system (deterministic shape adapters +
  shared renderers for popular sources; agent-extraction + deterministic clean-up for the long
  tail) that turns any of ~10 supported stream shapes into a consistent, diffable target format,
  with comments and pending track-changes/suggestions rendered as separate trailing sections from
  body content.
- New **derived streams**: streams computed from one or more existing source streams via a
  free-text transformation recipe, constrained to one level deep (no chaining derived-from-derived)
  and recomputed only when a source they depend on changes.
- New `/flow:sync` command: pulls every syncable source stream, diffs against the last snapshot,
  recomputes affected derived streams, and synthesizes findings into ledger `intents` updates
  and/or queue items — fanned out to per-stream subagents to avoid context drift, with synthesis
  centralized in the main agent.
- New `/flow:manage` command: toggles a stream between static/syncable or removes it from the
  workspace (local folder + ledger entry only — never touches the remote source).
- New `/flow:work` command: brings the queue into context grouped by intent/topic, scoped
  pre-work sync of just the stream(s) an item touches before acting, and in-place rewriting of a
  touched stream's `intents` when work sharpens why it matters.
- New **queue document** (`queue.md`): human-editable, intent-focused write-up of what needs a
  decision or response, linking back to the source stream and the ledger intent it traces to.
- New `/flow:ask` command: deep research across all tracked streams for questions that don't map to
  a single queue item.
- Uniform, non-silent failure handling: sync failures (down MCP server, expired token, moved local
  file) and ledger referential-integrity problems are always reported to the user, never dropped or
  guessed at.

## Capabilities

### New Capabilities
- `workspace-init`: `openflow init` CLI scaffolding of a new workspace (skills, folder layout,
  empty ledger).
- `stream-ledger`: the intent ledger's schema, validating read/write access, snapshot versioning,
  and in-place `intents` rewriting.
- `stream-ingestion`: the `/flow:add` command — static/syncable classification, descriptor capture,
  local file stream handling, immediate action on obviously-actionable content.
- `stream-normalization`: the two-tier raw → normalized conversion pipeline and per-shape storage
  layout (raw + normalized snapshots).
- `derived-streams`: derived stream definition, one-level-deep constraint, and source-triggered
  recomputation.
- `stream-sync`: the `/flow:sync` command — subagent-fanned diffing, derived-stream recomputation,
  intent/queue synthesis, and uniform sync-failure reporting.
- `stream-management`: the `/flow:manage` command — toggling sync state and removing streams.
- `work-queue`: the `/flow:work` command, the queue document format, and scoped pre-work sync.
- `stream-research`: the `/flow:ask` command for cross-stream deep research.

### Modified Capabilities
_None — this is a greenfield proposal; no existing specs are being changed._

## Impact

- New npm package and its CLI entry point (`openflow`), plus the `/flow:*` skill files it installs
  into a workspace.
- New on-disk workspace layout: `streams/stream-*/` (raw + normalized snapshots), the intent
  ledger file, and `queue.md`.
- Depends on the host agent harness's skill support (Claude Code, Codex, etc.) and, optionally, MCP
  servers configured for the external systems a workspace tracks (Google Docs, Slack, databases,
  etc.) — no MCP server is required to use OpenFlow at all.
- No existing code or specs are modified; this is the first change in the repo.
