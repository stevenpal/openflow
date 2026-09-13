---
name: flow-add
description: Add a new source or derived stream to the OpenFlow workspace ledger. Use when the user wants to start tracking a file, URL, description of a resource (Slack thread, Google Doc, query, etc.), or a computation derived from existing streams.
allowed-tools: Bash(openflow:*)
user-invocable: false
---

Add a new stream (source or derived) to this OpenFlow workspace.

**Input**: A file, a URL, or a description of what to track (e.g. "the #eng-oncall Slack channel from
the last 7 days", "our Q1 roadmap doc because Legal keeps changing the launch date"), or a request to
derive a new stream from existing ones.

**Steps**

1. **Read the current ledger** with `openflow ledger get` so you know existing stream ids (for
   uniqueness and for picking `source_stream_ids` on a derived add) and can spot an existing stream
   this add might overlap with. Report (don't silently ignore) any entries `get` lists as skipped.

2. **Determine origin: source vs. derived.**
   - **Source**: content pulled from somewhere external (file, URL, MCP-backed query/description).
   - **Derived**: a transformation computed from one or more existing streams whose `origin` is
     `source`. Reject (and tell the user) any attempt to derive from another derived stream — derived
     streams are one level deep only.

3. **For a source stream: retrieve the content now**, using whatever tool is appropriate (Read for a
   local file, WebFetch for a URL, an MCP tool for a described resource). Then:
   - Pick this stream's **shape** — one of: chat, rich-text, tabular, presentation, web-page, email,
     query-result, transcript, task-item, plain-text.
   - Convert the raw payload into that shape's normalized form:
     - **Tier 1 (adapter exists)**: write the raw payload as JSON to a temp file, then run
       `openflow normalize tier1 --adapter <name> --from <file>` (adapters: slack, google-docs,
       google-sheets, google-slides, web-article, gmail, rest-api, otter-transcript, linear,
       local-file) and use its stdout as the normalized content.
     - **Tier 2 (no adapter yet)**: run `openflow normalize tier2-template --shape <shape>` and
       extract the content verbatim, in reading order, into that exact template — never summarize or
       rephrase. Write your extraction to a temp file and run
       `openflow normalize cleanup --from <file>` to get the final normalized content.
   - Store both snapshots (never overwrite a prior version):
     `openflow streams snapshot --id <id> --kind raw --ext <ext> --from <raw-file>` and
     `openflow streams snapshot --id <id> --kind normalized --ext <ext> --from <normalized-file>`.

4. **For a derived stream**: capture the source stream id(s) it's computed from and the exact
   transformation recipe as its `descriptor`. Compute it once now the same way `/flow:sync` will
   later recompute it, and store its raw+normalized snapshots the same way as step 3.

5. **Classify static vs. syncable** (source streams; derived streams default `syncable: true`):
   Run `openflow classify default --shape <shape> [--local-file] [--override true|false]` — pass
   `--override` only when the user's prompt explicitly expresses tracking intent (e.g. "track this
   over time", "keep this updated" -> `true`; "just a reference" -> `false`); omit it to take the
   type default. Use the command's `syncable` result for the ledger entry and show its `note` to the
   user verbatim — always, whether the classification came from the default or an override. Do not
   block on a classification question — pick the default/override and move on.
   - A local file (`--local-file`) defaults to **static**. Never present its workspace snapshot as
     the copy to edit — the user keeps editing the real file at its recorded path.

6. **Write the descriptor as a literal, complete recipe** — the exact retrieval call you actually
   just executed (exact MCP server/tool/parameters), or the exact transformation steps for a derived
   stream — never a paraphrase of the user's request.
   - Relative date parameters (e.g. "last 7 days") must stay relative in the descriptor's prose, not
     frozen as the absolute dates you happened to compute today. State inclusive/exclusive endpoints
     and timezone explicitly (UTC if unstated). Compute any relative dates you need right now via
     `openflow dates get-date --anchor <date> --offset-days <n>` or
     `openflow dates get-period-start --unit <day|week|month|quarter|year> [--date <date>]` — never by
     hand — and write the descriptor's prose in terms of these same primitives so a later sync
     resolves it identically.

7. **Add the ledger entry**:
   ```
   openflow ledger add --json '{"id":"...","descriptor":"...","type":"...","origin":"source|derived","source_stream_ids":[...],"syncable":true|false,"description":"...","intents":["..."],"added_at":"<ISO now>"}'
   ```
   Seed `intents` from whatever context the user gave for why this stream matters. If nothing was
   said, leave it as a single short entry inferred from the content itself.

8. **Immediate action on actionable content**: if what you just retrieved clearly implies something
   actionable right now (e.g. a meeting transcript with a follow-up action item), offer to act on it
   immediately — a direct edit to an affected stream's `intents`
   (`openflow intents apply --id <id> --op '{"kind":"add"|"sharpen"|"drop",...}'`) and/or a new queue
   item via
   `openflow queue add --json '{"heading":"...","streamLine":"...","intent":"...","body":"..."}'`
   — rather than only waiting for a future `/flow:sync`.

**Guardrails**
- Never write to the ledger file directly — always go through `openflow ledger add`/`update`.
- Reject (and explain) a derived-stream add whose `source_stream_ids` includes anything not
  `origin: source`.
- Don't skip the classification confirmation note, even when the classification seems obvious.
- Don't freeze a relative descriptor into absolute dates.
