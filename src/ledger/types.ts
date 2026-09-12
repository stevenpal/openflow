export const STREAM_SHAPES = [
  "chat",
  "rich-text",
  "tabular",
  "presentation",
  "web-page",
  "email",
  "query-result",
  "transcript",
  "task-item",
  "plain-text",
] as const;

export type StreamShape = (typeof STREAM_SHAPES)[number];

export type StreamOrigin = "source" | "derived";

export interface LedgerEntry {
  id: string;
  descriptor: string;
  type: StreamShape;
  origin: StreamOrigin;
  source_stream_ids: string[];
  syncable: boolean;
  description: string;
  intents: string[];
  added_at: string;
  last_synced_at: string | null;
}

export interface Ledger {
  streams: LedgerEntry[];
}
