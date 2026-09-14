/**
 * Deterministic clean-up shared by every non-plain-text shape's agent verbatim-extraction path.
 * Removes run-to-run formatting noise (trailing whitespace, bullet marker variance, blank-line
 * runs, heading spacing) without touching the actual extracted wording. Idempotent by
 * construction: every step normalizes toward a single fixed form.
 */
export function cleanup(text: string): string {
  const normalizedNewlines = text.replace(/\r\n/g, "\n");
  const lines = normalizedNewlines.split("\n").map((line) =>
    line
      .replace(/\s+$/g, "")
      .replace(/^\s*[*•]\s+/, "- ")
      .replace(/^(#{1,6})([^\s#])/, "$1 $2"),
  );

  const collapsed: string[] = [];
  for (const line of lines) {
    const isBlank = line.length === 0;
    const prevBlank = collapsed.length > 0 && collapsed[collapsed.length - 1].length === 0;
    if (isBlank && prevBlank) {
      continue;
    }
    collapsed.push(line);
  }

  return collapsed.join("\n").replace(/^\n+/, "").replace(/\n+$/, "\n");
}
