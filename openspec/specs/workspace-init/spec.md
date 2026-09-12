## Purpose

Lets a user turn a plain folder into an OpenFlow workspace with everything the `/flow:*` commands
need already in place, and keeps unrelated projects structurally isolated from each other.

## Requirements

### Requirement: Workspace initialization
The system SHALL provide an `openflow init` command that scaffolds the current folder into a
working OpenFlow workspace: installing the `/flow:*` skills and any scripts/dependencies they
require, creating the folders needed to add and sync streams, and creating an initial, empty
intent ledger.

#### Scenario: Initializing a fresh folder
- **WHEN** a user runs `openflow init` in an empty folder
- **THEN** the folder contains the installed `/flow:*` skills, the folders required for stream
  storage, and an empty intent ledger ready to accept the first `/flow:add`

### Requirement: One ledger per workspace
Each workspace SHALL have exactly one intent ledger, and workspaces SHALL be fully independent of
one another: an agent operating in one workspace SHALL NOT have visibility into another
workspace's streams or ledger.

#### Scenario: Separating unrelated work
- **WHEN** a user has two genuinely unrelated projects, even if both reference some of the same
  external systems
- **THEN** each project SHALL live in its own folder with its own `openflow init` and its own
  ledger, rather than being represented as a "project" grouping inside a single shared workspace
