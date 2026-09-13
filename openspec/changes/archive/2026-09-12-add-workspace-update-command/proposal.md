## Why

`npm install -g` upgrades the `openflow` CLI, but a workspace's `.claude/skills/flow-*` and
`.claude/commands/flow/*` files are copies made at `openflow init` time — they stay frozen at
whatever version was installed then. There is currently no record of which CLI version scaffolded
a workspace, no command to refresh it, and no way for a user to check which version of the CLI
they have installed. Separately, shipping both a skill and a pass-through slash command for each
`/flow:*` action produces duplicate, confusing entries in the agent's `/` menu.

## What Changes

- Add `openflow --version` (and `-V`), printing the installed CLI's version.
- Add `openflow update`, which refreshes a workspace's installed skills and commands to match the
  currently installed CLI version:
  - Introduces `.openflow/manifest.json`, recording `cliVersion` and `installedSkills` (the exact
    skill directory names openflow last installed under `.claude/skills/`).
  - Diffs `installedSkills` against the current template set to remove skill directories that no
    longer exist upstream, then overwrites/adds the current set — never a blind
    `rm -rf .claude/skills`, since that directory is shared with any of the user's own unrelated
    skills.
  - Wipes and recopies `.claude/commands/flow/` wholesale (safe: that directory is openflow's own
    namespace).
  - Requires `--force` when `.openflow/` exists but `manifest.json` is missing (a workspace
    initialized before this feature existed), to make the first-time manifest write an explicit,
    acknowledged action rather than a silent one.
  - Leaves an explicit seam for future ledger/data migrations keyed off the manifest's recorded
    `cliVersion`, without implementing any migration logic now.
- `openflow init` now also writes `.openflow/manifest.json` on first scaffold, so every
  newly-created workspace has a baseline `update` can diff against later.
- Add `user-invocable: false` to every `templates/skills/flow-*/SKILL.md`'s frontmatter, so the
  skill no longer appears as its own typeable `/flow-add`-style menu entry; the skill remains
  reachable via its paired `/flow:*` command and via the agent's own implicit invocation.

## Capabilities

### New Capabilities
- `workspace-update`: the `openflow update` command, the `.openflow/manifest.json` format, and the
  `openflow --version` flag.

### Modified Capabilities
- `workspace-init`: `openflow init` additionally writes `.openflow/manifest.json` on first scaffold.

## Impact

- `src/cli.ts`: register `--version` and the new `update` command.
- `src/commands/init.ts`: write the initial manifest; extract the shared skill/command copy logic
  so `update` can reuse it.
- New `src/commands/update.ts` (or similar) and a manifest read/write module.
- `src/workspace.ts`: add `manifestFile` to `workspacePaths`.
- `templates/skills/flow-*/SKILL.md`: add `user-invocable: false` to frontmatter (5 files).
- Tests: `tests/init.test.ts` (manifest written on init) and a new `tests/update.test.ts`.
