## Purpose

Lets a user refresh a workspace's installed `/flow:*` skills and commands after upgrading the
`openflow` CLI, and lets them check which CLI version they have installed.

## ADDED Requirements

### Requirement: CLI version reporting
The system SHALL provide a way to print the installed `openflow` CLI's version.

#### Scenario: Checking the installed version
- **WHEN** a user runs `openflow --version` (or `-V`)
- **THEN** the CLI prints its installed version and exits without requiring a workspace to be
  present

### Requirement: Workspace update command
The system SHALL provide an `openflow update` command that refreshes an initialized workspace's
installed `/flow:*` skills and commands to match the currently installed CLI version.

#### Scenario: Updating a workspace after a CLI upgrade
- **WHEN** a user runs `openflow update` in a workspace whose recorded manifest version differs
  from the installed CLI's version
- **THEN** the command replaces the workspace's `/flow:*` skills and commands with the versions
  bundled in the currently installed CLI, and records the new version in the workspace

#### Scenario: Workspace already current
- **WHEN** a user runs `openflow update` in a workspace whose recorded manifest version already
  matches the installed CLI's version
- **THEN** the command reports that the workspace is already up to date and makes no changes

#### Scenario: Running outside a workspace
- **WHEN** a user runs `openflow update` in a folder that has never been initialized with
  `openflow init`
- **THEN** the command fails with an error explaining that the folder is not an OpenFlow workspace,
  and makes no changes

### Requirement: Only openflow-owned skills and commands are touched
Because a workspace's `.claude/skills/` directory may also contain skills unrelated to openflow,
the update command SHALL only ever add, overwrite, or remove skill directories that openflow
itself previously installed there, and SHALL leave every other entry in `.claude/skills/`
untouched. The workspace's `.claude/commands/flow/` directory is openflow's own dedicated
namespace and MAY be replaced wholesale.

#### Scenario: An upstream skill is renamed or removed
- **WHEN** the currently installed CLI's bundled skill set no longer includes a skill directory
  name that a previous `openflow update` or `openflow init` installed
- **THEN** `openflow update` removes that stale skill directory from `.claude/skills/`

#### Scenario: A user's unrelated skill is never touched
- **WHEN** `.claude/skills/` contains a directory that openflow did not install
- **THEN** `openflow update` (and `openflow init`) leaves that directory unchanged, regardless of
  what it is named

### Requirement: Installed-version manifest
The system SHALL record, per workspace, which `openflow` CLI version last installed or updated its
skills and commands, and exactly which skill directory names it installed, so that a later
`openflow update` can compute what changed without guessing.

#### Scenario: Manifest is present after init or update
- **WHEN** `openflow init` or `openflow update` completes successfully
- **THEN** the workspace's manifest records the CLI version that just ran and the exact set of
  skill directory names it installed under `.claude/skills/`

### Requirement: Explicit acknowledgment for pre-manifest workspaces
The system SHALL require an explicit acknowledgment before running `openflow update` against a
workspace that was initialized before this manifest existed (i.e. an initialized workspace with no
recorded manifest), rather than silently treating it as a first-time install.

#### Scenario: Updating a workspace with no manifest
- **WHEN** a user runs `openflow update` in an initialized workspace that has no manifest
- **THEN** the command fails with an error asking the user to re-run with `--force`, and makes no
  changes

#### Scenario: Forcing an update on a workspace with no manifest
- **WHEN** a user runs `openflow update --force` in an initialized workspace that has no manifest
- **THEN** the command proceeds as a first-time manifest creation: it refreshes the workspace's
  `/flow:*` skills and commands and writes a manifest recording the installed version
