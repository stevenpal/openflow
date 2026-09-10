## Purpose

Ensures every supported stream, regardless of source app, is converted into a consistent,
cheap-to-diff normalized format so later syncs produce clean diffs instead of noise.

## ADDED Requirements

### Requirement: Supported stream shapes
The system SHALL classify every stream into one of a fixed, small set of content shapes (chat/
messaging, structured rich-text document, tabular/spreadsheet, presentation, web page, email,
query/API result, audio/video transcript, project/task tracker item, plain text/code/config) rather
than one bespoke type per source application, and SHALL render each shape into a fixed target
normalized format (e.g. Markdown transcript, CSV, JSON) specific to that shape.

#### Scenario: Classifying a new source of an existing shape
- **WHEN** a stream comes from a chat-style source not previously supported (e.g. a new messaging
  app)
- **THEN** it SHALL be classified into the existing chat/messaging shape and rendered into that
  shape's Markdown transcript format, rather than requiring a new shape

### Requirement: Two-tier conversion pipeline
For a stream shape and source with a deterministic adapter available, the system SHALL convert the
raw payload into that shape's canonical intermediate representation via the adapter, then render it
to the target format with a shared renderer used by every source of that shape. For a shape/source
combination without an adapter, the system SHALL have the agent extract content verbatim and in
reading order into the shape's fixed target template — without summarizing or rephrasing — and then
pass the result through a deterministic clean-up step shared across all sources of that shape.

#### Scenario: Adapter available
- **WHEN** a stream's source has a registered adapter for its shape
- **THEN** normalization SHALL use the adapter plus shared renderer path and produce a
  deterministic result independent of agent wording variance

#### Scenario: No adapter available
- **WHEN** a stream's source has no registered adapter
- **THEN** normalization SHALL use verbatim agent extraction followed by deterministic clean-up,
  and SHALL NOT summarize or rephrase the extracted content

### Requirement: Body, comments, and track changes stay separate
The normalized body of a structured rich-text document SHALL reflect accepted-state-only content,
excluding pending suggested edits. Comments SHALL be rendered in their own trailing section, one
entry per comment with a short anchor snippet plus author/timestamp/text. Pending track-changes/
suggested edits SHALL be rendered in a separate trailing section, one entry per pending suggestion.

#### Scenario: A pending suggestion exists
- **WHEN** a document has an unaccepted suggested edit
- **THEN** the normalized body SHALL NOT reflect that edit, and the edit SHALL appear as an entry
  in the track-changes section instead

#### Scenario: A suggestion is later accepted
- **WHEN** a previously-pending suggestion is accepted upstream and the stream is re-synced
- **THEN** the entry SHALL disappear from the track-changes section, and the normalized body SHALL
  reflect the now-accepted content change

### Requirement: Per-stream storage layout
Each tracked stream SHALL have its own folder, storing a raw snapshot (the unmodified downloaded
payload in its native shape) and a normalized snapshot (the rendered target-format content) for
every add and, for syncable streams, every subsequent sync. Snapshots SHALL be timestamped or
versioned so a sync can diff the current normalized snapshot against the prior one. Static and
syncable streams SHALL share the same storage location, distinguished only by the ledger's
`syncable` field.

#### Scenario: Diffing against the prior snapshot
- **WHEN** a syncable stream is synced
- **THEN** its new normalized snapshot SHALL be diffed against the immediately prior normalized
  snapshot stored in that stream's folder
