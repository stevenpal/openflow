---
name: flow-ask
description: Deep research across all tracked streams in the OpenFlow workspace for a question that doesn't map to a single queue item. Use when the user asks a question that may span multiple tracked streams.
allowed-tools: Bash(openflow:*)
---

Answer a question by researching across every tracked stream in this OpenFlow workspace.

**Steps**

1. **Read the ledger** with `openflow ledger get` to see every tracked stream's `id`, `description`,
   and `intents`.

2. **Identify which streams are plausibly relevant** to the question by scanning `description` and
   `intents` first, then read each candidate's latest normalized snapshot
   (`openflow streams latest --id <id> --kind normalized`) for content that bears on the question.
   Don't assume the answer lives in a single stream — a question that doesn't map to one existing
   queue item is exactly the case this command exists for.

3. **Synthesize an answer** that draws on everything relevant found across those streams, citing
   which stream(s) each part of the answer came from.

**Guardrails**
- This is read-only research: it must not mutate the ledger or queue on its own. If the research
  surfaces something actionable, tell the user and let them decide whether to route it through
  `/flow:work` or `/flow:add`.
