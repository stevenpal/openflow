## Context

See proposal.md - Why. The nine non-`local-file` adapters were written against invented payload
shapes, never validated against a real tool response. Two were spot-checked directly: Slack's MCP
thread-read tool returns a single pre-formatted text blob with `===`/`---` delimiters, not the
`{messages: [...]}` array `slack` assumes; Google Drive's MCP `read_file_content` returns Markdown-ish
`fileContent` plus a `commentThreads` array whose anchor IDs aren't joined to inline text, not the
`{title, body: [...], comments: [...]}` shape `google-docs` assumes. Both are MCP tools explicitly
optimized to be LLM-readable, with no versioned schema commitment — the vendor is free to reword or
restructure output at any time. The other seven adapters (`google-sheets`, `google-slides`, `gmail`,
`rest-api`, `otter-transcript`, `linear`, `web-article`) were never checked at all and are assumed to
have the same problem; no bundled fetch/parse utility backs `web-article` either.

The tenth adapter, `local-file`, is not the same kind of problem but turns out not to earn its keep
either: `adaptLocalFile` (`{path, content} → {path, content}`) and `renderPlainText`
(`canonical.content`) are both identity functions. Nothing is transformed. The only real effect of
routing a text-shaped local file through "the `local-file` adapter" was bypassing the shared
agent-extraction `cleanup()` pass — which is a shape-level fidelity requirement (plain-text content
must stay byte-for-byte), not something that has anything to do with the file being local, or being
read through an "adapter."

## Goals / Non-Goals

**Goals:**
- Stop presenting nine unverified, likely-broken adapters as a deterministic, trustworthy path.
- Recognize that `local-file` never contributed a real deterministic transformation, and stop
  conflating a stream's access mechanism (local file, URL, MCP tool) with its shape's normalization
  rules — access mechanism is a retrieval-step concern, handled by whichever tool the agent uses to
  fetch content and recorded in the ledger's `descriptor` field; it has no bearing on how a shape
  normalizes.
- Collapse the two-path (deterministic/agent) model to a single agent-extraction pipeline now that
  no stream genuinely qualifies for a deterministic-adapter path, and delete the adapter/renderer
  machinery (`ADAPTERS`, `AdapterRegistration`, `openflow normalize tier1`/`deterministic`,
  `RENDERERS`, the canonical-shape types that fed them) that would otherwise sit registered with
  nothing real behind it.
- Preserve the one real invariant `local-file` protected — byte-for-byte fidelity for plain-text
  content — as an explicit plain-text-shape exception to the shared clean-up step, so code/config
  files aren't silently mangled by clean-up's prose-oriented normalizations (bullet-marker rewriting,
  heading spacing) regardless of how that content was retrieved.
- Give `flow-add` an explicit, content-based test for choosing among the ten shapes, and a
  single-source, CLI-retrievable shape menu (`openflow normalize shapes`) so the skill never
  hardcodes a shape-name-plus-description list that can drift silently from `StreamShape`.

**Non-Goals:**
- Building any new deterministic converter (CSV/JSON parsers, a bundled web fetch+readability/turndown
  utility, a PDF text-layer extractor). These are legitimate future deterministic-extraction
  candidates but are separate, additive changes with their own design questions (which library, how
  it's invoked, how it's tested) that shouldn't block fixing the current misclassification.
- Re-verifying every removed adapter's real MCP shape and writing a corrected deterministic adapter
  for it. That's the same additive follow-up as above, not a rename/cleanup.
- Any change to the canonical shapes' *target formats* (what `openflow normalize template --shape`
  prints) or to the plain-text shape's own definition — this change only removes the
  adapter/renderer machinery and the now-unnecessary "deterministic path" concept, not what a shape's
  normalized output looks like.

## Decisions

**Delete all ten adapters (not just the nine unverified ones) rather than keep any of them as
unregistered reference code.** The nine were never correct (invented shapes, unverified); `local-file`
was correct but contentless (identity in, identity out). Keeping any of them around — as adapters —
implies a false starting point for a future "add the real deterministic adapter back" change: that
change should derive a real payload shape from an actual verified tool response and decide fresh
whether a genuine transformation is worth the machinery, not resume from code that either was wrong
from the start or never did anything. Git history remains recoverable if useful later.

