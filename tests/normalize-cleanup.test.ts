import { describe, it, expect } from "vitest";
import { cleanup } from "../src/normalize/cleanup.js";
import { renderChat, renderTranscript } from "../src/normalize/render.js";

describe("Tier 2 shared clean-up", () => {
  it("normalizes bullet markers, heading spacing, trailing whitespace, and blank-line runs", () => {
    const messy = "#Title  \n\n\n\n* item one   \n•  item two\n";
    const cleaned = cleanup(messy);
    expect(cleaned).toBe("# Title\n\n- item one\n- item two\n");
  });

  it("is idempotent", () => {
    const messy = "#Title\n* a\n\n\n\n* b   \n";
    const once = cleanup(messy);
    const twice = cleanup(once);
    expect(twice).toBe(once);
  });

  it("is shape-agnostic: idempotent across a chat fixture and a transcript fixture", () => {
    const chatRendered = renderChat([
      { author: "alice", text: "hi   ", ts: "t1" },
      { author: "bob", text: "yo", ts: "t2" },
    ]);
    const transcriptRendered = renderTranscript({
      title: "Call",
      segments: [{ speaker: "A", start: "00:00", text: "hello   " }],
    });

    for (const rendered of [chatRendered, transcriptRendered]) {
      const once = cleanup(rendered);
      const twice = cleanup(once);
      expect(twice).toBe(once);
    }
  });
});
