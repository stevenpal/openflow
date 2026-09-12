import { describe, it, expect } from "vitest";
import { adaptGoogleDocs } from "../src/normalize/adapters/google-docs.js";
import { renderRichText } from "../src/normalize/render.js";

describe("structured rich-text: accepted-state body vs. separate comment/track-changes sections", () => {
  it("excludes a pending suggestion from the body but includes it in the track-changes section", () => {
    const canonical = adaptGoogleDocs({
      title: "Proposal",
      body: [
        { style: "TITLE", text: "Proposal" },
        { style: "NORMAL_TEXT", text: "We will ship on Friday." },
      ],
      comments: [{ quotedText: "ship on Friday", author: "Ann", createdTime: "2026-01-01", content: "confirm?" }],
      suggestions: [
        {
          quotedText: "ship on Friday",
          author: "Bo",
          createdTime: "2026-01-02",
          suggestedText: "ship on Monday",
        },
      ],
    });

    const rendered = renderRichText(canonical);
    const body = rendered.slice(0, rendered.indexOf("## Comments"));

    expect(body).toContain("We will ship on Friday.");
    expect(body).not.toContain("ship on Monday");
    expect(rendered).toContain("## Pending Suggestions");
    expect(rendered).toContain("ship on Monday");
  });

  it("a later re-sync with the suggestion accepted moves the change into the body", () => {
    const beforeAccept = adaptGoogleDocs({
      title: "Doc",
      body: [{ style: "NORMAL_TEXT", text: "old text" }],
      comments: [],
      suggestions: [{ quotedText: "old text", author: "Bo", createdTime: "t1", suggestedText: "new text" }],
    });
    const afterAccept = adaptGoogleDocs({
      title: "Doc",
      body: [{ style: "NORMAL_TEXT", text: "new text" }],
      comments: [],
      suggestions: [],
    });

    const before = renderRichText(beforeAccept);
    const after = renderRichText(afterAccept);

    expect(before).not.toContain("# Doc\n\nnew text");
    expect(before).toContain("new text"); // only inside Pending Suggestions
    expect(after).toContain("new text");
    expect(after.includes("## Pending Suggestions\n\n_none_")).toBe(true);
  });
});
