## Purpose

Defines `/flow:work` and the queue document it operates on — the mechanism for resuming work on
what needs a decision or response, grouped meaningfully rather than as a flat backlog.

## Requirements

### Requirement: Queue brought into context grouped by intent
`/flow:work` SHALL bring the queue document into context and present or summarize it grouped by
intent/topic rather than as a flat chronological list, supporting resuming work cold without having
just run `/flow:add` or `/flow:sync` in the current session.

#### Scenario: Resuming work cold
- **WHEN** a user runs `/flow:work` at the start of a new session with no prior `add`/`sync` this
  session
- **THEN** the queue SHALL be presented grouped by the intent/topic each item relates to

### Requirement: Pre-work sync scoped to the item at hand
Before acting on a queue item that touches a specific stream, `/flow:work` SHALL sync only that
stream (not the full workspace), proceeding without requiring approval first since the sync is
non-destructive and versioned, and SHALL give the user a brief heads-up that it is doing so.

#### Scenario: Working an item tied to one stream
- **WHEN** a user selects a queue item tied to a single Slack thread stream
- **THEN** `/flow:work` SHALL sync only that stream before acting, with a brief notice, rather than
  running a full workspace `/flow:sync`

#### Scenario: Scoped sync reveals a meaningful change
- **WHEN** the scoped pre-work sync detects a meaningful change to the stream
- **THEN** `/flow:work` SHALL tell the user before proceeding, since it may change the nature of the
  work, and SHALL let the user fold the change into the ledger/queue the normal way if warranted

#### Scenario: Scoped sync fails
- **WHEN** the scoped pre-work sync cannot refresh the stream
- **THEN** `/flow:work` SHALL proceed against the last good snapshot and tell the user why the
  refresh failed, rather than blocking the work

### Requirement: In-place intent updates from work
When working an item draws on a stream in a way that changes or sharpens why it matters,
`/flow:work` SHALL rewrite that stream's `intents` list in the ledger in place, following the same
edit/add/drop rules as any other command touching stream relevance.

#### Scenario: Working an item reveals a sharper reason a stream matters
- **WHEN** working a queue item surfaces a more specific reason an existing tracked stream is
  relevant
- **THEN** `/flow:work` SHALL update that stream's matching `intents` entry in place

### Requirement: Queue document format
The queue SHALL be stored as a human-editable markdown file. Each item SHALL have a short,
actionable heading; a **Stream** line linking to the source stream (a live URL when the stream type
has one, otherwise a link to its local folder/descriptor); an **Intent** line naming the ledger
intent the item traces back to; and a free-text body narrating the substance of what needs deciding
or responding to. Users SHALL be free to edit, reorder, comment on, or delete items directly.

#### Scenario: An item for a Slack-based decision
- **WHEN** `/flow:sync` writes a queue item derived from a Slack thread
- **THEN** the item SHALL include a heading summarizing the decision, a Stream line linking to the
  Slack thread, an Intent line naming the relevant ledger intent, and a body explaining what needs
  to be decided and why

#### Scenario: User resolves an item outside the tool
- **WHEN** a user has already replied in Slack themselves, making a queue item moot
- **THEN** the user SHALL be able to delete that item directly from the queue document

### Requirement: Resolved items removed by default
When a queue item is resolved — whether through `/flow:work`, or handled immediately during
`/flow:add` or `/flow:sync` — it SHALL be removed from the queue document by default.

#### Scenario: An item is resolved during work
- **WHEN** a user and the agent resolve a queue item together via `/flow:work`
- **THEN** the item SHALL be removed from the queue document
