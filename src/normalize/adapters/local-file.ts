import type { PlainTextCanonical } from "../types.js";

export interface LocalFilePayload {
  path: string;
  content: string;
}

/** Passthrough mapping for local plain text/code/config files onto the plain-text canonical shape. */
export function adaptLocalFile(payload: LocalFilePayload): PlainTextCanonical {
  return { path: payload.path, content: payload.content };
}
