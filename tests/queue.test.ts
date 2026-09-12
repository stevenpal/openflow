import { describe, it, expect } from "vitest";
import { renderQueueItem, parseQueueItems, appendQueueItem, removeQueueItem, groupByIntent, renderGroupedByIntent } from "../src/queue.js";
import type { QueueItem } from "../src/queue.js";

const item1: QueueItem = {
  heading: "Reply to Acme about pricing",
  streamLine: "[Slack: #sales](https://slack.com/x)",
  intent: "Close the Acme renewal",
  body: "Acme asked for a 20% discount; needs a decision by Friday.",
};
const item2: QueueItem = {
  heading: "Confirm launch date with Legal",
  streamLine: "streams/roadmap-doc/",
  intent: "Ship Q1 roadmap on time",
  body: "Legal flagged a compliance concern with the March 1 date.",
};

describe("queue document format", () => {
  it("renders an item with heading, Stream line, Intent line, and body", () => {
    const rendered = renderQueueItem(item1);
    expect(rendered).toBe(
      "## Reply to Acme about pricing\n**Stream:** [Slack: #sales](https://slack.com/x)\n**Intent:** Close the Acme renewal\n\nAcme asked for a 20% discount; needs a decision by Friday.",
    );
  });

  it("round-trips through append + parse", () => {
    let content = "";
    content = appendQueueItem(content, item1);
    content = appendQueueItem(content, item2);

    const parsed = parseQueueItems(content);
    expect(parsed).toHaveLength(2);
    expect(parsed[0]).toEqual(item1);
    expect(parsed[1]).toEqual(item2);
  });

  it("removes a resolved item by heading, leaving the rest", () => {
    let content = appendQueueItem("", item1);
    content = appendQueueItem(content, item2);

    content = removeQueueItem(content, item1.heading);
    const parsed = parseQueueItems(content);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].heading).toBe(item2.heading);
  });

  it("drops fresh-init placeholder boilerplate instead of leaving it alongside real items", () => {
    const freshlyInitialized = "# Queue\n\nNo items yet. Add streams with `/flow:add`.\n";
    const content = appendQueueItem(freshlyInitialized, item1);
    expect(content).not.toContain("No items yet");
    expect(parseQueueItems(content)).toEqual([item1]);
  });

  it("groups a multi-item, multi-intent queue by intent for cold-start resumption", () => {
    const items = [item1, item2, { ...item1, heading: "Follow up again", intent: item1.intent }];
    const groups = groupByIntent(items);
    expect(groups.get(item1.intent)).toHaveLength(2);
    expect(groups.get(item2.intent)).toHaveLength(1);

    const rendered = renderGroupedByIntent(items);
    expect(rendered.indexOf(`### ${item1.intent}`)).toBeGreaterThanOrEqual(0);
    expect(rendered.indexOf(`### ${item2.intent}`)).toBeGreaterThanOrEqual(0);
  });
});
