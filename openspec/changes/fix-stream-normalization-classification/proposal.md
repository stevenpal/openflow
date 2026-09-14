## Why

The normalization pipeline's "adapter available" vs. "no adapter" split doesn't track reality: every
non-local adapter (`slack`, `google-docs`, `google-sheets`, `google-slides`, `gmail`, `rest-api`,
`otter-transcript`, `linear`, `web-article`) was written against a hand-invented payload shape that
was never checked against a real tool response. Spot-checks against the actual Slack and Google
Drive MCP tools show both return agent-optimized text/markdown with no stable, versioned contract —
not the clean structured JSON each adapter assumes. There is also no bundled fetch/parse utility
backing `web-article`.

The tenth adapter, `local-file`, isn't actually a counterexample: `adaptLocalFile` maps
`{path, content} → {path, content}` and `renderPlainText` returns `canonical.content` unchanged —
both are identity functions, so "the `local-file` adapter" does no transformation at all. It only
ever earned its keep by skipping the shared agent-extraction clean-up pass, which is tuned for prose
(rewriting bullet markers, adjusting heading spacing) and would otherwise corrupt code/config
semantics. Framing that as an "adapter" conflates two unrelated things: a stream's *access
mechanism* (local file, URL, MCP tool — captured in the ledger's `descriptor` field and handled by
whatever tool the agent uses to retrieve it) and its *shape's* fidelity requirement (plain-text
content needs byte-for-byte preservation). The "Tier 1/Tier 2" naming reinforces the wrong mental
model for both problems: it suggests normalization branches on "does a file exist for this source
name?" or "is there an adapter?" when what actually varies is a single, shape-level property (does
this shape's clean-up pass preserve or alter meaning?).

Once the nine unverified adapters are gone and `local-file` is recognized as contributing no real
transformation, there is no remaining stream for which a deterministic adapter+renderer path does
anything a plain verbatim copy wouldn't. There is no reason to keep that machinery (`ADAPTERS`,
`AdapterRegistration`, the `openflow normalize tier1`/`deterministic` command, the shape-keyed
`RENDERERS` in `src/normalize/render.ts`, and the canonical-shape types in `src/normalize/types.ts`
that exist only to feed them) registered and callable with nothing behind it — that's the same
"false starting point for a future change" problem this change already avoids by deleting the nine
adapters outright rather than leaving them unregistered.

Separately: the skill and the main spec's "Supported stream shapes" requirement each just name the
ten shapes with no criteria for choosing among them, and no guidance on how to fetch a shape's target
template. `src/normalize/tier2-templates.ts` already holds the canonical target template for every
shape; nothing surfaces an equivalent canonical list of shape *descriptions* the same way, so the
skill was about to hardcode a shape-name-plus-description list that can drift silently the moment a
shape is added or removed from `StreamShape`.

## What Changes

- **BREAKING**: Remove all ten normalization adapters (`slack`, `google-docs`, `google-sheets`,
  `google-slides`, `gmail`, `rest-api`, `otter-transcript`, `linear`, `web-article`, and
  `local-file`) and the adapter/renderer machinery built to run them: `src/normalize/adapters/*`,
  `ADAPTERS`, `AdapterRegistration`, `src/normalize/render.ts`'s shape-keyed `RENDERERS`, and the
  canonical-shape interfaces in `src/normalize/types.ts` that existed only to feed those renderers.
- **BREAKING**: Collapse the two-path "deterministic-extraction" / "agent-extraction" model into a
  single agent-extraction pipeline for every stream, regardless of shape or access mechanism (local
  file, URL, MCP tool, or otherwise). Access mechanism is retrieval-step concern only; it has no
  bearing on normalization.
- Add a plain-text-shape exception to that single pipeline: plain-text content (code/config/plain
  text where byte-for-byte fidelity matters) is copied byte-for-byte and SHALL skip the shared
  clean-up step, since clean-up's prose-oriented normalizations can alter code/config semantics.
  Every other shape still runs through clean-up as before.
- **BREAKING**: Remove the `openflow normalize tier1`/`deterministic` CLI command entirely (nothing
  will be registered to run through it). Rename `openflow normalize tier2-template` to
  `openflow normalize template --shape <shape>` now that there is no "tier 2" to contrast it with.
- Add `openflow normalize shapes`, backed by a new `SHAPE_DESCRIPTIONS: Record<StreamShape, string>`
  constant (colocated with the renamed template constant, using the same `Record<StreamShape, _>`
  compiler-enforced-exhaustiveness pattern), printing the current shape menu with a one-line
  selection description for each. This is the single source the skill reads instead of hardcoding a
  shape list that can drift from `StreamShape`.
- Update the `flow-add` skill's normalization step to the single-pipeline model: call
  `openflow normalize shapes` to see the live shape menu, pick one by content, call
  `openflow normalize template --shape <shape>` for that shape's target template, extract verbatim,
  and run `openflow normalize cleanup` for every shape except plain-text (plain-text is written
  directly as both raw and normalized snapshot).
- Out of scope: building any new deterministic converters (CSV/JSON parsers, a bundled web
  fetch+readability/turndown utility, a PDF text-layer extractor). If a future change finds a real,
  openflow-owned retrieval/transform path worth adding deterministic handling for, it reintroduces
  adapter-style machinery then, scoped to what it actually needs — not by reviving what this change
  removes.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `stream-normalization`: replaces the "Two-tier conversion pipeline" requirement (adapter
  available/no adapter framing, deterministic-extraction eligibility test) with a single
  "Agent-extraction normalization pipeline" requirement, including the plain-text clean-up
  exception. Also updates "Supported stream shapes" with a content-based (not access-mechanism-based)
  classification principle, an ambiguous/mixed-content tie-breaker, and a requirement that the shape
  menu and its descriptions live in one implementation-owned source rather than being restated
  independently.

## Impact

- `src/normalize/adapters/*.ts` and `src/normalize/adapters/index.ts` — delete entirely.
- `src/normalize/render.ts` — delete the shape-keyed `RENDERERS`; relocate `TARGET_FILE_EXTENSION`
  (still needed for naming stream snapshots) to the renamed templates module.
- `src/normalize/types.ts` — remove the canonical-shape interfaces (`ChatCanonical`, etc. and
  `CanonicalByShape`) that existed only to feed the deleted renderers/adapters.
- `src/normalize/tier2-templates.ts` — rename (e.g. to `src/normalize/extraction-templates.ts`),
  drop "tier2" from its exported constant's name, and add the new `SHAPE_DESCRIPTIONS` constant.
- `src/cli.ts` — remove the `normalize tier1`/`deterministic` command; rename `tier2-template` to
  `template`; add the `shapes` command; update `cleanup`'s framing/description.
- `templates/skills/flow-add/SKILL.md` — rewrite the normalization step (currently step 3) to the
  single-pipeline model described above.
- `tests/normalize-adapters.test.ts`, `tests/normalize-render.test.ts`,
  `tests/normalize-richtext-sections.test.ts` — remove (they test the deleted adapters/renderers).
- `openspec/specs/stream-normalization/spec.md` — delta per Modified Capabilities above.
