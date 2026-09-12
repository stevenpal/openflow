import type { ChatCanonical } from "../types.js";

export interface SlackMessage {
  user: string;
  text: string;
  ts: string;
  thread_ts?: string;
}

export interface SlackThreadPayload {
  messages: SlackMessage[];
}

/** Thin mapping from Slack's native field names onto the shared chat/messaging canonical shape. */
export function adaptSlack(payload: SlackThreadPayload): ChatCanonical {
  return payload.messages.map((m) => ({
    author: m.user,
    text: m.text,
    ts: m.ts,
    thread_id: m.thread_ts,
  }));
}
