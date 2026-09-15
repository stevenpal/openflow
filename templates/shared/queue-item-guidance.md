# Writing a good queue item

A queue item is a flag that something needs a human decision or response — not a log of what
changed. Only write one when a finding actually rises to that level; most findings are folded into
`intents` and nothing else.

**Fields**

- **heading** — a short, actionable title naming the decision itself, not the stream or the event.
  Someone scanning just the headings should be able to tell what's being asked of them.
  - Weak: "Slack thread updated"
  - Better: "Decide whether the settings redesign ships before or after the mobile freeze"
- **streamLine** — how to get back to the source: the live URL if the stream type has one (a Slack
  thread link, a doc link), otherwise a link to the stream's local workspace folder. Never a bare
  description — it must be something the reader can click or open.
- **intent** — the exact ledger intent (see `references/intent-guidance.md`) this item traces back
  to, not a paraphrase. This is what lets someone see why the item exists and lets related items
  group by shared intent later.
- **body** — free text narrating the substance of what needs deciding: what changed, why it
  matters given the intent, and what the actual decision or response is. Write enough that the
  reader doesn't have to open the stream just to understand the ask; leave the deciding itself to
  them.
  - Weak: "New message in the thread, take a look."
  - Better: "The thread now has a reply proposing Sept 20 instead of Sept 15 for the settings
    launch. That's after the mobile freeze this intent is tracking — confirm whether the freeze
    date moves too or the launch stays put."

**When to write one**

Write a queue item only when the finding needs a person to decide or respond — a proposed date
change, an open question, a conflict between two streams' intents. A finding that's purely
informational, already resolved, or that only sharpens an intent's wording doesn't need a queue
item on top of the intent update.
