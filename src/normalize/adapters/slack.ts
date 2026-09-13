import type { ChatCanonical } from "../types.js";

export interface SlackMessage {
  user: string;
  username: string;
  user_email: string;
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
    author: `${m.username} <${m.user_email}>`,
    text: m.text,
    ts: new Date(Number.parseFloat(m.ts) * 1000).toISOString(),
    thread_id: m.thread_ts,
  }));
}
