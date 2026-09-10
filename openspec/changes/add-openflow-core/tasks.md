## 1. Workspace scaffolding (`workspace-init`)

- [ ] 1.1 Create the `@stevenpal/openflow` CLI package skeleton with an `openflow init` command and
      verify `npm install -g` + `openflow init` in an empty folder exits 0
- [ ] 1.2 Implement workspace scaffolding: create `streams/`, install `/flow:*` skill files and any
      node_modules they depend on, and create an empty intent ledger file; verify all expected
      paths exist after `openflow init`
- [ ] 1.3 Verify two `openflow init` workspaces in separate folders are fully independent (no shared
      state, no cross-workspace file references)

## 2. Intent ledger (`stream-ledger`)

- [ ] 2.1 Define the ledger schema (YAML) with fields `id`, `descriptor`, `type`, `origin`,
      `source_stream_ids`, `syncable`, `description`, `intents`, `added_at`, `last_synced_at` and
      write a schema validator; verify it accepts a minimal valid entry and rejects a missing
      required field
- [ ] 2.2 Implement `add_stream`, `remove_stream`, `update_stream` scripts that validate schema and
      referential integrity (every `source_stream_ids` entry exists and is `origin: source`) before
      writing; verify each rejects an invalid mutation and accepts a valid one
- [ ] 2.3 Implement `get_streams`, a validating read accessor that re-checks schema and referential
      integrity on every call and reports (without throwing away) invalid entries; verify it
      returns valid entries plus a reported list of skipped invalid ones on a ledger with a
      dangling `source_stream_ids` reference
- [ ] 2.4 Implement ledger snapshotting before every mutation; verify a snapshot exists and matches
      pre-mutation content after each of `add_stream`/`remove_stream`/`update_stream`
- [ ] 2.5 Implement the in-place `intents` rewrite rule (edit/add/drop) as a shared helper used by
      `/flow:add`, `/flow:sync`, and `/flow:work`; verify with unit tests covering each of the three
      outcomes (sharpen existing, add distinct, drop stale)

## 3. Stream normalization pipeline (`stream-normalization`)

- [ ] 3.1 Define canonical intermediate TypeScript types for each of the ~10 stream shapes; verify
      with type-level tests / example fixtures per shape
- [ ] 3.2 Implement one shared renderer per shape (canonical object → target format: Markdown
      transcript, CSV, JSON, etc.); verify each renderer against a fixture input/output pair
- [ ] 3.3 Implement Tier 1 adapters for at least one popular source per shape (e.g. Slack for chat,
      Google Docs for structured rich-text, Google Sheets for tabular); verify each adapter maps a
      sample native payload to the canonical shape correctly
- [ ] 3.4 Implement the Tier 2 path: agent verbatim-extraction prompt/template per shape, plus a
      shared deterministic clean-up script (whitespace, bullet/heading normalization, stable
      ordering); verify the clean-up script is idempotent and shape-agnostic across two different
      shapes' fixtures
- [ ] 3.5 Implement accepted-state-only body rendering plus separate trailing sections for comments
      and pending track-changes/suggestions for the structured rich-text shape; verify a fixture
      with a pending suggestion produces a body excluding it and a track-changes section including
      it
- [ ] 3.6 Implement per-stream storage layout (`streams/stream-*/` with raw + normalized, versioned
      snapshots); verify a second sync produces a new versioned snapshot without overwriting the
      prior one

## 4. `/flow:add` (`stream-ingestion`)

- [ ] 4.1 Implement source-stream add flow (file/URL/description input → retrieval → raw+normalized
      snapshot → ledger entry via `add_stream`); verify end-to-end with a file input and a URL input
- [ ] 4.2 Implement derived-stream add flow capturing `source_stream_ids` and a transformation
      `descriptor`; verify the resulting ledger entry has `origin: derived` and valid
      `source_stream_ids`
- [ ] 4.3 Implement static/syncable classification (type default + prompt-language override);
      verify with cases covering type-default-only, type-default-overridden-by-prompt, and
      local-file-default-static
