import type { StreamShape } from "./ledger/types.js";

/** Type default for whether a newly added source stream is syncable, before any prompt override. */
const SYNCABLE_BY_TYPE_DEFAULT: Record<StreamShape, boolean> = {
  chat: true,
  "rich-text": true,
  tabular: true,
  presentation: true,
  email: true,
  "query-result": true,
  "task-item": true,
  transcript: true,
  "web-page": false,
  "plain-text": false,
};

/**
 * The type default a newly added source stream gets before any explicit intent in the add prompt
 * overrides it. Local files always default to static, since most local files aren't actively
 * being revised, regardless of what shape their content happens to be.
 */
export function defaultSyncable(shape: StreamShape, isLocalFile: boolean): boolean {
  if (isLocalFile) {
    return false;
  }
  return SYNCABLE_BY_TYPE_DEFAULT[shape];
}

export interface ClassificationNoteParams {
  shape: StreamShape;
  isLocalFile: boolean;
  syncable: boolean;
  overriddenByPrompt: boolean;
}

/** The confirmation note `/flow:add` shows after every classification, default or overridden. */
export function classificationNote(params: ClassificationNoteParams): string {
  const { shape, isLocalFile, syncable, overriddenByPrompt } = params;
  const label = syncable ? "syncable" : "static";
  const defaultReason = isLocalFile
    ? "local files default to static"
    : `${shape} streams default to ${defaultSyncable(shape, isLocalFile) ? "syncable" : "static"}`;

  if (overriddenByPrompt) {
    return `Tracked as **${label}** — overriding the default (${defaultReason}) based on what you said.`;
  }
  const flip = syncable ? "static" : "syncable";
  return `Tracked as **${label}** (${defaultReason}) — say the word if you'd rather this stay ${flip}.`;
}
