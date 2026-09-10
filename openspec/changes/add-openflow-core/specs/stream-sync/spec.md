## Purpose

Defines `/flow:sync`, which refreshes every syncable stream, detects what changed, and turns that
into ledger and queue updates without letting a large workspace overwhelm a single agent's context.

## ADDED Requirements

### Requirement: Per-stream subagent dispatch
For each syncable source stream, `/flow:sync` SHALL dispatch a subagent scoped to that single
stream to pull its latest content, diff it against its last normalized snapshot, and report a
structured finding back to the main sync agent. The main sync agent SHALL NOT perform this
per-stream diffing itself.

#### Scenario: Syncing a workspace with many streams
- **WHEN** `/flow:sync` runs on a workspace with many syncable source streams
- **THEN** each stream's pull-and-diff work SHALL run in its own subagent, and the main agent SHALL
  only receive each subagent's structured finding

### Requirement: Centralized synthesis
The main sync agent SHALL be the only place that matches a stream's findings against its ledger
`intents`, decides what is queue-worthy versus immediately actionable, writes intent-focused queue
items, and rewrites a stream's `intents` list when a finding changes or deepens why it matters. This
synthesis SHALL NOT be delegated to a per-stream subagent.

#### Scenario: A finding needs ledger context to interpret
- **WHEN** a per-stream subagent reports a raw finding (e.g. new comments)
- **THEN** the main agent, not the subagent, SHALL decide whether and how that finding becomes a
  queue item, using the stream's `intents` from the ledger

### Requirement: Derived stream recomputation on sync
`/flow:sync` SHALL recompute any syncable derived stream whose source stream(s) reported meaningful
changes, and SHALL diff and summarize the result the same way a source stream's change is handled.

#### Scenario: Source stream feeding a derived stream changes
- **WHEN** a source stream feeding a syncable derived stream reports a meaningful change during
  sync
- **THEN** `/flow:sync` SHALL recompute the derived stream using its `descriptor` and process the
  result through the same diff/summarize path

### Requirement: Uniform sync failure reporting
A stream that cannot be refreshed during sync — due to an unreachable MCP server, an expired
credential, a moved or renamed local file, or any other retrieval failure — SHALL be reported to
the user with the specific cause, and SHALL be left at its last good snapshot. Work on other streams
SHALL continue rather than being blocked by one stream's failure. Sync SHALL NOT attempt to guess at
or silently work around the underlying cause.

#### Scenario: An MCP server is unreachable
- **WHEN** the MCP server backing a syncable stream returns an authentication error during sync
- **THEN** `/flow:sync` SHALL report the specific failure for that stream, leave it at its last good
  snapshot, and continue syncing the remaining streams

#### Scenario: A local file moved
- **WHEN** a syncable local file stream's recorded path no longer resolves
- **THEN** `/flow:sync` SHALL report that the file could not be found at its recorded path and
  leave the stream at its last good snapshot
