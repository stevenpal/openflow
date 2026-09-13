---
name: flow-manage
description: Toggle a stream's syncable/static classification or remove it from the OpenFlow workspace. Use when the user wants to stop tracking updates to a stream, resume tracking it, or delete it from the workspace entirely.
allowed-tools: Bash(openflow:*)
user-invocable: false
---

Manage an existing stream's tracking state in this OpenFlow workspace.

**Input**: A request to toggle a stream between syncable/static, or to remove a stream.

**Steps**

1. **Read the ledger** with `openflow ledger get` and identify the target stream by id or by matching
   its `description`/`descriptor`. Ask for clarification if more than one entry plausibly matches.

2. **Toggling sync state**: run
   `openflow ledger update --id <id> --json '{"syncable": true|false}'`. Confirm the new state to the
   user. A stream switched to static will be skipped by the next `/flow:sync`; switched to syncable,
   it will be included.

3. **Removing a stream**: run `openflow ledger remove --id <id>`, then `openflow streams remove --id
   <id>` to delete that stream's local folder. This removal is local-only — it must never delete,
   modify, or otherwise touch the remote document, thread, or query the stream pointed to. If the
   stream is still referenced by a derived stream's `source_stream_ids`, `ledger remove` will reject
   the removal; report that to the user and ask whether to remove the dependent derived stream first.

**Guardrails**
- Never touch the remote resource on removal — only the local folder and ledger entry.
- Never write to the ledger file directly — always go through `openflow ledger update`/`remove`.
