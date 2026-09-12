export type IntentOperation =
  | { kind: "sharpen"; match: string; replacement: string }
  | { kind: "add"; text: string }
  | { kind: "drop"; match: string };

export class IntentOperationError extends Error {}

/**
 * Applies one in-place intents rewrite to a stream's current intents list. The judgment call of
 * which operation applies (sharpen an existing entry vs. add a distinct one vs. drop a stale one)
 * is the calling command's (agent's) to make; this helper only applies the chosen operation
 * deterministically, shared by `/flow:add`, `/flow:sync`, and `/flow:work`.
 */
export function applyIntentOperation(intents: string[], op: IntentOperation): string[] {
  switch (op.kind) {
    case "sharpen": {
      const index = intents.indexOf(op.match);
      if (index === -1) {
        throw new IntentOperationError(`no existing intent exactly matches "${op.match}"`);
      }
      const next = [...intents];
      next[index] = op.replacement;
      return next;
    }
    case "add": {
      if (intents.includes(op.text)) {
        throw new IntentOperationError(`intent "${op.text}" already exists`);
      }
      return [...intents, op.text];
    }
    case "drop": {
      const index = intents.indexOf(op.match);
      if (index === -1) {
        throw new IntentOperationError(`no existing intent exactly matches "${op.match}"`);
      }
      return [...intents.slice(0, index), ...intents.slice(index + 1)];
    }
  }
}
