# OpenSeria Design Session: Verbatim Conversation Transcript

**Date:** September 2, 2026
**Agent:** Claude (Claude Code, explore mode)
**Topic:** Continuation of the open-source Business SDD / Intent Engine concept from
`open-business-sdd-gemini-20260831.md`, narrowing toward a concrete architecture and initial UX
for the project now named **OpenSeria**.

**Note:** This is a verbatim capture of the user/assistant dialogue text. Tool invocations (file
reads, shell commands run to inspect the repo) are not reproduced — only what was said.

---

## Turn 1

### User Prompt

I did a pretty detailed exploration of an idea to create an open source package that lets knowledge workers maintain the flow of their work across multiple sessions with an AI agent in a totally secure, local, private way.  It's outined in @sources/open-business-sdd-gemini-20260831.md .  Can you take a look at that as background and then help me get started with thinking through what I should do next.

### Assistant Response

Read through the whole transcript. This is a genuinely well-formed concept — twelve turns of real back-and-forth that converged on some sharp, non-obvious decisions. Let me reflect back where it landed, then poke at what's still soft.

#### Where the thinking converged

```
+------------------+     +-------------------+     +------------------+
|  TRACKED ITEMS   |     |   INTENT ENGINE    |     |  HOST AGENT      |
|  (flat, no       | --> |  (skills+scripts,  | --> |  (Claude Code,   |
|  forced projects)|     |   local, no MCP    |     |   Cursor, etc.   |
|                  |     |   server, no       |     |   -- brings its  |
|  - Google Docs   |     |   custom harness)  |     |   own MCP conns) |
|  - Slack threads |     +-------------------+     +------------------+
|  - PDFs/emails   |              |
|  - local .md     |              v
+------------------+     +-------------------+
                          |  RAW SNAPSHOTS    |
                          |  + silent local   |
                          |  versioning for   |
                          |  diffing          |
                          +-------------------+
                                   |
                                   v
                          +-------------------+
                          | QUEUE.md (deltas  |
                          | as actionable     |
                          | work items)       |
                          +-------------------+
```

Four commands did all the work by turn 12: `track`, `sync`, `work`, `archive`. That's a genuinely minimal surface, and it earned its simplicity by rejecting a lot along the way — no custom agent harness, no bespoke connectors, no forced "project" containers, no rigid skill-to-document binding, no vector DB/RAG.

#### Three tensions I'd flag before this becomes a proposal

**1. The DAG vs. the flat list.** Turn 10 wanted a formal dependency graph (`graph.json`) with topological invalidation — "if an earlier analysis is updated, everything downstream needs to be updated." Turn 12 walked back toward flat, organically-inferred "doc A relates to doc B" connections with no forced structure. Those aren't the same thing. A flat relation graph can tell you *that* two docs are connected; it can't tell you *what to re-run* when one changes. If you actually want "upstream edit invalidates downstream deliverable," you need something graph-shaped, even if it's inferred lazily rather than declared upfront. Worth deciding: is invalidation a v1 feature, or does `/intent-sync` handle it by just re-surfacing "hey, doc A changed and B/C reference it, want to review?" without any formal DAG at all?

**2. Task-conditioned memory needs *some* unit of "task."** The "analyst layer" / layered-memory idea (turn 2, turn 6) is explicitly per-project — the same transcript gets summarized differently depending on which project it's feeding. But turn 12 deliberately killed the project construct in favor of active/inactive tracked items. So what's the scoping unit for a task-conditioned summary now? Candidates: the *queue item* itself, an inferred cluster of related tracked items, or you just accept summaries are per-(source, current-intent) and don't try to reuse them across asks. This is the one place I think the simplification from turn 12 quietly under-cuts an earlier insight — worth resolving explicitly rather than letting it fall out by accident.

**3. Diffing without git was punted, not solved.** "Silent local versioning" (turn 4) and raw JSON snapshots + `sources/diffs/` (turn 5) are two different answers to the same problem and never got reconciled into one mechanism. This is foundational plumbing — sync literally can't work without it — so it's a good candidate for the first design decision you nail down.

#### A smaller question underneath all of this

What's the actual first slice? A few candidate MVP cuts, roughly in order of how fast you could get to a real "aha":

