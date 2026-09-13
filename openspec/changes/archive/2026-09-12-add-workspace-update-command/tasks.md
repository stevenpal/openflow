## 1. Manifest module

- [x] 1.1 Add `manifestFile` to `workspacePaths()` in `src/workspace.ts` (`.openflow/manifest.json`) and verify existing `workspace.ts` tests/usages still resolve
- [x] 1.2 Add a manifest read/write module (e.g. `src/manifest.ts`) with a typed shape `{ cliVersion, installedSkills, installedAt, updatedAt }`, a `readManifest(root)` returning `undefined` when absent, and a `writeManifest(root, data)`, and cover both with unit tests
- [x] 1.3 Add a helper that resolves the running CLI's own `package.json` version the same way `init.ts` resolves `TEMPLATES_DIR` (via `import.meta.url`), and verify it returns the version in `package.json`

## 2. Shared skill/command sync logic

- [x] 2.1 Extract the skill-directory diffing described in design.md ("Skill diff algorithm") into a shared function taking `(templatesSkillsDir, workspaceSkillsDir, previousInstalledSkills)` and returning the new `installedSkills` list, deleting only directories that were previously installed and are no longer present upstream, and verify with unit tests: unrelated existing dir is preserved, stale openflow dir is removed, renamed skill ends up present under its new name only
- [x] 2.2 Extract the commands-flow wipe-and-recopy (safe wholesale replace of `.claude/commands/flow/`) into a shared function, and verify with a unit test that a stale file (one not present in current templates) is removed after a call
- [x] 2.3 Update `src/commands/init.ts` to use both shared functions instead of the current merge-only `copyDir` calls for skills/commands, and to write the manifest (`installedSkills` = current template set, `cliVersion` = running CLI version) after scaffolding; verify `tests/init.test.ts` still passes and extend it to assert `.openflow/manifest.json` exists with the expected fields after `openflow init`

## 3. `openflow update` command

- [x] 3.1 Implement `src/commands/update.ts`: read the manifest; if absent and `.openflow/` exists, require `--force` (fail otherwise with a clear error and no filesystem changes) - verify with a test that asserts no files change and a non-zero exit/error without `--force`
- [x] 3.2 If the workspace itself doesn't exist (no `.openflow/` at all), fail with an error explaining the folder isn't an OpenFlow workspace - verify with a test
- [x] 3.3 If manifest exists and `manifest.cliVersion` equals the running CLI's version, report "already up to date" and make no filesystem changes - verify with a test that asserts no files are touched
- [x] 3.4 Otherwise (version differs, or missing manifest + `--force`), run the shared skill diff sync and the commands wipe-and-recopy from section 2, then write the updated manifest - verify with a test that: a stale skill dir is removed, an unrelated skill dir survives untouched, `.claude/commands/flow/` matches current templates exactly, and the manifest records the new `cliVersion`/`installedSkills`
- [x] 3.5 Wire `update` into `src/cli.ts` as a top-level command with a `--force` flag and a description, and verify `openflow update --help` lists it

## 4. `openflow --version`

- [x] 4.1 Register `program.version(...)` in `src/cli.ts` using the helper from 1.3, and verify `openflow --version` and `openflow -V` print the version and exit 0 from any directory (no workspace required)

## 5. Skill menu duplication fix

- [x] 5.1 Add `user-invocable: false` to the frontmatter of each `templates/skills/flow-*/SKILL.md` (flow-add, flow-ask, flow-manage, flow-sync, flow-work), and verify each file still has valid frontmatter (existing `name`/`description`/`allowed-tools` fields unchanged) by re-running any existing template-parsing tests, or a quick frontmatter-parses check if none exist

## 6. Docs

- [x] 6.1 If `README.md` documents `openflow init`/CLI usage, add `openflow update` and `openflow --version` alongside it, and verify the new commands are discoverable from the README
