## Purpose

Provides the single, validated, versioned record of every stream a workspace tracks — the context
artifact every `/flow:*` command reads before doing anything else.

## Requirements

### Requirement: Ledger entry schema
The intent ledger SHALL be a single file per workspace, with one entry per tracked stream
containing at minimum: `id`, `descriptor`, `type`, `origin` (`source` or `derived`),
`source_stream_ids` (derived streams only), `description`, `intents`, `added_at`, `syncable`, and
`last_synced_at`.

#### Scenario: Reading a stream's retrieval recipe
- **WHEN** any `/flow:*` command needs to (re)produce a stream's content
- **THEN** it SHALL use that stream's `descriptor` field as the complete, literal instructions for
  doing so, rather than re-deriving retrieval parameters from the stream's `description` or from
  memory

#### Scenario: Determining whether a stream is derived
- **WHEN** a command needs to know whether a stream is computed from other streams or pulled from
  an external system
- **THEN** it SHALL read the structured `origin` field rather than parsing `descriptor` prose

### Requirement: Validated ledger writes
Every agent-initiated mutation to the ledger (adding a stream, removing a stream, updating a
stream's fields) SHALL go through a script that enforces the ledger schema (required fields, valid
enum values, unique ids) and referential integrity (every `source_stream_ids` entry references an
existing stream with `origin: source`) before writing. The agent SHALL NOT write to the ledger file
directly.

#### Scenario: Rejecting an invalid mutation
- **WHEN** an agent attempts to add a derived stream whose `source_stream_ids` references a stream
  that does not exist, or references another derived stream
- **THEN** the write SHALL be rejected before the ledger file is modified

### Requirement: Validated ledger reads
Every `/flow:*` command SHALL read the ledger through a validating accessor that re-checks schema
and referential integrity on every read (not only at write time), so that a hand-edited ledger is
also validated. Any entry that fails validation SHALL be reported to the user, and the command
SHALL proceed using the remaining valid entries rather than failing entirely or silently dropping
the invalid entry without comment.

#### Scenario: A hand-edited ledger has a dangling reference
- **WHEN** a user manually edits the ledger and introduces a `source_stream_ids` entry pointing at
  a stream that no longer exists
- **THEN** the next `/flow:*` command SHALL report that the entry was skipped and why, and SHALL
  continue operating on the rest of the ledger

### Requirement: Ledger versioning
The ledger file SHALL be snapshotted before every mutation (add, remove, or update), so that a
prior version can be recovered or diffed against after a bad edit.

#### Scenario: Recovering from a bad manual edit
- **WHEN** a user makes a ledger edit that corrupts an entry
- **THEN** a snapshot of the ledger from immediately before that edit SHALL be available to restore
  or diff against

### Requirement: Intents rewritten in place
A stream's `intents` list SHALL be a small, current-state set of free-text entries describing why
the stream matters, with no separate canonical intent registry. Whenever a command's action touches
a stream's relevance, it SHALL re-read the current `intents` list and update it in place — editing
an existing entry that the new information sharpens, adding a new entry only when the new
information is a genuinely distinct intent, and dropping an entry that current context shows no
longer applies — rather than appending a new entry unconditionally.

#### Scenario: A second reference sharpens an existing intent
- **WHEN** a stream already has an intent entry describing a customer conversation, and a new sync
  reveals a more specific detail about that same conversation
- **THEN** the existing entry SHALL be edited in place to reflect the sharper detail, rather than a
  second near-duplicate entry being appended

#### Scenario: A stream gains an unrelated new use
- **WHEN** work reveals that a stream is now also relevant to a distinct topic unrelated to its
  existing intents
- **THEN** a new `intents` entry SHALL be added alongside the existing ones
