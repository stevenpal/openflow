---
name: flow-sync
description: Refresh every syncable stream in the OpenFlow workspace, detect what changed, recompute affected derived streams, and turn findings into ledger intent updates and queue items. Use when the user wants to sync, refresh, or check for updates across tracked streams.
allowed-tools: Bash(openflow:*), Task
---

Sync every syncable stream in this OpenFlow workspace.

**Steps**

1. **Read the ledger**: `openflow ledger get`. Report any skipped invalid entries. Take the set of
   entries with `origin: source` and `syncable: true` as this sync's work list.

2. **Per-stream subagent dispatch (step required — do not diff streams yourself)**: for each
   syncable source stream, dispatch a subagent scoped to only that one stream. Give it: the stream's
   `id`, `descriptor`, `type`, and the path to its latest normalized snapshot
   (`openflow streams latest --id <id> --kind normalized`). The subagent must:
   - For a local-file source, run `openflow sync check-local-file --path <recorded path>` first; a
     non-zero exit means the file moved/renamed — skip straight to the failure case below with its
     reported reason.
   - Otherwise re-run the `descriptor`'s literal retrieval recipe exactly as written (resolving any
     relative dates via `openflow dates get-date`/`get-period-start`, never by hand). If the MCP
     server is unreachable, the credential is expired, or retrieval fails for any other reason,
     go to the failure case below with the specific cause — never guess at or silently work around it.
   - On successful retrieval, convert the result to normalized form the same way `/flow:add` did
     (Tier 1 adapter via `openflow normalize tier1`, or Tier 2 extraction via the shape's
     `openflow normalize tier2-template` + `openflow normalize cleanup`), store the new raw snapshot
     via `openflow streams snapshot --kind raw ...`, then report the outcome:
     `openflow sync report --id <id> --ext <ext> --from <normalized-file>` — this stores the new
     normalized snapshot (never overwriting the prior one) and returns a structured finding
     `{id, changed, addedLines, removedLines}`.
   - On a failure, report it the same structured way without writing a new snapshot:
     `openflow sync report --id <id> --ext <ext> --failure "<specific cause>"` — this leaves the
     stream at its last good snapshot and returns `{id, changed: false, failure}`.
   Collect every subagent's finding before moving on. One stream's failure must not block the others.

3. **Recompute affected derived streams** (main agent, not a subagent): for each `origin: derived`
   entry with `syncable: true`, check whether any of its `source_stream_ids` appear among the changed
   findings from step 2. If so, recompute it using its recorded `descriptor` the same way `/flow:add`
   computed it initially, store new raw+normalized snapshots, and diff/summarize the result the same
   way as a source stream's change — folding it into this sync's findings. Leave every other derived
   stream (no changed source, or `syncable: false`) untouched.

4. **Centralized synthesis (main agent only — never delegate this)**: for each changed finding,
   read that stream's current `intents` from the ledger and decide:
   - Does this finding sharpen an existing intent, represent a genuinely distinct new intent, or make
     an existing intent stale? Apply exactly one of those via
     `openflow intents apply --id <id> --op '{"kind":"sharpen"|"add"|"drop",...}'`.
   - Is this finding queue-worthy (needs a human decision/response) or does it not rise to that level?
     For queue-worthy findings, write an intent-focused item via
     `openflow queue add --json '{"heading":"...","streamLine":"...","intent":"...","body":"..."}'`
     — a short actionable heading, a **Stream** line (live URL if the stream type has one, else a
     link to its local folder), an **Intent** line naming the ledger intent it traces to, and a
     free-text body narrating the substance of what needs deciding.

5. **Report a sync summary**: streams synced, streams changed, streams failed (with cause), derived
   streams recomputed, intents updated, and queue items added.

**Guardrails**
- Per-stream pull + diff always happens in a subagent, never in the main sync agent.
- Intent matching, queue-worthiness, and `intents` rewrites always happen in the main agent, never in
  a per-stream subagent.
- Never drop a sync failure silently — always report the specific cause and continue with the rest.
- A static derived stream is never recomputed here, regardless of whether its sources changed.
