import fs from "node:fs";
import { writeSnapshot } from "./streams/storage.js";

export interface SyncFinding {
  id: string;
  changed: boolean;
  failure?: string;
  /** Unified diff (`--- previous` / `+++ current` with `@@` hunks), present only when changed. */
  diffText?: string;
}

/**
 * Shortest edit script between two line arrays via the Myers diff algorithm, mirroring the
 * approach `diff`/`git diff` use so lines that recur verbatim (e.g. running-tally CSV rows)
 * are matched positionally instead of by set membership.
 */
function myersDiff(srcLines: string[], dstLines: string[]): Array<{ type: " " | "+" | "-"; text: string }> {
  const n = srcLines.length;
  const m = dstLines.length;
  const max = n + m;

  // v[k] = furthest-reaching x on diagonal k for the current D; offset by max to allow negative k.
  const v = new Array<number>(2 * max + 1).fill(0);
  const offset = max;
  const trace: number[][] = [];

  let x = 0;
  let y = 0;
  let foundAtD = -1;

  outer: for (let d = 0; d <= max; d++) {
    trace.push(v.slice());
    for (let k = -d; k <= d; k += 2) {
      const down = k === -d || (k !== d && v[offset + k - 1] < v[offset + k + 1]);
      x = down ? v[offset + k + 1] : v[offset + k - 1] + 1;
      y = x - k;

      while (x < n && y < m && srcLines[x] === dstLines[y]) {
        x++;
        y++;
      }

      v[offset + k] = x;

      if (x >= n && y >= m) {
        foundAtD = d;
        break outer;
      }
    }
  }

  const result: Array<{ type: " " | "+" | "-"; text: string }> = [];
  x = n;
  y = m;

  for (let d = foundAtD; d > 0; d--) {
    const prevV = trace[d];
    const k = x - y;
    const down = k === -d || (k !== d && prevV[offset + k - 1] < prevV[offset + k + 1]);
    const prevK = down ? k + 1 : k - 1;
    const prevX = prevV[offset + prevK];
    const prevY = prevX - prevK;

    while (x > prevX && y > prevY) {
      x--;
      y--;
      result.unshift({ type: " ", text: srcLines[x] });
    }

    if (down) {
      y--;
      result.unshift({ type: "+", text: dstLines[y] });
    } else {
      x--;
      result.unshift({ type: "-", text: srcLines[x] });
    }
  }

  while (x > 0 && y > 0) {
    x--;
    y--;
    result.unshift({ type: " ", text: srcLines[x] });
  }

  return result;
}

function splitLines(text: string): string[] {
  const lines = text.split("\n");
  // A trailing "\n" produces a phantom empty final element; drop it so it doesn't show up as a
  // spurious blank context/removed/added line.
  if (lines.length > 0 && lines[lines.length - 1] === "") {
    lines.pop();
  }
  return lines;
}

/**
 * Renders a stream's prior -> current normalized snapshot change as unified-diff text (the
 * `--- `/`+++ `/`@@ ... @@` format `diff -u`/`git diff` produce) — the shape an LLM reader
 * already knows how to reason about, with hunk headers giving line numbers and `contextLines`
 * of surrounding context on each side. Returns "" when the two snapshots are identical.
 *
 * Line numbers follow unified-diff convention closely but are not guaranteed byte-identical to
 * GNU diff/git output (e.g. zero-length hunk edge cases) — this is meant for an agent to read,
 * not for `patch` to apply.
 */
export function formatUnifiedDiff(previous: string | null, current: string, contextLines = 3): string {
  const prevLines = splitLines(previous ?? "");
  const currLines = splitLines(current);
  const diff = myersDiff(prevLines, currLines);

  const changeRuns: Array<{ start: number; end: number }> = [];
  let i = 0;
  while (i < diff.length) {
    if (diff[i].type === " ") {
      i++;
      continue;
    }
    const start = i;
    while (i < diff.length && diff[i].type !== " ") i++;
    changeRuns.push({ start, end: i });
  }
  if (changeRuns.length === 0) {
    return "";
  }

  // Merge change runs whose unchanged gap is small enough that their expanded context would
  // overlap, so we don't emit two hunks that would otherwise share lines.
  const hunkRanges: Array<{ start: number; end: number }> = [{ ...changeRuns[0] }];
  for (const run of changeRuns.slice(1)) {
    const last = hunkRanges[hunkRanges.length - 1];
    if (run.start - last.end <= 2 * contextLines) {
      last.end = run.end;
    } else {
      hunkRanges.push({ ...run });
    }
  }

  // prevLineAt(i)/currLineAt(i): 1-based line number on that side at diff index i, regardless of
  // whether diff[i] itself belongs to that side.
  const prevLineAt: number[] = [];
  const currLineAt: number[] = [];
  let p = 1;
  let c = 1;
  for (const e of diff) {
    prevLineAt.push(p);
    currLineAt.push(c);
    if (e.type !== "+") p++;
    if (e.type !== "-") c++;
  }

  const out = ["--- previous", "+++ current"];
  for (const hunk of hunkRanges) {
    const from = Math.max(0, hunk.start - contextLines);
    const to = Math.min(diff.length, hunk.end + contextLines);
    const slice = diff.slice(from, to);
    const prevCount = slice.filter((e) => e.type !== "+").length;
    const currCount = slice.filter((e) => e.type !== "-").length;
    // Canonical unified-diff convention: a zero-length side reports the line *before* which the
    // change happens (0 at the very start of the file), not the next line number.
    const prevStart = prevCount === 0 ? prevLineAt[from] - 1 : prevLineAt[from];
    const currStart = currCount === 0 ? currLineAt[from] - 1 : currLineAt[from];

    out.push(`@@ -${prevStart},${prevCount} +${currStart},${currCount} @@`);
    for (const e of slice) {
      out.push(`${e.type}${e.text}`);
    }
  }

  return out.join("\n");
}

export type RetrievalResult = { ok: true; normalizedContent: string } | { ok: false; failure: string };

/**
 * The structured finding a per-stream sync subagent reports back to the main sync agent: either
 * a changed/unchanged result with diff highlights, or — on any retrieval failure — the specific
 * cause, leaving the stream at its last good snapshot rather than guessing or overwriting it.
 */
export function applyStreamSync(root: string, streamId: string, ext: string, retrieval: RetrievalResult): SyncFinding {
  if (!retrieval.ok) {
    return { id: streamId, changed: false, failure: retrieval.failure };
  }

  const result = writeSnapshot(root, streamId, "normalized", ext, retrieval.normalizedContent);
  const previousContent = result.previousPath ? fs.readFileSync(result.previousPath, "utf8") : null;

  return {
    id: streamId,
    changed: result.changed,
    diffText: result.changed ? formatUnifiedDiff(previousContent, retrieval.normalizedContent) : undefined,
  };
}

export type LocalFileReadResult = { ok: true; content: string } | { ok: false; reason: string };

/** Detects a moved/renamed local file source before attempting to read it, for uniform failure reporting. */
export function readLocalFileSource(path: string): LocalFileReadResult {
  if (!fs.existsSync(path)) {
    return { ok: false, reason: `file not found at recorded path "${path}" (it may have moved or been renamed)` };
  }
  return { ok: true, content: fs.readFileSync(path, "utf8") };
}
