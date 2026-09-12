import { describe, it, expect } from "vitest";
import { defaultSyncable, classificationNote } from "../src/classification.js";

describe("static/syncable classification", () => {
  it("type-default-only: a chat stream defaults to syncable", () => {
    expect(defaultSyncable("chat", false)).toBe(true);
  });

  it("type-default-only: a web page defaults to static", () => {
    expect(defaultSyncable("web-page", false)).toBe(false);
  });

  it("local-file-default-static: overrides the shape's own type default", () => {
    expect(defaultSyncable("chat", true)).toBe(false);
    expect(defaultSyncable("tabular", true)).toBe(false);
  });

  it("shows a confirmation note for a type-default classification", () => {
    const note = classificationNote({ shape: "chat", isLocalFile: false, syncable: true, overriddenByPrompt: false });
    expect(note).toContain("syncable");
    expect(note).toContain("default");
  });

  it("shows a confirmation note for a prompt-overridden classification", () => {
    const note = classificationNote({ shape: "web-page", isLocalFile: false, syncable: true, overriddenByPrompt: true });
    expect(note).toContain("syncable");
    expect(note).toContain("overriding");
  });
});
