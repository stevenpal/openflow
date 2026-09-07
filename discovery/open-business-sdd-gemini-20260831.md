# Open-Source Business SDD & Intent Engine: Conversation Transcript & Brainstorming Archive

**Date:** August 31, 2026  
**Topic:** Concept exploration and architectural design for an open-source, local-first "Spec-Driven / Intent-Driven Development" framework for product managers, marketers, and business leaders.

---

## Turn 1

### User Prompt
I wanted to explore an open-source project idea with you. I've been exploring spec-driven and intent-driven development a bit. It's a really interesting concept. In practice, I've been a bit disappointed to be honest. I think much of that has to do mostly with it being impossible to provide sufficient context to the agent (e.g. creative guidelines for UI/UX designs, giving the agent access to fully test changes end-to-end with real data, etc.). But the idea is still really cool. I gave OpenSpec a try and definitely saw the appeal of having a set of skills and scripts that formalize the process for you. Unfortunately, OpenSpec (and most alternatives) have a very heavy developer / engineer bias. They are not well suited for business or product people that aren't super-technical. That got me thinking that there's probably a set of tools that might be useful for these "business" people to do something similar.

Basically, the idea with SDD is that you're taking context (previous specs, existing code, AGENTS.md, DESIGN.md, etc.) and combining it with new user intent (via an interactive discussion). And then you're projecting the resulting changes onto different surfaces -- primarily code and specs. And then after testing and bug fixing, you may actually need to project backwards from the code into the specs before persisting them.

I think there's something more generic here that could be extrapolated to other business roles like product managers, data analysts, product marketers, or executives. These folks are basically using a set of inputs and then have to iteratively work on a set of outputs. So for a product manager, for example, the inputs could be meeting notes or transcriptions, product analytics, Slack discussions, existing product specs or behavior, and the like. And then the outputs might be a one page brief, a full PRD, a slide-deck used to communicate with development partners, a brief for the product marketing team (going deep on positioning, timing, etc.), JIRA epics and tickets, product roadmap descriptions in Aha, and the like. But all of those outputs are basically driven by the same "intent". But updating all of those artifacts is a lot of work and is mostly mechanical. Let's say you share a PRD that's in Google Doc format with your peers and they give you a bunch of feedback. You need to incorporate that feedback into all of the artifacts I mentioned. It's a ton of work.

I was thinking about creating an open source package, similar to something like OpenSpec, that helps business people manage this process. I was thinking that they could have projects where they specify all the inputs they're going to need and a set of outputs they're going to need to generate. And then they can iteratively work with the agent to analyze all the inputs, generate the outputs, and then update all of them as things evolve. For instance, they might get feedback in Slack or they might do a phone call with a customer or they might get comments on a Google Doc. They can work with the agent to synthesize that feedback and make decisions on how that should integrated. They still own the "judgement", but they let the AI help them with the busy work.

Is there anything like this on the market? I've seen stuff like ChatPRD.com, but these are all closed source and require you to integrate all your context on their platforms. But I haven't seen anything open source that can work with any agent.

---

### Assistant Response
The short answer is **no, there isn't an open-source, framework-agnostic "Spec-Driven Development for Product People" tool on the market today.** 

