export interface QueueItem {
  heading: string;
  streamLine: string;
  intent: string;
  body: string;
}

const QUEUE_DOC_HEADER = "# Queue";

/** Renders one item in the fixed queue document format: heading, Stream line, Intent line, body. */
export function renderQueueItem(item: QueueItem): string {
  return [`## ${item.heading}`, `**Stream:** ${item.streamLine}`, `**Intent:** ${item.intent}`, "", item.body].join(
    "\n",
  );
}

/** Parses `queue.md` content into its items, in document order. */
export function parseQueueItems(content: string): QueueItem[] {
  const lines = content.split("\n");
  const items: QueueItem[] = [];
  let current: { headingLines: string[] } | null = null;
  let block: string[] = [];

  function flush(): void {
    if (block.length === 0) return;
    const heading = block[0].replace(/^##\s+/, "");
    const streamLine = block.find((l) => l.startsWith("**Stream:**"))?.replace(/^\*\*Stream:\*\*\s*/, "") ?? "";
    const intent = block.find((l) => l.startsWith("**Intent:**"))?.replace(/^\*\*Intent:\*\*\s*/, "") ?? "";
    const bodyStart = block.findIndex((l) => l.startsWith("**Intent:**")) + 1;
    const body = block
      .slice(bodyStart)
      .join("\n")
      .replace(/^\n+/, "")
      .replace(/\n+$/, "");
    items.push({ heading, streamLine, intent, body });
    block = [];
  }

  for (const line of lines) {
    if (line.startsWith("## ")) {
      flush();
      current = { headingLines: [line] };
    }
    if (current) {
      block.push(line);
    }
  }
  flush();

  return items;
}

/** Appends a new item to the queue document, re-rendering from the parsed item list so any
 *  placeholder boilerplate (e.g. a fresh "No items yet") never lingers alongside real items. */
export function appendQueueItem(content: string, item: QueueItem): string {
  const items = [...parseQueueItems(content), item];
  return `${QUEUE_DOC_HEADER}\n\n${items.map(renderQueueItem).join("\n\n")}\n`;
}

/** Removes a resolved item from the queue document by its exact heading. Default resolution behavior. */
export function removeQueueItem(content: string, heading: string): string {
  const items = parseQueueItems(content).filter((item) => item.heading !== heading);
  if (items.length === 0) {
    return `${QUEUE_DOC_HEADER}\n\nNo items yet.\n`;
  }
  return `${QUEUE_DOC_HEADER}\n\n${items.map(renderQueueItem).join("\n\n")}\n`;
}

/** Groups items by their Intent line, for cold-start `/flow:work` resumption. */
export function groupByIntent(items: QueueItem[]): Map<string, QueueItem[]> {
  const groups = new Map<string, QueueItem[]>();
  for (const item of items) {
    const group = groups.get(item.intent) ?? [];
    group.push(item);
    groups.set(item.intent, group);
  }
  return groups;
}

/** Renders the queue grouped by intent/topic rather than as a flat chronological list. */
export function renderGroupedByIntent(items: QueueItem[]): string {
  const groups = groupByIntent(items);
  const sections = [...groups.entries()].map(
    ([intent, groupItems]) =>
      `### ${intent}\n\n${groupItems.map((item) => `- ${item.heading}`).join("\n")}`,
  );
  return sections.join("\n\n");
}