- [ ] 4.4 Implement the classification confirmation note shown after every classification; verify
      it appears for both type-default and prompt-overridden classifications
- [ ] 4.5 Implement literal-recipe descriptor capture (transcript of the actual retrieval call, not
      a paraphrase), including relative-date writing via `get_date`/`get_period_start` primitives
      and explicit inclusive/exclusive + timezone (UTC default); verify a query-shaped add records
      a relative descriptor that resolves to the same absolute dates when replayed on two different
      days at the same offset
- [ ] 4.6 Implement immediate-action support for actionable content (queue item and/or direct stream
      edit at add-time); verify with a transcript fixture containing an action item

## 5. Derived streams (`derived-streams`)

- [ ] 5.1 Enforce the one-level-deep constraint in `add_stream`/`update_stream` (reject
      `source_stream_ids` referencing a derived stream); verify with a rejection test
- [ ] 5.2 Implement source-change-triggered recomputation (no independent scheduling) and the
      static-derived-computes-once behavior; verify both with a two-sync scenario (source changes
      on sync 2 only)

## 6. `/flow:sync` (`stream-sync`)

- [ ] 6.1 Implement per-stream subagent dispatch for pull + diff + structured finding reporting;
      verify a multi-stream workspace produces one structured finding per syncable source stream
- [ ] 6.2 Implement centralized synthesis in the main sync agent: matching findings to `intents`,
      deciding queue-worthiness, writing intent-focused queue items, and updating `intents` in place
      (reusing 2.5); verify a finding produces a well-formed queue item per the `work-queue` format
- [ ] 6.3 Wire derived-stream recomputation into sync step 3 using the `derived-streams` logic from
      section 5; verify a derived stream is recomputed exactly when its source changes
- [ ] 6.4 Implement uniform sync-failure reporting (unreachable MCP server, expired credential,
      moved local file) that leaves the stream at its last good snapshot and continues syncing
      other streams; verify with a simulated MCP 401 and a simulated moved-file path

## 7. `/flow:manage` (`stream-management`)

- [ ] 7.1 Implement sync-state toggling (syncable ↔ static) via `update_stream`; verify a toggled
      stream is skipped/included correctly on the next `/flow:sync`
- [ ] 7.2 Implement stream removal (delete local folder + ledger entry only, never touch the remote
      source) via `remove_stream`; verify the remote resource is untouched and the local
      folder/ledger entry are gone

## 8. `/flow:work` and the queue document (`work-queue`)

- [ ] 8.1 Implement queue rendering grouped by intent/topic for cold-start resumption; verify with a
      multi-item, multi-intent queue fixture
- [ ] 8.2 Implement scoped pre-work sync (single stream, no approval gate, brief heads-up) reusing
      the per-stream dispatch from 6.1; verify only the touched stream is synced, not the workspace
- [ ] 8.3 Implement the meaningful-change heads-up and fold-in-or-continue flow when scoped sync
      finds a change, and the last-good-snapshot fallback when scoped sync fails; verify both paths
- [ ] 8.4 Implement in-place `intents` rewriting from `/flow:work` (reusing 2.5); verify a worked
      item that sharpens relevance updates the ledger entry in place
- [ ] 8.5 Implement the queue document format (heading, Stream line, Intent line, free-text body)
      and default item removal on resolution; verify a generated item matches the format and
      disappears after being marked resolved

## 9. `/flow:ask` (`stream-research`)

- [ ] 9.1 Implement cross-stream research that searches tracked stream content/descriptions/intents
      for a query not tied to a single queue item; verify with a question whose answer spans two or
      more streams

## 10. Integration verification

- [ ] 10.1 Run an end-to-end scenario: `openflow init` → `/flow:add` (one syncable, one static, one
      derived) → `/flow:sync` (with one upstream change) → `/flow:work` on the resulting queue item
      → `/flow:manage` to remove a stream; verify each step's expected ledger/queue/snapshot state
- [ ] 10.2 Validate all specs and the full change with `openspec validate --strict` and fix any
      reported issues
