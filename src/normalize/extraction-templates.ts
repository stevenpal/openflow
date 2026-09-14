import type { StreamShape } from "../ledger/types.js";

/**
 * Verbatim-extraction instructions per shape. The agent extracts content verbatim, in reading
 * order, straight into the shape's fixed target template below — never summarizing or
 * rephrasing — and the result is then run through `cleanup()` (except for plain-text) before
 * being stored as the normalized snapshot.
 */
export const EXTRACTION_TEMPLATE: Record<StreamShape, string> = {
  chat: [
    "Extract every message verbatim, in the order they appear, one per block:",
    "**<author>** _<timestamp>_",
    "<message text, verbatim>",
    "Do not summarize, merge, or reorder messages. Preserve thread groupings if the source shows them.",
  ].join("\n"),
  "rich-text": [
    "Extract the document's ACCEPTED content only (ignore pending suggested edits) as a `# <title>`",
    "heading followed by its paragraphs/headings/bullets/code blocks verbatim, in reading order.",
    "Then add a `## Comments` section listing every comment as `- On \"<anchored text>\" — <author>",
    "(<timestamp>): <comment text>`.",
    "Then add a `## Pending Suggestions` section listing every unaccepted suggested edit the same",
    "way, describing what it proposes. Never fold a pending suggestion into the body.",
  ].join("\n"),
  tabular: [
    "Extract every row verbatim as CSV: header row first, then one data row per line, in the",
    "sheet's existing row order. Quote any cell containing a comma, quote, or newline.",
  ].join("\n"),
  presentation: [
    "For each slide in order, extract `## Slide <n>: <title>` followed by its bullets verbatim,",
    "then `_Notes: <speaker notes>_` if present. Do not summarize bullet text.",
  ].join("\n"),
  "web-page": [
    "Extract `# <title>`, the source URL, publish date if shown, then every body paragraph",
    "verbatim in reading order. Skip navigation chrome, ads, and related-article links.",
  ].join("\n"),
  email: [
    "For each message in the thread, oldest first, extract `## <subject>` then From/To/Date",
    "metadata lines, then the message body verbatim below a blank line. Separate messages with",
    "`---`.",
  ].join("\n"),
  "query-result": [
    "Extract the result set verbatim as JSON: `{ \"source\": <query or endpoint description>,",
    "\"records\": [...] }`, preserving every field and record exactly as returned.",
  ].join("\n"),
  transcript: [
    "Extract `# <title>` then every utterance verbatim as `[<start offset>] **<speaker>:** <text>`,",
    "in chronological order. Do not paraphrase or drop filler/cross-talk the transcript captured.",
  ].join("\n"),
  "task-item": [
    "Extract `# <title>`, `**Status:** <status>`, `**Assignee:** <assignee>` if set, then the",
    "description verbatim, then a `## Comments` section listing every comment as",
    "`- <author> (<timestamp>): <comment text>`.",
  ].join("\n"),
  "plain-text": ["Copy the file's content verbatim, byte-for-byte where possible. Do not reformat."].join(
    "\n",
  ),
};

/** One-line, content-based selection description for each shape, printed by `openflow normalize shapes`. */
export const SHAPE_DESCRIPTIONS: Record<StreamShape, string> = {
  chat: "Chat/messaging: a sequence of authored messages, e.g. a Slack thread or IM conversation.",
  "rich-text": "Structured rich-text document: headings/paragraphs/bullets with comments and suggestions, e.g. a Google Doc.",
  tabular: "Tabular/spreadsheet: rows and columns of data, e.g. a Google Sheet or CSV export.",
  presentation: "Presentation: a sequence of slides with bullets and speaker notes, e.g. a Google Slides deck.",
  "web-page": "Web page: an article or page's title, URL, and body paragraphs.",
  email: "Email: one or more messages with subject/from/to/date headers and a body.",
  "query-result": "Query/API result: a structured record set returned by a query or API call.",
  transcript: "Audio/video transcript: timestamped utterances attributed to speakers.",
  "task-item": "Project/task tracker item: a ticket or issue with status, assignee, description, and comments.",
  "plain-text": "Plain text/code/config: content where byte-for-byte fidelity matters and no reformatting is safe.",
};

export const TARGET_FILE_EXTENSION: Record<StreamShape, string> = {
  chat: "md",
  "rich-text": "md",
  tabular: "csv",
  presentation: "md",
  "web-page": "md",
  email: "md",
  "query-result": "json",
  transcript: "md",
  "task-item": "md",
  "plain-text": "txt",
};
