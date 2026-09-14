## MODIFIED Requirements

### Requirement: Supported stream shapes
The system SHALL classify every stream into one of a fixed, small set of content shapes (chat/
messaging, structured rich-text document, tabular/spreadsheet, presentation, web page, email,
query/API result, audio/video transcript, project/task tracker item, plain text/code/config) rather
than one bespoke type per source application, and SHALL render each shape into a fixed target
normalized format (e.g. Markdown transcript, CSV, JSON) specific to that shape.

Shape selection SHALL be a content-based judgment — what the retrieved content actually is — never a
lookup keyed on the stream's access mechanism (local file, URL, MCP tool, or otherwise) or which
source application it came from. The current shape menu and each shape's one-line selection
description SHALL be available from a single implementation-owned source (not restated independently
elsewhere), so adding or removing a shape cannot leave any other description of the menu stale.

#### Scenario: Classifying a new source of an existing shape
- **WHEN** a stream comes from a chat-style source not previously supported (e.g. a new messaging
  app)
- **THEN** it SHALL be classified into the existing chat/messaging shape and rendered into that
  shape's Markdown transcript format, rather than requiring a new shape

#### Scenario: Ambiguous or mixed content
- **WHEN** a stream's content plausibly fits more than one shape (e.g. a task tracker item that also
  carries a comment thread)
- **THEN** it SHALL be classified by its primary content type, with secondary facets (e.g. comments)
  captured within that shape's target template rather than triggering a different shape
  classification

#### Scenario: Classification is independent of access mechanism
- **WHEN** two streams have the same content shape but different access mechanisms (e.g. a chat
  transcript read from a local file vs. one retrieved through an MCP tool)
- **THEN** both SHALL be classified into the same shape and normalized via the same target template;
  the access mechanism SHALL have no bearing on shape classification

### Requirement: Agent-extraction normalization pipeline
The system SHALL normalize every stream through a single pipeline: the agent extracts content
verbatim and in reading order into the stream's shape's fixed target template — without summarizing
or rephrasing — regardless of the stream's access mechanism (local file, URL, MCP-backed tool, or
otherwise). There is no separate deterministic-adapter path; how a stream's content was retrieved is
an access-mechanism concern handled entirely by the retrieval step, not a normalization-pipeline
concern.

For every shape except plain-text, the verbatim-extracted result SHALL then pass through a
deterministic clean-up step shared across all sources of that shape, normalizing incidental
formatting noise (trailing whitespace, bullet-marker variance, blank-line runs, heading spacing)
without altering the extracted wording.

Plain-text-shaped content (plain text, code, or config where byte-for-byte fidelity matters) SHALL be
copied byte-for-byte into the normalized snapshot and SHALL NOT pass through the shared clean-up step:
clean-up's prose-oriented normalizations (rewriting bullet markers, adjusting heading spacing) can
alter code or config semantics rather than merely tidying formatting.

#### Scenario: Verbatim extraction for every stream
- **WHEN** any stream is normalized, regardless of its access mechanism
- **THEN** normalization SHALL use agent verbatim extraction into that shape's fixed target template,
  and SHALL NOT summarize or rephrase the extracted content

#### Scenario: Non-plain-text shape gets clean-up
- **WHEN** a stream's shape is anything other than plain-text
- **THEN** its verbatim-extracted content SHALL pass through the shared clean-up step before being
  stored as the normalized snapshot

#### Scenario: Plain-text shape skips clean-up
- **WHEN** a stream's shape is plain-text (e.g. a code or config file)
- **THEN** its extracted content SHALL be stored byte-for-byte as the normalized snapshot, and SHALL
  NOT pass through the shared clean-up step