While the developer space has seen a surge in SDD tools (like GitHub's **Spec Kit** or **OpenSpec**), the business/product domain remains dominated by closed-source, single-surface SaaS platforms. 

Your abstraction—**Context + Intent projected onto Multiple Target Artifacts, reconciled via bidirectional sync**—is a legitimate gap in the open-source ecosystem.

#### Current Landscape: Why Nothing Quite Fits

| Tool / Category | Approach | Why it misses your mark |
| :--- | :--- | :--- |
| **SaaS "AI Product Tools"** *(ChatPRD, Delibr, Craft.io, etc.)* | Monolithic web platforms that generate specs and docs. | Closed-source, vendor lock-in, store your data in their walled garden, and lack local/CLI/custom agent execution. |
| **Dev SDD Toolkits** *(Spec Kit, OpenSpec, Agent-Spec)* | Markdown-based specs driving file modification via git/CLI. | Highly technical (YAML, git diffs, terminal execution), heavily tailored to code generation rather than business artifacts. |
| **Prompt Libraries / Templates** | Static system prompts for Claude/ChatGPT to write PRDs. | No persistent project memory, no state management across multiple surfaces, and no mechanism for backward projection (reconciling feedback). |

---

#### Key Architectural Concepts for an Open-Source Business SDD Framework

If you were to build this open-source tool (e.g., **`biz-spec`** or **`intent-spec`**), here is how the core engine would translate SDD concepts for non-technical users:

**1. The Projection Engine (One Intent -> N Surfaces)**
In software, intent projects to `.ts`, `.py`, or test files. In product/business, intent projects via template adapters to:
* **`PRD.md` / Google Doc** (Detailed specification)
* **`SLIDES.md` / Marp / Pitch deck** (Executive summary)
* **`EPICS.yaml` / Jira Sync** (Execution tickets)
* **`GTM_BRIEF.md`** (Marketing alignment)

**2. Bidirectional Convergence (Backward Projection)**
When stakeholders comment on a Google Doc or leave voice feedback, the tool needs a `converge` action. It ingests the diff/comments, updates the canonical core spec (`spec.md`), and offers to auto-update the downstream slide decks or Jira tickets to keep all artifacts in lockstep.

**3. Markdown-First, Adapter-Driven Storage**
To keep it agent-agnostic (working with Claude Code, Cursor, ChatGPT, or local LLMs):
* Keep project state in a clean, human-readable local folder (`.bizspec/` or `.product/`).
* Use simple Markdown files for inputs (`context/transcripts/`, `context/analytics.md`) and specs (`spec.md`).
* Use output adapters (e.g., converting local markdown specs into Jira tickets via API or exporting to Google Docs/Notion).

---

#### Potential Architecture Sketch

```text
  [ Raw Inputs ]                     [ Core System ]                     [ Target Surfaces ]
- User Interview Transcripts  ──┐                                    ┌──> PRD (Google Doc / MD)
- Slack Feedback Loops        ──┼──> [ Intent Synthesis Engine ] ────┼──> Slide Deck (Marp / Pitch)
- Existing Analytics / Data   ──┘     (Agent + Local State)          ├──> JIRA Epics / Stories
                                                                     └──> Product Marketing Brief

```

---

## Turn 2

### User Prompt

That's really helpful and is exactly what I was thinking. And I agree on the interface challenge. But I'm thinking that it could start with more technical business users at first (i.e. a set of skills and scripts that run on your local machine that your agent can use). So very "AI-native" or "AI-forward" business people. That would be the open source version. But then not everyone wants to do stuff open source. And not everyone wants to use these tools by themselves. So there could be a hosted version that has team use cases or just runs in the cloud as SaaS.

But back on the existing tools out there. The other thing that's similar in a way is NotebookLM. You add all your context in and then can ask it to create outputs. But that only operates in the cloud, can't connect to outside data sources (e.g. via MCP), and doesn't really have the concept of translation of a single idea you're working on into multiple separate artifacts. It's a sandboxed solution. I want something that could be used by agents, connects to whatever data sources your agents can connect to (which is pretty much anything at this point), and perhaps even learns over time.

For instance, I could see how someone might slowly build up their "personal work memory" from this. If you keep putting your personal context in (meeting transcriptions, etc.), that can be used for multiple projects -- not just a single project. If you have particular templates you use for communicating (e.g. a particular PRD format), you can re-use that over time. If you have skills that you've created or found online, those could be re-used.

And then on the memory, things like Glean are generic knowledge retrieval systems. If you have all of your raw memory locally, you can re-index it as many times as you want based on the task at hand. So imagine "layered memory" that's specific to a particular project you have. You could summarize source inputs at various layers of detail based on the particular project goal you have. For example, one meeting transcription could have covered three different projects (or may have not been relevant at all). It'd be interesting to summarize each meeting note based on the project you're working on and what's important in that project. And then layer that summarization. But that would be per-project. You and I have talked about why semantic layered memory doesn't work at scale generically, but this wouldn't be generic. It would be per project or per intent you're working on. That's really hard to do manually -- that's what analysts were paid to do. But an agent can do that easily.

---

### Assistant Response

You’ve hit on several foundational insights here that reveal why this approach could be far more powerful than traditional knowledge management tools:

#### 1. NotebookLM vs. Agentic Intent Projection

NotebookLM is an incredible tool for **source-grounded retrieval and synthesis**, but as you noted, it suffers from three structural limitations for real work:

* **Passive Retrieval vs. Actionable Projection:** NotebookLM answers questions or generates one-off summaries about your sources. It doesn't treat your outputs as *stateful artifacts*.
* **Walled Garden Connectivity:** It cannot dynamically reach into external systems via protocol standards like MCP.
* **Lack of Cross-Project Memory:** Everything stays in a sandboxed notebook.

Your model replaces passive QA with **active projection**: taking unified intent and projecting it through specific templates/adapters into living downstream artifacts.

---

#### 2. Task-Conditioned (Project-Layered) Memory

When you summarize a 60-minute product sync *generically*, you destroy the subtle context needed for specific future decisions. But with **Project-Layered Memory**:

```text
               ┌──> Project A (Feature Launch) ──> Summarized for: Architecture & Timeline
               │
Raw Input ─────┼──> Project B (GTM Strategy)    ──> Summarized for: Positioning & Messaging
(Transcript)   │
               └──> Personal Context Store     ──> Preserved in raw form for future indexing

```

1. **Raw Core (Global Store):** Transcripts sit in a clean, local raw directory (`/memory/raw/`). They are immutable and never lose fidelity.
2. **Task-Conditioned Indexing (Project Store):** When linked to **Project X**, an agent processes raw sources through the lens of Project X's goals.
3. **Template & Skill Reusability:** Your personal preferences sit in a reusable global skills directory (`/templates/` and `/skills/`).

---

## Turn 3

### User Prompt

I'm wondering to what extent this overlaps with "personal assistants" that folks are trying to build. Or even full agent harnesses like Hermes or OpenClaw. They also have memory systems, but they're generic. A lot of what makes products (open source or closed source) is not necessarily the set of features but rather the way they're packaged and exposed to the user. So is a full agent harness the best surface? Just a set of skills and scripts? My intuition is that no one wants another agent. Claude and ChatGPT/Codex are really good already. Do we really need another one? Those are very generic and very powerful. They already know how to integrate with everything. They come with all the security around MCP setup, etc. I'm not seeing a compelling reason to rebuild that. Just build on top of it instead. What do you think? How should I think about the product surface for a solution like this?

---

### Assistant Response

Your intuition is dead on: **do not build another general-purpose agent or agent harness.**

The market is already drowning in generic "personal AI assistant" frameworks. Users do not want another CLI runner or chat window trying to compete with Claude Code, Cursor, ChatGPT Desktop, or Gemini.

The winning paradigm is to build an **Intent Engine & Domain Layer** that plugs directly into existing agents via **MCP (Model Context Protocol)**, standardized file/repo structures, and specialized skill packages.

#### Why Building an Agent Harness is a Trap

| Dimension | Building a Custom Agent Harness (Hermes, OpenClaw style) | Building a Domain Layer / MCP Engine (Your Idea) |
| --- | --- | --- |
| **User Experience** | Forces users into a new chat UI or terminal window. | Meets users where they already work (Claude Desktop, Cursor, ChatGPT). |
| **Maintenance & Security** | You must maintain model orchestration, OAuth, and sandboxing. | Anthropic, OpenAI, and Google handle authentication, token optimization, and UI rendering. |
| **Value Focus** | 80% of engineering spent on basic agent plumbing. | 100% of engineering spent on **domain intelligence** (spec projection, project memory, sync). |

---

## Turn 4

### User Prompt

Why does this need to be an MCP server though? Why not just a set of skills and scripts? Like instead of bizspec_ingest_memory(file_path), why couldn't that just be a skill? That makes it more open (i.e. power users can modify the skills) and involves less setup.

Also, I'm not seeing the need to create my own connectors. Why? Those already exist. There are already MCP servers for Google Docs, JIRA, etc. The value here isn't in integrating with 1000+ business systems. That's what Merge.dev is doing. And that's also why I would want to just leverage existing agent harnesses like Claude or ChatGPT. They're doing the hard work there.

And then on the user experience, I think that the vast majority of business users don't want to work in markdown files. I like that all of this lives locally though. So perhaps all of the inputs and layered memory are in markdown (to start). But I think a lot of business users want to edit Google Docs or some other business document. But then to be able to take their changes to revise core intent and then update other docs is what's valuable.

Also, I think the analysis needs to be inspectable and editable (just like anything in the whole system). That's the importance of the layered memory / analysis. The agent may have misinterpreted the meaning or importance of a set of meeting minutes or of a bunch of numeric data that it crunched. The user can just review them (at a high level first) and then revise them directly (or with the agent) if necessary. Think of it like reviewing the work that your analyst did for you. You'd have them revise their deliverable for you. Same here, but it's an agent you're working with rather than an analyst. But it's all inpsectable and editable and then the machine lets you easily synthesize the implications of those edits up (or down) the stack.

I guess a really important part of this is being able to diff changes easily though. I guess that might be a bit of a bottleneck if you're not versioning your work in git. I'm guessing that most of the business artifacts won't actually be local. Syncing up changes across docs is often about small edits rather than totally rewriting everything. I don't believe in the "spec-as-source" approach where it's just a one-way projection (i.e. you have the intent and then one-way project the user-facing artifact from it ... in this case a Google Doc or a Powerpoint slidedeck or JIRA tickets). Rather business users interact with the user-facing artifact and then project backwards. It's back and forth. How do I accommodate that without version control?

---

### Assistant Response

You’ve hit on several sharp, crucial insights that refine the architecture:

#### 1. Skills & Scripts > Dedicated MCP Server

* **Lower Setup:** Skills are just structured instructions, prompt recipes, and lightweight executable scripts (Python/Node/Bash).
* **Power-User Modifiability:** Edit Markdown or template files directly.
* **Open & Portable:** Works natively with Claude Code, Cursor, ChatGPT, or any LLM client with local skill/tool execution.

#### 2. Don't Build Connectors — Compose Existing MCPs

The host LLM acts as the orchestrator across **existing third-party MCP servers** (Google Drive MCP, Slack MCP, Jira MCP).

#### 3. Inspectable & Editable "Analyst Layers"

Treating the agent's work like an **associate analyst's draft** provides transparency and human control. The user can review, edit, or ask for revisions on intermediate artifacts (`synthesis.md`, `project_context.md`).

#### 4. Resolving "Backward Projection" Without Git

* **Block-Level Mapping:** Use structural anchors to target edits at the section level.
* **Delta Ingestion Loop:** Pull diffs/comments from external docs, update local intent, and issue targeted patches.
* **Silent Local Versioning:** Auto-snapshot local workspace files behind the scenes for clean diffing without exposing Git commands to business users.

---

## Turn 5

### User Prompt

So you're saying that every artifact that's either ingested or created would need to have some type of outline or summary made for it locally? And that's what would be versioned? That doesn't sound scalable.

Why not just download the document entirely? The Google Docs and Google Sheets MCP calls can just retrieve the contents of the document as JSON. Why not just dump the JSON in files in the "raw_sources" directory somewhere? You'd need some index of all of the sources with pointers to the canonical versions (e.g. the official "spreadsheetId" for a Google Sheet). But that way you could pull the latest version using MCP and then compare it to what you've been working with locally, including doing a diff to figure out what's changed. It would also include all the comments from people reviewing the docs. So you'd have those to work with as well as context.

For documents, it seems like this would be fine. Even web pages (e.g. news articles, research reports, reddit threads, etc.) could be downloaded locally. I think the main issue would be where you have sources that are structured in databases. Like large amounts of data. You'd have to just rely on reports in that case I guess.

---

### Assistant Response

Downloading full document payloads directly as raw snapshots (e.g., JSON from Google Docs, raw Markdown from web pages) is a much cleaner, more scalable approach.

#### 1. The Local Raw Snapshot Architecture

* `index.json`: Tracks canonical source mappings, IDs, and last-synced timestamps.
* `sources/raw/`: Holds raw snapshots (`prd_v1.json`, `interview.txt`).
* `sources/diffs/`: Tracks delta changes between pulls.

#### 2. The Reconciliation Loop

1. **Pull Latest:** Fetch complete document JSON via MCP (including comments and suggestion modes).
2. **Local Diff:** Compare `prd_v2.json` vs `prd_v1.json`.
3. **Synthesis:** Extract edits/comments, update inspectable `layered_memory.md`.
4. **Patch:** Apply approved updates back to connected target surfaces.

#### 3. Handling Databases & Large Datasets

Store **Query & Report Snapshots** (e.g., CSV, JSON output, or statistical summary) in `sources/raw/data_reports/` alongside the exact SQL/query string used to generate them.

---

## Turn 6

### User Prompt

The other rationale for just having the documents locally is using direct corpus interaction vs. things like RAG. https://huggingface.co/papers/2605.05242

I still think having that "analyst summary" layer is important though. It gives you the "why this is important" at a glance. Also, I think it would be interesting for users to have global memory and then project specific memory. So basically, there's a folder where you just dump everything that's relevant to the work that you do. But not all of that is relevant for each project. So each project has different intent. And as a result, only a subset of your global memory is relevant. And you'd only need to "analyze" that subset as your intent changes.

There are a lot of "company brain" companies getting started right now. But my main concern with all of them is that it's an all-or-nothing proposition for the company. Those types of top-down initiatives either a) take forever to implement, or b) never actually get implemented at all (i.e. great ideas that die on the vine). So I was thinking this more individual, grass-roots, open-source alternative could be interesting. If enough people use it, perhaps there's some team-level or department-level or even enterprise-level solution that could come out of it.

---

### Assistant Response

#### Direct Corpus Interaction & Grass-Roots Adoption

With 1M–2M+ token context windows standard in flagship models, **RAG is increasingly unnecessary for individual or project-scale work**. Chunking text and computing vector embeddings causes lossy retrieval. Dumping raw, unchunked document snapshots into the context window preserves full fidelity.

#### Why Grass-Roots Wins Over Enterprise "Company Brain"

* **No Top-Down Friction:** No enterprise security approval needed to start.
* **No Context Poisoning:** Enterprise RAG contaminates results with outdated company docs. Individual project-conditioned memory keeps context clean.
* **Organic Bottom-Up Virality:** Individual power users adopt the tool locally, then share project folders with team members.

---

## Turn 7

### User Prompt

I think getting the documents and files in could be one of the biggest points of friction. If you have no context, then the tool isn’t that useful. How could I minimize the friction? With data that’s coming from MCP, the user could just drop a url to a document and then run a skill that adds it to the global memory. But what about physical files like PDFs or meeting transcripts. Even things like Slack discussions. Every time a user has an interesting discussion in slack or some new reply is added to an existing long running thread, how do they add it?

---

### Assistant Response

#### Low-Friction Ingestion Channels

1. **URL Drops in Chat:** Paste Google Doc, YouTube, or web links into chat -> Skill fetches raw JSON/Markdown via MCP.
2. **Slack Thread Link Skill:** Paste a Slack thread URL -> Slack MCP fetches thread and replies into `global_memory/raw/slack_thread.md`. (Optionally, use a 🧠 emoji reaction trigger).
3. **Local Watched Hot Folder:** A `~/Downloads/IntentMemory/` folder auto-ingests dropped PDFs, audio transcripts, or text files.
4. **OS-Level Shortcuts:** Use Raycast or Alfred hotkeys (`Cmd + Shift + M`) to dump highlighted text or URLs into memory.

---

## Turn 8

### User Prompt

A few thoughts. The first is that another key source of input is likely email. That's another one where having to manually copy/paste is likely not a great experience. And then even if you have a Gmail MCP server connected, I'm not sure how easy it is to instruct the agent to find the relevant emails. I know they can search based on to, from, subject lines, etc. But that's likely not sufficient. There are likely specific emails that are relevant as sources. Not sure how to make that easy and "local" to ingest.

The next thought is that the "global memory" could also just be an incremental thing that builds up over time. So rather than have the user put everything in there, perhaps it could just be added to over time per project. So let's say you're working on a particular project. You could ask the agent to ingest a bunch of sources for that project. Once you're done with the project, those could all be archived, similar to how OpenSpec lets you archive specs afterwards. With OpenSpec, they keep all the original working spec files and then merge the specs into a "current spec" per feature. Perhaps it's something similar but without the "merging" of the specs. So all of the sources and outputs for a particular project get archived into a global memory. And then you can reference those for future projects. That way it's incremental and doesn't have to be an all-or-nothing thing. Again, I think the reason that a lot of "company brain" challenges is that it's all-or-nothing because it's so centralized. And my thinking about not "merging" the artifacts is that you don't have intent to properly merge them into anything. So you can just leave them as-is and do direct corpus interaction on them later, perhaps with some simple index that lists them all out.

And then on the direct corpus interaction, I just wanted to clarify that every intent or prompt to the agent should not result in the agent shoving all of the memory into context and reasoning over it (like using up the entire 1M token context window). I know that's possible, but that'll just burn through tokens. What the white-paper I shared was talking about was letting the agent programmatically interact with the corpus. So like using "grep" and "find" or writing simple shell scripts to search through and summarize things. That's what I meant. So lets say a user's intent is to create a launch plan for EMEA for a particular industry segment, the agent could grep for "EMEA" or all the individual countries in that region (e.g. "France", "England", "Africa", "Morocco", etc.) across the documents. I didn't mean it necessarily needed to ingest everything all at once. For instance, when Claude Code is trying to look for impacts of a change in your code base, it doesn't shove the entire code base into the context window. It runs "grep" and "find" etc.

---

### Assistant Response

#### 1. Zero-Friction Email Ingestion

* **Star/Label Trigger:** Apply a `+IntentKit` label or star an email thread in Gmail -> Local cron/MCP skill fetches and saves `email_<id>.md`.
* **Direct URL Drop:** Drop a Gmail thread link/ID into chat.

#### 2. Incremental "Project-First" Memory

* **Active Work:** Focus only on 5–10 sources relevant to the immediate project.
* **Archival Vault:** Upon completion, archive the project folder (`/archive/2026-emea-launch/`) as an immutable snapshot.
* **No Lossy Merging:** Preserve original context without forcing messy "master spec" merges.

#### 3. Programmatic Direct Corpus Interaction

Use local CLI tools (`ripgrep`/`rg`, `jq`, `grep`) to search local files programmatically:

* Low token consumption.
* Near-instant execution speed.
* Exact file-line traceability without needing a vector database.

---

## Turn 9

### User Prompt

What do you think might be the primary use cases for this type of solution? And why would someone use this over just ad-hoc interaction with Claude or Codex? Why would they go through the extra step of installing an open source package? What might the "aha" moment be for different types of people that have different use cases?

---

### Assistant Response

#### Primary Use Cases

1. **Technical Product Managers:** Coordinating PRDs, Pitch Decks, Jira Epics, and GTM Briefs from customer call notes and Slack feedback.
2. **Product Marketers (PMM):** Translating raw capabilities and win/loss transcripts into localized messaging and sales battlecards.
3. **Operations & Chiefs of Staff:** Turning weekly updates and board feedback into recurring board decks and OKR trackers.

#### Why Use This Over Ad-Hoc Chat?

* **Stateful Persistence:** Does not lose context or forget decisions when a chat gets long.
* **Eliminates Copy-Paste Tax:** Auto-fetches and patches docs via MCP.
* **Multi-Surface Sync:** Updates core intent and all connected target documents in one loop.
* **Programmatic Token Efficiency:** Uses `ripgrep` locally instead of burning context window tokens.

#### The "Aha!" Moments

* **The PM:** Running a single `reconcile` command that ingests 25 Google Doc comments and automatically patches 12 Jira tickets and a pitch deck.
* **The Chief of Staff:** Star 3 emails, paste 2 Slack links, drop 3 Zoom transcripts, and instantly generate an `analyst_summary.md` without copy-pasting once.
* **The Marketer:** Searching an archived EMEA launch project from 6 months ago using `ripgrep` to kickstart an APAC launch plan.

---

## Turn 10

### User Prompt

Those are great. I think there are a lot of personas this would be relevant for, including business development and sales. Most knowledge work likely would be covered.

On that topic, there are three things I wanted to talk through related to knowledge work.

The first are interim deliverables. So often there aren't just simple inputs and outputs (like I take these 15 input documents and then create 5 deliverables from them). Rather, there are a lot of intermediate documents that lead up to those final deliverables. So for instance you might have a bunch of customer interviews, but then you need to synthesize and summarize those interviews. And then from that analysis, you might combine it with some industry research reports and create another intermediate analysis that's captured in a document. And every one of those intermediate documents might get shared in different formats (e.g. a Slack message, an email summary, a Google Doc, a set of summary slides, a diagram) and are iterated on (perhaps with external feedback). And then those documents feed into other documents. And so on. The way we were talking about it, the agent would be doing all the analysis in a single step and you could review and edit it in a markdown file. It feels like you would be doing that ten times a day as a busy knowledge worker. So there needs to be some way for these deliverables to have an arbitrary number of layering, like almost forming a graph with connections. And if an earlier analysis is updated, then all of the deliverables that were fed by that would need to be updated. How might we incorporate having an arbitrary layering of deliverables?

The second thing I wanted to bring up are knowledge work skills (and it's related to the last point). There are a lot of open sources skills being shared for specific knowledge work tasks (e.g. creating presentations, working with different file types, doing data analysis, etc.) and for different roles and disciplines (e.g. create a GTM plan, create a PRD, do a financial analysis of this company's public records, etc.). I'm wondering how these skills can be used in conjunction with this solution. All of those "intermediate deliverables" I mentioned in the last point all have different skills associated with them. So it'd be great if the agent could use these skills when it needs to reconcile and project changes.

The third is also somewhat related. The usual reason there are so many different versions of the same information (i.e. why people have to create a one page brief, a slide deck, a customer email, a spreadsheet analysis of financials, a detailed set of JIRA tickets, etc.) is because they are projections of the same information for different audiences. It's usually not all for the same audience. It's often that you have a different audience you have to communicate with and need to tailor the message for them. So it would be really useful for the agent to have some understanding of who these people (or personas) are. Having some persistent description of these people would allow the agent to both better craft the deliverable with those persona in mind but also give you feedback on your intent from their perspective ahead of time. This is the whole idea of "synthetic people". How might that be incorporated into this as well? And how could those personas be improved over time?

---

### Assistant Response

#### 1. The Workspace Dependency Graph (DAG)

Represent interim and final deliverables as a **Directed Acyclic Graph** in `.intent/graph.json`. Upstream edits invalidate downstream nodes, triggering topological sweeps during reconciliation.

#### 2. Composing Open-Source Knowledge Skills

Bind specific skills to graph nodes in `graph.json` (`synthesize-user-research`, `market-size-analysis`, `create-executive-deck`).

#### 3. Synthetic Personas & Pre-Mortem Reviews

* **Persona Profiles (`personas/`):** Store structured goals, preferences, and skepticism triggers for key stakeholders (CFO, Eng Lead, Client).
* **Synthetic Pre-Mortem:** Have the agent review intermediate drafts using persona profiles before sending to human stakeholders.
* **Feedback Memory:** Learn from real stakeholder comments and append new preferences to persona files over time.

---

## Turn 11

### User Prompt

A few thoughts and some feedback come to mind.

The graph actually reminds me quite a bit of Obsidian. I don't use it (I currently use Joplin). But the big differentiator with Obsidian is that you're able to reference notes from other notes. This builds up a knowledge graph over time. We're suggesting something similar, but not just with local markdown files and instead with any documents -- local and remote in any format (so long as the agent has a skill to parse them and can access remote docs via API or MCP). But the real benefit with a tool like Obsidian is that it has a rich UI for navigating and viewing these documents. I guess what we're discussing is having all the documents in folders on your local hard drive. So you could theoretically use your OS's "finder" or "file explorer" to look through them. But if the documents are remote, you're either going to be seeing metadata for it or the raw data (e.g. JSON for a Google Doc) which aren't helpful. I wonder if there could be some way for the user to navigate these visually? Like perhaps an HTML page or something that let's you browse through your projects in a web browser, see all the projects, see all the documents, and then click on links for each document to open them (for Google Docs it would link you to the source obviously, not the local copy). Trying to think of some light-weight way to do this. Maybe it's a skill command and it outputs it to the console in your agent? What options do we have for that use case (i.e. letting the user navigate the projects and documents)?

On attaching the skills to the documents, that's an interesting idea but I'm not understanding the benefit. It sounds like overhead of "assigning skills to documents in the graph". That sounds really rigid. I was just suggesting that I want to make sure that the agent has access to other skills when it's working with these documents. We don't need to somehow facilitate or manage these skills. It should be open and fluid. I was thinking that we might have a skill that gets used like the following: "/open-intent-refine please update the PRD based on the comments taking the following into account ...". How does the user tell the agent to also use the "/create-prd" skill they found online or created themselves? Is that why we would need to somehow attach it to the metadata for that document?

On the personas, this is also something I think would be useful to be optional and to grow organically over time. So perhaps when a user is working on a deliverable and adds it to the graph, the skill that adds it can ask the user who the document is for? And then you could optionally tell the agent more about the target audience if you wanted to. I'm guessing many documents won't be shared at all and are just meant for intermediate analysis steps anyway (i.e. the audience is the user themselves). Or at least I think many users would start with those types of documents.

Two additional thoughts. One is around the UX. Getting the UX right here and making it really easy for users to get started is critical. If it's complicated to get started, complicated to understand how to use, feels "fragile" because you're afraid to touch anything on disk, or afraid to edit your own remote documents, no one is going to use it. It's going to feel like an entire new thing you have to learn. The skills and commands should feel consistent with what you'd be doing anyway.

The other thought is around "syncing" of the documents. So for static documents (e.g. PDF's, Excel, etc.), there's nothing to check for updates on. But for documents that can change (Google Docs, Slack threads, reports you have to query using SQL, etc.), it'd be interesting for the agent to "sync" them and then summarize what's new you might need to be aware of or take action on. So if you're working on a shared Google Doc, maybe someone made some edits or comments since you last synced it locally. Or with a Slack thread you have going with an Account Executive that owns a particular customer, maybe there were a bunch of new relevant replies in the thread sharing more about a customer issue or need. The agent could summarize all of those for you and then you could have a discussion about how to take action on them. That might be asking for clarification in Slack or updating the Google Doc (and related docs) based on comments.

---

### Assistant Response

#### 1. Visual Navigation Layer: `dashboard.html`

Instead of running a heavy web server, generate a local, static `dashboard.html` file in the project folder. Opening it in a browser provides interactive visual cards with direct links to live Google Docs, Slack threads, and local files.

#### 2. Fluid Skill Composition (No Rigid Metadata Binding)

Drop rigid schema bindings. Simply invoke skills naturally in prompt instructions:

`"/intent-update PRD using the /create-prd skill and /financial-eval skill"`

#### 3. Progressive Persona Disclosure

Personas start off completely implicit (defaulting to the user). As deliverables are shared, the agent casually asks: *"Is this for a specific audience?"* and saves persona files (`personas/sarah_cto.md`) organically.

#### 4. The "Sync & Synthesize" Daily Workflow

Run `/intent-sync` to fetch deltas from external surfaces, generate a "Morning Delta Synthesis" summarizing new Slack replies and Google Doc comments, and prompt the user on how to take action.

---

## Turn 12

### User Prompt

I'm trying to think through the simplest way for people to get started and the simplest user experience. And then the ability to do more advanced stuff if you want.

On the "get started quickly" front, I think having to set up "projects" or having to adopt some kind of new mental model for working or having to dramatically adjust your workflow is a huge amount of friction. If you're an engineer or developer, you work in sprints or towards specific releases that go through a very well-defined, often rigid, process (specs -> tech design -> code -> test -> release). A lot of knowledge work is much more fluid. So although OpenSpec is good inspiration, I don't think it translates to all knowledge work.

So perhaps that means to just have a super-simple way for users to add the documents they want to work with the agent on. And those could be sources or deliverables. It doesn't matter. Because often times, the same document can serve as both. For example, you might have a Slack thread that serves both as an input to a PRD you're working on in Google Docs, but then other interaction (perhaps a customer email) may require you to reply back into the Slack thread. In that case, the "projection" would be a new Slack reply you work with the agent on drafting.

So maybe it's just you telling the agent -- "hey, here are the important documents and threads I want to work with you on ... please keep track of them for me so that we can use them together over time". And then the agent can sync those locally whenever you want and work with you on how to respond across all of them. So maybe the simplest command is just a "add" or "start tracking" type of command. And then you can start using that source material together. The result might be some summary based on a particular intent you have (e.g. "summarize these 15 user interviews we did with a focus on feature XYZ we're evaluating"), which creates a new document for the agent to track. Or, the result might be updates to one of more documents you're tracking already.

And then there could be a "sync" or "update" command as we already discussed that looks for updates in those tracked documents. And then that lets you take action with the agent on the deltas.

And then when you take action and it's clear that there's a connection between documents, the agent can keep track of that connection (doc A is related to doc B). Maybe it's just a simple connection ("these are related in some way") or maybe it's a more complicated connection ("doc B is a summary of doc A with a focus on feature XYZ we're evaluating"). But having some memory around how documents are related to the work you're doing lets you "pick up where you left off" with the agent and not have to re-explain everything.

On the "projects", I think most people are often working more fluidly anyway. So perhaps we don't need to have documents separated into projects, but rather what's more important is whether a source is active or not any more. That might be a simpler way to think about things. Like "these are active Slack threads, Google Docs, etc. I want to keep working with you on" vs. "we don't have to work on these any more". So the next time you do an "/intent-sync" it's not doing deltas on a bunch of stuff you don't care about any more. But then you'd still have those available if you wanted to search your "memory" a bit more deeply. Not sure. Maybe like an "/intent-ask" or "/intent-research" kind of thing?

And then for understanding what's active and what's not, the agent can reason over the full list and categorize them in some way based on how you've used them. Like maybe it dynamically figures out there are eight active projects you're working on based on the things that are active. And perhaps some way to easily mark things as inactive?

I guess one challenge with the "sync" is that it forces you to take action on everything immediately because it'll summarize all the deltas across everything all at once in the agent chat thread. So it'd be really easy to lose the importance of the "deltas" if they're just all dumped on you all at once. Maybe it just puts them in a queue that you need to work? Like a task list? Like when you sync, it puts "reply in ABC Slack thread regarding XYZ", "reply to new comments from John in PRD Google Doc regarding XYZ thing", etc. Like it's a simple markdown file. And then you'd have to mark them as complete or just delete them from the list when you're done with them? And the agent could help you work on each one at a time. And that way you could also have a fresh chat thread (or multiple chat threads) for a single action item.

---

### Assistant Response

#### The Four Universal Commands of Fluid Workspace Tracking

```text
 1. /intent-track <URL/File>  ──> Adds item to active tracking list.
 2. /intent-sync             ──> Pulls deltas across active items into QUEUE.md.
 3. /intent-work <Item #>     ──> Tackles a single queue item in a focused thread.
 4. /intent-archive <Item>   ──> Silences future syncs, preserving in historical memory.

```

#### Key Elements of the Simplified Experience:

1. **No Forced "Project" Setup:** Track artifacts fluidly. Artifacts can be inputs, outputs, or both.
2. **Action Queue (`QUEUE.md`):** Deltas are buffered into a local task queue file so users aren't overwhelmed with chat walls of text.
3. **Organic Connection Inferencing:** The agent automatically records relationships between documents as you work on them.
4. **Historical Search (`/intent-ask`):** Archive quiet items to keep syncs fast, while leaving raw files searchable via programmatic local tools (`ripgrep`).

```

```
