## 1. Remove all adapter/renderer machinery

- [ ] 1.1 Delete `src/normalize/adapters/{slack,google-docs,google-sheets,google-slides,gmail,rest-api,otter-transcript,linear,web-article,local-file}.ts` and `src/normalize/adapters/index.ts` (`ADAPTERS`, `AdapterRegistration`) entirely
- [ ] 1.2 Delete the shape-keyed `RENDERERS` export and its per-shape render functions from `src/normalize/render.ts`; relocate `TARGET_FILE_EXTENSION` to the renamed templates module (task 2.2) since it's still needed to name snapshot file extensions
- [ ] 1.3 Remove the canonical-shape interfaces (`ChatCanonical`, `RichTextCanonical`, etc. and `CanonicalByShape`) from `src/normalize/types.ts` that existed only to feed the deleted renderers/adapters; verify the project typechecks with no dangling imports
- [ ] 1.4 Delete `tests/normalize-adapters.test.ts`, `tests/normalize-render.test.ts`, and `tests/normalize-richtext-sections.test.ts` (they test the deleted adapters/renderers); verify the remaining suite passes

## 2. Simplify the CLI to a single agent-extraction pipeline

- [ ] 2.1 Remove the `openflow normalize tier1`/`deterministic` command and its `--adapter` flag entirely from `src/cli.ts`
- [ ] 2.2 Rename `src/normalize/tier2-templates.ts` (e.g. to `src/normalize/extraction-templates.ts`), drop "tier2" from its exported constant's name, and rename the CLI's `tier2-template` command to `openflow normalize template --shape <shape>`
- [ ] 2.3 Add a `SHAPE_DESCRIPTIONS: Record<StreamShape, string>` constant (colocated with the renamed template constant) giving each shape's one-line, content-based selection description, and wire up `openflow normalize shapes` to print the full menu (shape name + description) from it
- [ ] 2.4 Update `openflow normalize cleanup` (or its call site in the skill — confirm which) so plain-text-shaped content is never run through the shared clean-up pass; plain-text extraction writes its content byte-for-byte as the normalized snapshot instead
- [ ] 2.5 Search the repo for remaining "tier1"/"tier 1"/"Tier 1"/"tier2"/"Tier 2"/"deterministic-extraction"/"agent-extraction" references outside `openspec/changes/` and update or remove each — there is only one pipeline now, so it needs no name that implies a choice between two

## 3. Update the `flow-add` skill

- [ ] 3.1 Rewrite `templates/skills/flow-add/SKILL.md` step 3's normalization instructions to the single-pipeline model: retrieve content, run `openflow normalize shapes` to see the live shape menu and pick one by content, run `openflow normalize template --shape <shape>` for that shape's target template, extract verbatim, then run `openflow normalize cleanup` for every shape except plain-text (plain-text is written directly, byte-for-byte, as both raw and normalized snapshot)
- [ ] 3.2 Verify the skill no longer names any adapter, "tier", or "deterministic-extraction"/"agent-extraction" path, and no longer hardcodes the shape list or its descriptions

## 4. Sync the specs

- [ ] 4.1 Confirm `openspec/changes/fix-stream-normalization-classification/specs/stream-normalization/spec.md` replaces "Two-tier conversion pipeline" with the single "Agent-extraction normalization pipeline" requirement (including the plain-text clean-up exception) and updates "Supported stream shapes" with the content-based/access-mechanism-independent classification principle and the single-source shape-menu requirement
- [ ] 4.2 Run `openspec validate --changes fix-stream-normalization-classification --strict` and confirm it passes before implementation is considered complete
