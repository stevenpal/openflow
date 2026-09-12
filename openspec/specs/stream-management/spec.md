## Purpose

Defines `/flow:manage`, the command for changing how a stream is tracked or removing it from a
workspace, without ever affecting the external system it points to.

## Requirements

### Requirement: Toggling sync state
`/flow:manage` SHALL allow a user to change a stream's classification between syncable and static
at any time, updating the stream's `syncable` field in the ledger.

#### Scenario: Switching a stream to static
- **WHEN** a user asks to stop tracking updates to a syncable stream but keep it in the workspace
- **THEN** `/flow:manage` SHALL set that stream's `syncable` field to false, and future
  `/flow:sync` runs SHALL NOT attempt to refresh it

### Requirement: Removing a stream
`/flow:manage` SHALL allow a user to remove a stream from the workspace entirely, deleting its
local folder and its ledger entry. Removal SHALL NOT delete, modify, or otherwise affect the remote
document, thread, or query the stream pointed to.

#### Scenario: Removing a stream tied to a live Google Doc
- **WHEN** a user removes a stream backed by a Google Doc
- **THEN** the stream's local folder and ledger entry SHALL be deleted, and the Google Doc itself
  SHALL remain untouched
