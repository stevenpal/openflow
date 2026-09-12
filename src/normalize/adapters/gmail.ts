import type { EmailCanonical } from "../types.js";

export interface GmailMessage {
  payload: { headers: { name: string; value: string }[] };
  snippet: string;
  internalDate: string;
  bodyText: string;
}
export interface GmailThreadPayload {
  messages: GmailMessage[];
}

function header(message: GmailMessage, name: string): string {
  return message.payload.headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";
}

/** Thin mapping from Gmail's native message/header shape onto the email canonical shape. */
export function adaptGmail(payload: GmailThreadPayload): EmailCanonical {
  return payload.messages.map((m) => ({
    subject: header(m, "Subject"),
    from: header(m, "From"),
    to: header(m, "To")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    date: new Date(Number.parseInt(m.internalDate, 10)).toISOString(),
    body: m.bodyText,
  }));
}