**Collapse to a single agent-extraction pipeline; there is no deterministic-extraction path left.**
Once the nine unverified adapters are gone and `local-file` is recognized as doing no transformation,
nothing in the codebase satisfies "openflow owns retrieval and transformation end-to-end, with a
transformation actually happening." Keeping `ADAPTERS`/`RENDERERS`/the `deterministic` CLI command
registered with zero real entries is exactly the same "false starting point" problem as keeping the
nine adapters around — so it's removed now, not left as scaffolding for a hypothetical future
adapter. A future change that adds a real deterministic converter reintroduces whatever machinery it
actually needs, scoped to that converter.

**Plain-text-shaped content skips the shared clean-up step; this is a shape rule, not a
transport/adapter rule.** Byte-for-byte fidelity matters for plain-text content (code/config)
regardless of whether it was retrieved from a local file, a URL, or an MCP tool — clean-up's
prose-oriented normalizations are unsafe for any of those, and safe for none of them by virtue of
being "local." Stating the exception at the shape level (in the pipeline requirement) rather than at
the adapter/transport level is what actually generalizes correctly.

**No new "content-type detector" utility is built to decide plain-text-eligible vs. not.** Recognizing
that retrieved content is plain text/code/config (vs., say, a PDF that needs agent judgment to
extract into some other shape's template) remains a classification the agent makes when it retrieves
the content — this was already true under the old `local-file`-scoping decision, and it's unchanged
by removing the adapter: the judgment call moves from "is this file eligible for the `local-file`
adapter" to "is this stream's shape plain-text," but it's still the agent doing the same kind of
look-at-the-content call, not new deterministic code.

**Terminology: retire "Tier 1"/"Tier 2" and "deterministic-extraction"/"agent-extraction" both — there
is only one pipeline now.** The tier names never carried information about *why* a path was
deterministic; the deterministic-extraction name became moot once no stream qualified for it. CLI
commands, skill prose, and spec text now describe a single agent-extraction pipeline with one
shape-level exception, with no "which path" branch to name at all.

**Shape-selection criteria and the shape menu live in one implementation-owned source, retrieved via
CLI, not restated in the skill.** Same reasoning already applied to the target templates
(`openflow normalize template --shape`): a `Record<StreamShape, string>` constant gets
compiler-enforced exhaustiveness, and a `openflow normalize shapes` command means the skill never
carries its own copy of the shape list that could silently diverge from `StreamShape`. The
content-based classification *principle* (never source/access-mechanism-based) still belongs in the
spec's "Supported stream shapes" requirement, since that's the requirement's actual content — but the
enumerated menu-with-descriptions is data, not requirements prose, and lives in code.

## Risks / Trade-offs

- [Existing normalized snapshots for streams added via a now-removed adapter (including `local-file`)
  look like they came from a trustworthy deterministic path but didn't, or came from a path that no
  longer exists] → No retroactive snapshot migration in this change; the risk already existed for the
  nine unverified adapters, and for `local-file` the byte-for-byte output is unchanged by this change
  (still byte-for-byte, just no longer via an "adapter"). A future resync renormalizes via the single
  pipeline and produces a new snapshot on the correct path.
- [Removing adapters/renderers is a breaking change for any external code importing from
  `src/normalize/adapters/*` or `src/normalize/render.ts`] → None of these are exported from a public
  package entry point; internal usage only, so the CLI/skill updates in this change cover every call
  site. Tests that imported `RENDERERS`/canonical types directly to test them
  (`tests/normalize-render.test.ts`, `tests/normalize-richtext-sections.test.ts`) are removed along
  with the code they tested.
- [Deleting `RENDERERS` also deletes `TARGET_FILE_EXTENSION`'s current home] → Relocate
  `TARGET_FILE_EXTENSION` to the renamed templates module alongside `SHAPE_DESCRIPTIONS`; it's still
  needed to name each shape's snapshot file extension and has no dependency on the deleted renderers.

## Migration Plan

No data migration. Streams previously added through a removed adapter (including `local-file`) keep
their existing raw/normalized snapshots untouched; their next sync renormalizes via the single
agent-extraction pipeline going forward, with plain-text streams still landing byte-for-byte. No
rollback concerns beyond reverting the code/spec/skill changes together, since nothing depends on the
old CLI command names or tier/deterministic-extraction terminology outside this repo.
