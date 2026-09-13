## Context

See proposal.md - Why. Relevant current state:

- `src/commands/init.ts` copies `templates/skills/` into `.claude/skills/` and
  `templates/commands/flow/` into `.claude/commands/flow/` via a recursive `copyDir` that only adds
  or overwrites files by name; it never deletes stale files.
- `.claude/skills/` is a flat namespace shared with any other skill the user or another tool has
  installed there; `.claude/commands/flow/` is already openflow's own dedicated subfolder.
- Nothing today records which CLI version scaffolded a workspace.

## Goals / Non-Goals

**Goals:**
- Make `openflow update` safe to run against a workspace that also has unrelated skills under
  `.claude/skills/`.
- Make the manifest format extensible enough that a future change can add ledger/data migration
  bookkeeping without redesigning it.

**Non-Goals:**
- Implementing any actual data/ledger migration logic (explicitly deferred; this change only
  leaves the seam).
- Preserving user hand-edits to installed skill/command files across an update (confirmed
  out of scope with the user - these files are fully CLI-owned).
- An `openflow update --check` / dry-run mode (not requested; can be added later without
  reshaping this design).

## Decisions

### Manifest file: `.openflow/manifest.json`, separate from `ledger.yaml`
Keeps tooling/install metadata (CLI version, installed skill names) out of the validated intent
ledger, which is user-facing data with its own schema. Shape:

```json
{
  "cliVersion": "0.1.3",
  "installedSkills": ["flow-add", "flow-ask", "flow-manage", "flow-sync", "flow-work"],
  "installedAt": "2026-09-12T00:00:00.000Z",
  "updatedAt": "2026-09-12T00:00:00.000Z"
}
```

`installedSkills` is the load-bearing field: it is the only way `update` can tell which entries
under `.claude/skills/` it owns, since skills cannot be namespaced into a subdirectory (Claude Code
only discovers direct children of `.claude/skills/`; confirmed against the local Claude Code
skills reference docs - no nested discovery). `installedAt`/`updatedAt` are for human debugging
only, not read by any logic in this change.

Alternative considered: fold `cliVersion` into `ledger.yaml` as a `_meta` field. Rejected -
mixes tooling state into a document whose schema is meant to describe streams/intents, and would
complicate the ledger's own validation.

### Skill diff algorithm
`update` (and `init`, on first run) computes:
- `toRemove = manifest.installedSkills - currentTemplateSkillNames` -> delete these directories
  from `.claude/skills/` if present.
- `toWrite = currentTemplateSkillNames` -> copy (overwrite) each from `templates/skills/`.
- New `manifest.installedSkills = currentTemplateSkillNames`.

This never touches a `.claude/skills/` entry that isn't in either the old or new
`installedSkills`/template set. `.claude/commands/flow/` is simpler: since that whole directory is
openflow's namespace, `update` does `rm -rf` + recopy of the directory itself.

Alternative considered: namespace skills under `.claude/skills/openflow/flow-add/`. Rejected -
confirmed unsupported by Claude Code's skill discovery (direct children only).

### Version comparison and idempotency
`update` compares `manifest.cliVersion` to the running CLI's own `package.json` version (resolved
the same way `init.ts` already resolves `TEMPLATES_DIR`, via `import.meta.url`). Equal versions:
report "already up to date," no filesystem writes. Different versions (including the missing
manifest case, gated by `--force`): perform the refresh described above.

### Pre-manifest workspaces require `--force`
An initialized workspace (`.openflow/` exists) with no `manifest.json` predates this feature.
Treating that silently as version `0.0.0` and proceeding would let `update` quietly rewrite
`.claude/skills/flow-*` and `.claude/commands/flow/` the first time a user upgrades and runs it -
surprising if they don't expect files to move. Requiring `--force` makes that first manifest-write
an explicit, acknowledged action. Once the manifest exists, subsequent `update` runs need no flag.

### `--version` flag
Implemented via `commander`'s built-in `program.version(pkg.version)`, reading the same
`package.json` `init.ts` already locates relative to `__dirname`. No workspace lookup involved -
`--version` works from any directory.

### Migration seam (deferred, not built)
`update`'s manifest gives a future change everything it needs to add data migrations: it can read
`manifest.cliVersion` as the "from" version and the running CLI's version as "to," and run any
migrations registered for versions in that range before writing the new manifest. This change adds
no migration registry or runner - only the version bookkeeping such a mechanism would need.

## Risks / Trade-offs

- **Skill renamed but old + new names collide with an unrelated user skill directory** -> Not
  fully preventable without a real skill-ownership marker Claude Code doesn't provide today; the
  `installedSkills` list is the best available signal and is strictly safer than the naive
  wipe-everything approach.
- **User had, in fact, hand-edited an installed skill/command file** -> Lost on `update`, by
  design decision (confirmed with user). Worth a note in the command's own help text /
  `flow-manage`-style docs so it isn't a silent surprise the first time someone hits it.
- **`--force` on a pre-manifest workspace still overwrites without a preview of what will
  change** -> Acceptable for v1; a `--check`/dry-run mode is a natural, additive follow-up if this
  turns out to matter in practice.
