import { describe, it, expect } from "vitest";
import { adaptSlack } from "../src/normalize/adapters/slack.js";
import { adaptGoogleDocs } from "../src/normalize/adapters/google-docs.js";
import { adaptGoogleSheets } from "../src/normalize/adapters/google-sheets.js";
import { adaptGoogleSlides } from "../src/normalize/adapters/google-slides.js";
import { adaptWebArticle } from "../src/normalize/adapters/web-article.js";
import { adaptGmail } from "../src/normalize/adapters/gmail.js";
import { adaptRestApiResult } from "../src/normalize/adapters/rest-api.js";
import { adaptOtterTranscript } from "../src/normalize/adapters/otter-transcript.js";
import { adaptLinearIssue } from "../src/normalize/adapters/linear.js";
import { adaptLocalFile } from "../src/normalize/adapters/local-file.js";

describe("Tier 1 adapters map native payloads to the canonical shape", () => {
  it("slack -> chat", () => {
    expect(
      adaptSlack({ messages: [{ user: "U1", text: "hey", ts: "123.456", thread_ts: "123.000" }] }),
    ).toEqual([{ author: "U1", text: "hey", ts: "123.456", thread_id: "123.000" }]);
  });

  it("google-docs -> rich-text, separating accepted body from suggestions", () => {
    const canonical = adaptGoogleDocs({
      title: "Plan",
      body: [
        { style: "TITLE", text: "Plan" },
        { style: "NORMAL_TEXT", text: "Accepted paragraph." },
      ],
      comments: [{ quotedText: "Accepted paragraph.", author: "Ann", createdTime: "t1", content: "nice" }],
      suggestions: [
        { quotedText: "Accepted paragraph.", author: "Bo", createdTime: "t2", suggestedText: "Better paragraph." },
      ],
    });
    expect(canonical.blocks).toEqual([{ type: "paragraph", level: undefined, text: "Accepted paragraph." }]);
    expect(canonical.suggestions).toHaveLength(1);
    expect(canonical.suggestions[0].description).toContain("Better paragraph.");
  });

  it("google-sheets -> tabular", () => {
    expect(
      adaptGoogleSheets({ properties: { title: "Sheet1" }, values: [["h1", "h2"], ["a", "b"]] }),
    ).toEqual({ sheetName: "Sheet1", headers: ["h1", "h2"], rows: [["a", "b"]] });
  });

  it("google-slides -> presentation", () => {
    const canonical = adaptGoogleSlides({
      title: "Deck",
      slides: [{ title: "S1", bodyLines: ["a"], speakerNotes: "n" }],
    });
    expect(canonical.slides).toEqual([{ index: 1, title: "S1", bullets: ["a"], notes: "n" }]);
  });

  it("web-article -> web-page", () => {
    expect(
      adaptWebArticle({ url: "https://x.com", title: "T", datePublished: "2026-01-01", textBlocks: ["p"] }),
    ).toEqual({ url: "https://x.com", title: "T", publishedAt: "2026-01-01", paragraphs: ["p"] });
  });

  it("gmail -> email", () => {
    const canonical = adaptGmail({
      messages: [
        {
          payload: { headers: [{ name: "Subject", value: "Hi" }, { name: "From", value: "a@x.com" }, { name: "To", value: "b@x.com" }] },
          snippet: "",
          internalDate: "1735689600000",
          bodyText: "hello",
        },
      ],
    });
    expect(canonical).toEqual([
      { subject: "Hi", from: "a@x.com", to: ["b@x.com"], date: new Date(1735689600000).toISOString(), body: "hello" },
    ]);
  });

  it("rest-api -> query-result", () => {
    expect(adaptRestApiResult({ endpoint: "/x", data: [{ a: 1 }] })).toEqual({ source: "/x", records: [{ a: 1 }] });
  });

  it("otter-transcript -> transcript", () => {
    expect(
      adaptOtterTranscript({ title: "Call", utterances: [{ speaker_name: "Cy", start_offset: "00:00", transcript: "hi" }] }),
    ).toEqual({ title: "Call", segments: [{ speaker: "Cy", start: "00:00", text: "hi" }] });
  });

  it("linear -> task-item", () => {
    const canonical = adaptLinearIssue({
      identifier: "ENG-1",
      title: "Fix",
      state: { name: "Todo" },
      description: "desc",
      comments: [{ body: "c1", user: { name: "Dee" }, createdAt: "t1" }],
    });
    expect(canonical.id).toBe("ENG-1");
    expect(canonical.comments[0]).toEqual({ anchor: "ENG-1", author: "Dee", ts: "t1", text: "c1" });
  });

  it("local-file -> plain-text (passthrough)", () => {
    expect(adaptLocalFile({ path: "a.txt", content: "hi" })).toEqual({ path: "a.txt", content: "hi" });
  });
});
