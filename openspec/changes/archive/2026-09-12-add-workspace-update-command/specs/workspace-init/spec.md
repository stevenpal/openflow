## ADDED Requirements

### Requirement: Initialization records the installed-version manifest
`openflow init` SHALL write the same installed-version manifest that `openflow update` relies on
(recording the CLI version and the exact skill directory names installed), so that a workspace
created after this change always has a baseline a later `openflow update` can diff against.

#### Scenario: Manifest present on a fresh workspace
- **WHEN** a user runs `openflow init` in a fresh folder
- **THEN** the resulting workspace has a manifest recording the current CLI version and the exact
  set of skill directory names `init` installed under `.claude/skills/`
