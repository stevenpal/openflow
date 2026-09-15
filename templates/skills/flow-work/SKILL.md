---
name: flow-work
description: Bring the OpenFlow queue into context grouped by intent, and work through items with scoped pre-work sync and in-place intent updates. Use when the user wants to resume work, see what needs a decision, or work through the queue.
allowed-tools: Bash(openflow:*), Task
user-invocable: false
---

Work through this OpenFlow workspace's queue.

**Steps**

1. **Bring the queue into context** with `openflow queue list`, which prints every item in full,
   document order. Read `references/intent-guidance.md`, then group the items yourself by the
   underlying goal/stake each item's intent serves — not by matching intent text (it's free-form and
   will rarely match exactly across items) and not by which stream an item came from. Items from
   different streams that feed the same goal belong in the same group; items from the same stream
   that serve different goals don't. Present that grouping to the user so they can resume cold even
   without having just run `/flow:add` or `/flow:sync` this session.

2. **When the user selects an item tied to a specific stream**, before acting:
   - Give a brief heads-up ("syncing <stream> first...") and run the **same per-stream subagent
     dispatch `/flow:sync` uses (its step 2)** for just that one stream — not a full workspace sync,
     and without asking for approval first (sync is non-destructive and versioned).
   - If the scoped sync finds a meaningful change, tell the user before proceeding — it may change
     the nature of the work — and offer to fold the change into the ledger/queue the normal way
     (same synthesis step `/flow:sync` uses) if it warrants that, or continue with the item as-is.
   - If the scoped sync fails, proceed against the stream's last good snapshot and tell the user why
     the refresh failed, rather than blocking the work.

3. **Act on the item** with the user — respond, decide, draft, whatever the item calls for.

4. **If working the item sharpens or changes why a stream matters**, rewrite that stream's `intents`
   in place: `openflow intents apply --id <id> --op '<json>'` (run `openflow intents apply --help`
   for the exact op JSON shape per kind) — the same edit/add/drop rule every other command uses,
   never an unconditional append.

5. **On resolution, remove the item** with `openflow queue remove --heading "<exact heading>"` by
   default (whether resolved here, or already handled elsewhere and now moot). Users may also edit,
   reorder, comment on, or delete items directly in `queue.md` at any time outside this flow.

**Guardrails**
- Pre-work sync is always scoped to the touched stream(s), never a full `/flow:sync`.
- Never skip the heads-up before a scoped sync, or the fold-in-or-continue check when it finds a
  change.
- Resolved items disappear from the queue by default.
- Grouping the queue by goal/stake is always the agent's own reasoning over the full item list, not
  a string match on the `Intent` field — `openflow queue list` never groups on its own.
