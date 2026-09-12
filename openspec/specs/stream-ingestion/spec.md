## Purpose

Defines `/flow:add`, the single entry point for bringing a new source or derived stream into a
workspace and recording it accurately enough that later syncs stay reproducible.

## Requirements

### Requirement: Adding a source stream
`/flow:add` SHALL accept a file, a URL, or a description of a stream (e.g. a query or a document
name/ID) and, for a source stream, SHALL download or snapshot its current content locally and
record the exact retrieval recipe it used as that stream's `descriptor` in the ledger.

#### Scenario: Adding a Slack thread by description
- **WHEN** a user runs `/flow:add` with a description of a Slack thread and context on why it
  matters
- **THEN** the command SHALL create a ledger entry recording the literal retrieval recipe used and
  an initial `intents` entry from the supplied context

### Requirement: Adding a derived stream
`/flow:add` SHALL support adding a derived stream by capturing the source stream(s) it is computed
from (`source_stream_ids`) and the transformation recipe as its `descriptor`, and adding a ledger
entry for it.

#### Scenario: Adding a derived summary stream
- **WHEN** a user asks to summarize a raw CSV-producing stream via a pandas transformation
- **THEN** `/flow:add` SHALL record the source stream's id in `source_stream_ids` and the exact
  transformation steps in `descriptor`, and create a ledger entry with `origin: derived`

### Requirement: Static vs. syncable classification
`/flow:add` SHALL classify each newly added source stream as static or syncable by combining a
type default (e.g. a Google Doc or Slack thread defaults to syncable; a PDF or web article defaults
to static) with any explicit intent expressed in the add prompt, which overrides the type default.
It SHALL NOT block on a classification question by default.

#### Scenario: Prompt language overrides the type default
- **WHEN** a user adds a file while saying they will be iterating and tracking it over time
- **THEN** the stream SHALL be classified as syncable despite files defaulting to static

### Requirement: Local file streams default to static
A local file added as a source stream SHALL default to static rather than syncable, since most
local files a user points OpenFlow at are not actively being revised. `/flow:add` SHALL mention the
option to track it for changes rather than assuming syncable, and explicit intent language in the
add prompt SHALL override this default the same way it does for other stream types. The stream's
snapshot in workspace storage SHALL never be presented as a copy the user is meant to edit; the
user continues editing the real file at its recorded path.

#### Scenario: Adding a reference document
- **WHEN** a user adds a local Word document with no stated intent to keep editing it
- **THEN** the stream SHALL be classified as static, with a note that it can be tracked for changes
  if requested

### Requirement: Immediate action on actionable content
When content added via `/flow:add` implies something actionable (e.g. a meeting transcript with
action items), the command SHALL allow the user to act on it immediately — including direct edits
to affected streams and/or new queue items — rather than requiring a future sync before anything
can happen.

#### Scenario: Transcript with action items
- **WHEN** a user adds a meeting transcript containing a clear follow-up action
- **THEN** `/flow:add` SHALL offer to act on that follow-up immediately, such as adding a queue item

### Requirement: Descriptor captures a literal, complete recipe
`/flow:add` SHALL record `descriptor` as the literal recipe actually executed to retrieve or
transform the stream's content (exact MCP server/tool/parameters, or exact transformation steps for
a derived stream) — not a paraphrase of the user's request. Parameters that are inherently relative
(e.g. "last 7 days," "since last sync") SHALL be written as explicit relative references rather
than frozen as absolute values computed at add-time. When a descriptor omits a timezone, resolution
SHALL default to UTC.

#### Scenario: Recording a relative date range
- **WHEN** a query stream is added with a rolling 7-day window
- **THEN** `descriptor` SHALL record the window as a relative computation (e.g. "start = 7 days
  before today, end = today, both inclusive, UTC") rather than the specific dates computed at
  add-time

#### Scenario: Descriptor omits timezone
- **WHEN** a descriptor's date computation does not mention a timezone
- **THEN** any later resolution of that computation SHALL use UTC, never the executing device's
  local timezone
