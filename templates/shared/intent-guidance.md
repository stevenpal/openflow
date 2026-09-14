# Writing a good intent

An intent is the reason a stream is being tracked — not a summary of what the stream contains. Two
different intents can point at the same stream, and one intent can draw on several streams; what
groups them is the reason, not the source.

**Shape: signal + stake.**

> \<what would make this stream worth surfacing> because \<the goal, deliverable, decision, or
> responsibility it feeds>

- **Signal** — the specific thing to watch for. Vague signals ("monitor for updates") never fire
  usefully; a good signal is concrete enough that a diff or a new message could plainly match or
  miss it.
- **Stake** — the downstream thing this feeds: a deliverable you own, a decision that's pending, a
  responsibility you hold. This is what makes the intent worth tracking at all, and it's the part
  that should stay stable even as the signal gets sharpened over time.

The stake is also the natural grouping key across streams. Different streams often share a stake —
a Slack channel, a PRD, and a Jira epic can all feed the same mobile-settings decision — even
though each one's signal looks nothing like the others. Group by stake when several intents serve
the same goal, not by matching intent text (it never matches exactly) and not by which stream an
item came from.

**Examples**

Weak: "Track the #sales-eng Slack channel."
Better: "Watch for chat-API questions or complaints surfacing in #sales-eng, because I own that
product's roadmap and these signal real gaps."

Weak: "Monitor competitor pricing page."
Better: "Watch for pricing/packaging changes on Acme's site, because it puts them in the
competitive set for the launch I'm driving product marketing for."

Weak: "Track the Q4 PRD."
Better: "Track scope and requirement changes in the Q4 AI load-balancing/DR PRD, because it's the
spec I'm accountable for delivering against this quarter."

Weak: "Watch the #mobile-design channel."
Better: "Watch #mobile-design for decisions on the new settings section, because they'll change
both the PRD I'm writing and the Jira epic I'm drafting for next sprint." (Note the shared stake
with the PRD/epic streams above — that's what should pull all three together when the queue is
worked, not that they mention "mobile" in common.)

**Keeping intents current**

Intents are living text, not a label set once at add time. As work evolves:
- **Sharpen** an intent when a finding narrows or clarifies it without changing what it's *for*.
- **Add** a distinct intent when a stream turns out to serve a genuinely separate goal alongside
  its existing one(s) — don't overwrite what's still true to make room for what's new.
- **Drop** an intent once its stake is resolved or no longer applies — a stale intent left in place
  produces a stale queue.

There's no fixed vocabulary of intent categories, and there shouldn't be — the goals a workspace
serves are as varied as the person running it. What stays fixed is the shape (signal + stake), not
the words.
