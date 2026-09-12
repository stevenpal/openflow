import { describe, it, expect } from "vitest";
import {
  renderChat,
  renderRichText,
  renderTabular,
  renderPresentation,
  renderWebPage,
  renderEmail,
  renderQueryResult,
  renderTranscript,
  renderTaskItem,
  renderPlainText,
} from "../src/normalize/render.js";

describe("shared renderers (fixture in -> target format out)", () => {
  it("renders chat as a Markdown transcript", () => {
    const out = renderChat([{ author: "alice", text: "hi", ts: "2026-01-01T00:00:00Z" }]);
    expect(out).toBe("**alice** _2026-01-01T00:00:00Z_\nhi");
  });

  it("renders tabular as CSV, quoting cells that need it", () => {
    const out = renderTabular({
      sheetName: "Sheet1",
      headers: ["name", "note"],
      rows: [["a", "has, a comma"]],
    });
    expect(out).toBe('name,note\na,"has, a comma"');
  });

  it("renders presentation slides in order with notes", () => {
    const out = renderPresentation({
      title: "Q1 Plan",
      slides: [{ index: 1, title: "Intro", bullets: ["point one"], notes: "say hi" }],
    });
    expect(out).toBe("# Q1 Plan\n\n## Slide 1: Intro\n- point one\n\n_Notes: say hi_");
  });

  it("renders a web page with title, url, and paragraphs", () => {
    const out = renderWebPage({ url: "https://example.com", title: "Example", paragraphs: ["p1", "p2"] });
    expect(out).toBe("# Example\n\nhttps://example.com\n\np1\n\np2");
  });

  it("renders an email thread oldest first", () => {
    const out = renderEmail([
      { subject: "Re: Hi", from: "b@x.com", to: ["a@x.com"], date: "2026-01-02", body: "reply" },
      { subject: "Hi", from: "a@x.com", to: ["b@x.com"], date: "2026-01-01", body: "hello" },
    ]);
    expect(out.indexOf("## Hi")).toBeLessThan(out.indexOf("## Re: Hi"));
  });

  it("renders query-result as JSON", () => {
    const out = renderQueryResult({ source: "GET /x", records: [{ a: 1 }] });
    expect(JSON.parse(out)).toEqual({ source: "GET /x", records: [{ a: 1 }] });
  });

  it("renders a transcript with timestamps and speakers", () => {
    const out = renderTranscript({
      title: "Standup",
      segments: [{ speaker: "Bo", start: "00:01", text: "status update" }],
    });
    expect(out).toBe("# Standup\n\n[00:01] **Bo:** status update");
  });

  it("renders a task item with status and comments", () => {
    const out = renderTaskItem({
      id: "T-1",
      title: "Fix bug",
      status: "In Progress",
      description: "details",
      comments: [{ anchor: "T-1", author: "cy", ts: "2026-01-01", text: "looking now" }],
    });
    expect(out).toContain("**Status:** In Progress");
    expect(out).toContain("- **cy** (2026-01-01): looking now");
  });

  it("passes plain text through unchanged", () => {
    expect(renderPlainText({ path: "a.txt", content: "raw content\n" })).toBe("raw content\n");
  });

  it("renders rich-text with accepted body separate from comments/suggestions", () => {
    const out = renderRichText({
      title: "Doc",
      blocks: [{ type: "paragraph", text: "accepted content" }],
      comments: [],
      suggestions: [],
    });
    expect(out).toContain("# Doc");
    expect(out).toContain("accepted content");
    expect(out).toContain("## Comments");
    expect(out).toContain("## Pending Suggestions");
  });
});