- **Just `track` + raw snapshot storage** — no sync, no queue, no personas. Prove that dumping raw docs locally + programmatic grep/rg search beats ad-hoc paste-into-chat. This is almost pure plumbing, low risk, testable in a day.
- **`track` + `sync` + `QUEUE.md`** — the actual differentiator (multi-surface delta awareness). Needs the diffing mechanism decided first.
- **Something narrower**: pick *one* concrete workflow end-to-end (e.g., "Slack thread + Google Doc PRD, reconcile comments back") and build exactly that, skills named for the real commands, before generalizing.

Where do you want to push next — resolve one of those three tensions, pin down the diffing mechanism, scope an MVP slice, or something else entirely (name, positioning, distribution model)? No pressure to converge today; happy to keep pulling on whichever thread is live for you.

---

## Turn 2

### User Prompt

For an initial version, I don't want to over-engineer this.  Simpler is better.  And an easy way to do that is to narrow the scope and surface.  So on how to do "diffs", we can just require that this is run on only Mac or Linux for now.  Those have the "diff" command built in. And we can just use that.  We will need to maintain all the versions of the document though.  So each time the user runs "sync", we'll just have to pull everything and dump it in a file on disk.  And then we can easily run "diff" between the two files.  Windows isn't that complicated to add later as you could just use "fc" to compare files.  The agent can easily reason how to interpret the output of those.

On the directed graph, we either need to explicitly keep track of those conections (like in some sort of dependency graph file) or we'll need to maintain meta-data that allows an agent to efficiently infer those connections. For instance, lets say you have a Slack thread going with the sales team.  There could be new discussions that happen in there that could impact a lot of projects and documents you're working on.  That Slack discussion could go in a lot of directions.  The same could be true of customer interviews.  Or a project plan.  When you ask the agent to do the sync, it will highlight and summarize all the diffs for you.  Ideally, it should also suggest a bunch of next steps for you based on what it knows about what you're working on (i.e. all the other documents/sources you're tracking).  To make those recommendations, could the agent just reason over a list of documents/sources that have metadata helping the agent decide whther they are impacted or not?  I don't want the agent to have to suck all the documents into context all the time.  That's wasteful.  But I'm also hesitant to just have generic summaries of the documents in a metadata file either because that's just RAG in a way.  And that doesn't work because there's no intent; it's just like generic embeddings.  So perhaps the metadata includes some "intent" summaries; like multiple summaries every time you work with the document.  Like the metadata is based on both a generic summary and a description of the intent.  That intent could be "these interviews have been used as a source for the Q4 gamification feature release".  But the "Q4 gamification release" isn't a particular document. That's not a single document.  That's a business goal or intent.  And those goals and intents are fluid, overlapping, and change over time.  That's why I didn't want things to be structured as "projects".  That's too rigid and not how people work every day.

That actually touches on your question about task-conditioned memory.  I think "intent-conditioned" memory is more interesting to me.  Layering that semantic memory over time could be really interesting and powerful, but let's keep it simple for now for an MVP.

What's your feedback on these?

### Assistant Response

Both are good simplifications — with one gap in the diff plan and a naming refinement I'd suggest on the metadata idea.

#### On diffing: solid, but `diff` needs a stable text to point at

Full re-pull + snapshot + `diff` is the right call for MVP — no bespoke sync-state tracking, and "keep every version" is a fine default when disk is cheap and you're only tracking 5-10 active items.

The gap: `diff` on two raw Google Docs/Slack JSON blobs will be nearly useless. API JSON for a doc typically carries revision IDs, structural indices, and formatting objects that shift even when the human-visible text barely changes — one word edited can reshuffle range offsets across the whole payload, so you'd get a huge, unreadable diff for a trivial edit.

Fix is cheap though — split each snapshot into two files:

```
sources/raw/<doc-id>/2026-09-02T10-00.json      <- immutable, never diffed, archival/audit trail
sources/rendered/<doc-id>/2026-09-02T10-00.txt  <- plain-text extraction (content + comments), THIS is what diff runs on
```

