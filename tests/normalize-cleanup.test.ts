import { describe, it, expect } from "vitest";
import { cleanup } from "../src/normalize/cleanup.js";

describe("shared clean-up", () => {
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
    const chatRendered = "**alice** _t1_\nhi   \n\n**bob** _t2_\nyo";
    const transcriptRendered = "# Call\n\n[00:00] **A:** hello   ";

    for (const rendered of [chatRendered, transcriptRendered]) {
      const once = cleanup(rendered);
      const twice = cleanup(once);
      expect(twice).toBe(once);
    }
  });
});