`diff` runs against the `.txt` renderings only. The raw JSON stays untouched as ground truth (and as the thing you'd patch back through when writing changes upstream). This is still dead simple — one extra "extract to text" step per source type, which you need anyway since the agent shouldn't be reasoning over raw Slack/GDoc JSON either.

#### On the graph: I think you've talked yourself into the right answer, and it's not a graph

Explicit dependency graph (turn 10) forces you back into declaring structure up front — same rigidity problem as "projects." Generic embeddings-style summaries are RAG with extra steps, and you already have the argument against that (no intent, so no way to judge relevance). What you're describing — a summary *conditioned on the intent it served* — is neither. It's closer to a **relevance ledger** than a graph:

```
documents/sources  <---many-to-many--->  intents (fluid, named, freeform, overlapping)

  slack-thread-sales-q4.json
     - intent: "Q4 gamification feature release"
       note: "AE flagged 3 enterprise customers asking for this"
     - intent: "renewal risk on Acme account"
       note: "customer threatened churn in this thread, unrelated to gamification"

  customer-interviews-batch-3/
     - intent: "Q4 gamification feature release"
       note: "6 of 12 interviews mention friction with current points system"
```

No topological ordering, no invalidation propagation, no single-parent hierarchy — a doc can carry N intent tags, an intent can span N docs, and nothing forces the graph to stay acyclic or consistent. That buys you the thing you actually want from a DAG (sync can ask "what does this touch?") without the maintenance burden of one.

**Why this solves the context-budget problem too:** the ledger entries are one-liners, not summaries of the whole document. The *whole ledger* (all docs x all intents, as short notes) is small enough to sit in context whole — no grep/embedding needed to scan it. So on `/intent-sync`, the agent's loop is: diff each active doc's text -> for docs with a non-trivial diff, read that doc's ledger entries -> scan the *entire* ledger for other docs sharing those same intent tags -> only then, selectively, pull in the full content of docs that plausibly need a second look. That's a two-tier lookup (cheap ledger scan, then expensive targeted read) rather than either "load everything" or "vector search everything."

**One thing I'd push back on slightly:** free-text intent names will drift — "Q4 gamification feature release" vs. "gamification Q4 launch" vs. "Q4 gamification" as three separate strings the agent now treats as unrelated. I'd suggest one small structural concession: a flat `intents.md` (or similar) that's just a running list of canonical intent names + one-line descriptions, appended to organically the same way personas were (turn 11) — the agent proposes "this looks like it's for the Q4 gamification thing, want me to tag it that, or is this a new intent?" the first time ambiguity comes up. That's not a project system — nothing requires a doc to belong to one, there's no hierarchy, it's just a spelling-consistency aid. Worth it, or do you want to let intent strings free-float and rely on the agent to fuzzy-match at query time?

Where do you want to take this next — nail down the intents.md question, sketch the actual folder layout end-to-end now that diff + ledger are settled, or start scoping what the very first buildable slice looks like?

---

## Turn 3

### User Prompt

On the approach to diffing, that's a great point.  And I think that's the kind of thing that would have become clear in testing with actual documents.  I haven't used the Google Docs MCP server or the Slack MCP server, so I have no idea what they return and what a "diff" would look like for them.  Unfortunately, if you're going to rely on "diff", then you need to deterministically get those txt versions of the source docs.  Does that mean that we would need "deterministic text extractors" for each source we want to support?  Like one for Google Docs, one for Slack, one for Teams, one for email, etc.  That would suck, would require the creation of some library of semantic extractors, and as a result would dramatically limit how this scales.

On the graph and the relevance ledger / intent ledger, I think that simplicity is pretty powerful.  It also makes that document human readable and human editable, which is also awesome for a power user.  As much as possible, I don't want the system to be fragile or brittle.  Users shouldn't be scared to look at or edit files.  So we could just have a file that has a list of all the sources/documents and then for each some simple meta-data, including a list of all the intents.  The user could add or edit the intents directly if they want.

On that note, that's actually why I would definitely not want a separate file to keep track of all of the intents.  I don't want some rigid database where you have canonical ids for the intents (e.g. "intent-10513" = "Q4 gamification feature release") and then those canonical ids have to be used everywhere else.  Humans can easily reason that "Q4 gamification feature release" is the same thing as "gamification and rewards product launch".  AI agents are more than capable enough to do that as well.  So I definitely don't want anything that rigid.

### Assistant Response

Good catch on your own plan — and I think there's a real answer that doesn't reopen the "build 1000 connectors" problem.

#### On extractors: I don't think you need one per source — you need a handful of *content-shape* handlers

The instinct to worry is right, but look at what's actually varying. Most source types fall into a small number of shapes, and most of those shapes already have a generic, deterministic answer that isn't app-specific:

| Shape | Examples | Deterministic extraction |
|---|---|---|
| Chat/message transcript | Slack, Teams, most chat MCP output | Nearly all chat MCP servers converge on `{user, text, ts, thread_id}` JSON. One generic "flatten to transcript" function handles this shape regardless of which app it came from. |
| Structured rich-text doc | Google Docs, Notion, Confluence | These APIs almost always offer a native **export-to-plaintext/markdown** endpoint server-side (Drive API's `files.export`, Notion's markdown export, etc.) — you're not parsing their internal JSON at all, you're calling a different, already-deterministic API method. |
| Binary/flat file | PDF, docx, plain text | Solved problem via existing OSS tools (`pdftotext`, `pandoc`) — one tool, works on any PDF, not per-source code. |
| Web page | News articles, Reddit, blog posts | Generic readability extraction (`trafilatura`, `readability`) — one algorithm, not per-site scraping logic. |
| Email | Gmail, Outlook | Header/body split is already a generic, standardized shape (MIME), not app-specific. |

So the real inventory isn't "N extractors for N sources," it's something like 4-5 reusable **shape handlers**, plus a rule for picking one per source ("does the source's own API offer export-to-text? use that. Is it chat-shaped JSON? flatten it. Is it a file? shell out to a generic tool."). That's a meaningfully smaller, and much more defensible, surface than a connector library — you're never writing "the Google Docs parser" and "the Notion parser" as bespoke logic, you're writing "the rich-text-export handler" once and pointing it at whichever API's export method applies.

One hard constraint worth naming explicitly: **the extraction step has to be a deterministic script, never an LLM call.** It's tempting to just have the agent "render this doc as clean text" — but an LLM asked to do the same mechanical task twice isn't guaranteed to phrase it identically, and any wording drift would show up as fake diff noise, which is exactly the fragility you're trying to avoid. So this piece is plumbing, not intelligence — small trade-off, but it's the one place in the whole system I'd insist stays code rather than prompt.

Long tail sources with no export API and no clean shape (some internal tool, a weird proprietary format) just don't get sync/diff support in v1 — that's a fine and honest limitation rather than something to solve upfront.

#### On the ledger with no canonical intent IDs — agreed, and I think this is the right call

Free-text intent labels + trusting the agent to fuzzy-match ("Q4 gamification feature release" ~ "gamification and rewards product launch") is consistent with everything else you've rejected structure in favor of, and it's exactly the kind of judgment call LLMs are actually good at. A canonical registry would just be reintroducing the rigidity you removed from "projects," one layer down.

The only drift-mitigation I'd bake in is *behavioral*, not structural: when a skill is about to tag a document with a new intent, instruct it to first scan the existing intent strings already in the ledger and prefer reusing one verbatim if it's clearly the same thing, rather than always minting fresh phrasing. That's a line in a skill's instructions, not a schema — doesn't reintroduce IDs, just nudges consistency. Worth including, or would you rather leave that entirely to the agent's judgment in the moment with no nudge at all?

---

At this point quite a bit of real architecture has crystallized across this conversation — snapshot-based diffing with shape handlers, the intent ledger, the four-command surface, skills-not-MCP-server, no forced projects. Want to keep pulling threads (folder layout, the actual skill/command list, personas), or is this a good point to capture what's settled so far into an OpenSpec change proposal and keep exploring the open pieces from there?

---

## Turn 4

### User Prompt

That's an interesting point on there only being a few "shapes".  But some of these shapes, like Google Docs, aren't just structured rich-text.  They also include collaboration features like "comments", "track changes", etc.  How would those be flattened?  And then things like Google Sheets are even richer in nature.  So you'd have to flatten those to content only in a different way (e.g. into some kind of grid dictionary).  And then Google Slides is probably even more complicated because it's so visual.  And then Sheets and Slides also have the collaboration features that are important as well.

And then even though you're saying you just need different "shapes", the reality is that the MCP tool call response for Slack is going to look different than the tool call response for Teams.  So if it's going to be deterministic, you would need to deterministically support Slack and Teams and Discord and every other chat app so that you convert them into the "shape".

Maybe this is where being an open source project would be helpful though.  Because users could add or modify "shape handlers" to make them more useful over time.  But again, that still results in the 1000 extractors.  Am I wrong?

And on the drift-mitigation, I actually disagree.  Projects change.  The way they're named changes over time.  So what happens when the "Q4 gamification release" pushes to Q1 or Q2 of next year?  It would be weird (and wrong) to intentionally persist the old intent as the situation changes.  That's the same as using some canonical intent identifier.  Just let the agent reason over them and perhaps update them all as the situation changes.  It's just a single file tracking everything (probably in Yaml or even just markdown).  It's easy for an agent to edit the file. And it's also easy to validate that the changes are consistent with some target format (e.g. it has certain sections, certain metadata, etc.).

### Assistant Response

You're not wrong, and I was oversimplifying. Let me separate what actually still generalizes from what doesn't.

#### The extractor problem is real for structure, but the fix is the same move you already made once

You're right on both counts: Google Docs comments/suggestions, Sheets grids, and Slides' visual layout genuinely aren't the same shape as "rich text," and Slack-vs-Teams-vs-Discord JSON really would need per-app parsing if a hardcoded script has to know each schema. If the plan is "write a deterministic script for every source's exact structure," that is the 1000-connector trap again.

But notice where the requirement for a *script* came from — it was my "must be deterministic" constraint from last turn, and I think that constraint was wrong, or at least too strict. Here's the reframe:

**Nothing downstream of the diff is a human reading raw diff output.** It's the agent, and the agent's job in `/intent-sync` is already to interpret and summarize deltas, not display them verbatim. That means the extraction doesn't need to be byte-perfect deterministic — it needs to be *stable enough that real content changes dominate cosmetic rewording noise*. That's a much lower bar, and it means **the agent can do the extraction itself**, the same way it already reads whatever a Slack MCP call returns without you having written a Slack parser. Give it a fixed, mechanical target format to render into ("plain text, reading order, one block per paragraph; comments as a separate `---COMMENTS---` section, each as `[author, timestamp]: text`") and let it do that rendering for any source with no dedicated handler. Minor phrasing drift between two renderings is noise the agent itself can shrug off when it reads the diff — it's not noise a human has to parse.

That gives you two tiers instead of "N connectors":

```
+-------------------------------------------------------------+
| TIER 1 - native handlers (small, curated, high-value)        |
|   Google Docs -> Drive API export-to-markdown (real API call)|
|   Sheets -> flatten grid to CSV/TSV (universal tabular shape)|
|   PDF -> pdftotext                                            |
|   -> deterministic scripts, worth writing because they're    |
|      cheap, exact, and cover the highest-traffic sources     |
+-------------------------------------------------------------+
| TIER 2 - agent-rendered fallback (everything else, always    |
|   available, zero setup)                                     |
|   Slack, Teams, Discord, Slides, any MCP source you didn't   |
|   write a handler for                                         |
|   -> agent renders to the same canonical text/comments       |
|      format, following fixed mechanical instructions          |
+-------------------------------------------------------------+
```

Tier 1 stays small and optional — it's an *optimization* for the handful of sources everyone uses, not a requirement for the system to work. Tier 2 means literally nothing is ever unsupported, and it's exactly the "the host agent already knows how to deal with whatever MCP hands it" principle you insisted on back at turn 4, just pushed one layer deeper into extraction instead of stopping at connection. Open source contributions become "add a Tier 1 handler if you want it faster/cheaper for your source," never a blocker.

Slides is a good stress test for this: content-only rendering ("slide N: title / bullets / speaker notes," in order) loses the visual design entirely, but you don't care about visual diffing here — you care about "did the argument or numbers change," which the content-only rendering captures fine. Comments/track-changes render as their own section so they diff independently from body content, which also matches how you'd actually want to review a sync delta anyway (body changed vs. someone left a new comment are different kinds of news).

#### On intent drift — you're right, I conflated two different problems

Good catch. "Reuse existing wording to avoid accidental duplication in the same session" and "persist old wording as the business reality evolves" are not the same failure mode, and my nudge would have caused the second one — an agent stubbornly keeping "Q4 gamification release" alive as a label after everyone's calling it the Q1 thing, purely because I told it to prefer reusing existing strings. That's a canonical ID with extra steps, exactly as you said.

Better framing: the ledger is a living document the agent actively maintains — free to rename, merge, or split intent labels in place when it notices the underlying reality shifted, not just append-only. The only thing worth checking mechanically is *structural* validity (does this entry have the fields a ledger entry needs), never content/wording consistency. That's a real distinction — schema validation vs. semantic validation — and only the former belongs in tooling.

---

Both of these came from the same underlying instinct: don't scriptify things an LLM is already good at (interpreting varied JSON, judging when two phrasings mean the same evolving thing), only scriptify things that need to be cheap, exact, and boring (the handful of native export calls, running local `diff`). That's a pretty clean principle to build the rest of the design around.

Given how much has settled — snapshot+diff mechanics, the two-tier extraction model, the intent ledger as a living non-canonical file, the four-command surface, skills-not-harness — do you want to keep exploring (folder layout, the skill list, personas), or start capturing this into an OpenSpec change proposal now?

---

## Turn 5

### User Prompt

*(A `/usage` command was run first; its output was "Settings dialog dismissed".)*

Before moving on to an openspec proposal, I think I'd like to summarize the user experience we're envisioning.  And then we can continue to back into how to make it work.

So this will be an open source package available on Github. The user would install it using npm.  Let's call the package "OpenSeria".  I tried to find a name that wasn't taken already.  We could change it later.  So they'd do something like the following:

`npm install -g @stevenpal/openseria@latest`

And then they'd create a folder and run the following command:

`openseria init`

That would install the skills and scripts in that folder.  If there are node_modules necessary, it would install those I guess.  Plus, it would setup any necessary folders that will be used once the user starts tracking and syncing documents.  Perhaps that also sets up the intent ledgers.

And then there would be the following commands:

/seria:track - starts tracking some artifact or document, automatically downloading it locally, adds initial intent for the doc in the ledger
/seria:sync - iterates through all active documents in the ledger, gets the latest version, diffs it with the last version, summarizes changes, proposes a list of actions to take based on those changes or asks the user for what changes they would want to make, adds those action items to a queue document (queue.md for now)
/seria:manage - shows the action items in the queue and all the actively tracked items
/seria:work - lets you take action on an item in the queue, or lets you start working with the agent on a new intent (which will be working with your docs)
/seria:archive - drops items from the active ledger and moves them to some type of archive ledger
/seria:ask - lets you do deep research across all of your documents and sources

And actually, I'm thinking about wording.  Maybe rather than "documents" or "sources" or "artifacts", we simply call these "streams".  Basically to represent that it's just a stream of knowledge.  That might be one-way (e.g. a PDF, a research report, a news article) where its just you extracting knowledge to use in some way for something else or it might be two-way (e.g. Slack, Google Doc, etc.) where knowledge flows bout out and back into it.

Can you summarize this UX in a new markdown file?  Maybe something like "proposed_ux.md" or something.

And can you also capture this entire chat thread (our entire back-and-forth) in a different markdown file as well?  You can put it alongside @sources/open-business-sdd-gemini-20260831.md .  I'm trying to keep track of all of the interactions I'm having with the agent as background streams that can be used to continue the conversation easily next time.  I'm trying to dog-food this idea while building this project itself.

### Assistant Response

This is exactly the kind of capture explore mode supports — you've asked for two markdown files (a UX summary, and a session transcript), and you've been specific about names and location. I'll write both now:

- `proposed_ux.md` at the repo root — the OpenSeria UX summary
- `sources/openseria-design-session-claude-20260902.md` — the full transcript of this session, alongside the existing Gemini transcript, so it reads as the next "stream" in the same background-context folder

*(Wrote `proposed_ux.md` and an initial version of `sources/openseria-design-session-claude-20260902.md`.)*

Both files are written:

- **`proposed_ux.md`** (repo root) — the OpenSeria install/init flow, the six `/seria:` commands, the "streams" (one-way/two-way) terminology, and a short list of open threads not yet reconciled against this surface.
- **`sources/openseria-design-session-claude-20260902.md`** — the full transcript of this session, formatted to match the existing Gemini transcript, sitting alongside it as the next background source.

A nice bit of dogfooding: these two files are effectively a hand-written preview of what `/seria:track` + `/seria:sync` would produce automatically once the tool exists — a durable "stream" capturing this design conversation, plus a synthesized artifact derived from it.

Next step whenever you're ready: turn the settled pieces (relevance ledger, two-tier extraction, the `/seria:` command surface) into an OpenSpec change proposal. Anything else you want to explore first, or is that the right place to head?
