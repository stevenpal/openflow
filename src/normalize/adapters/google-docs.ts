import type { RichTextBlock, RichTextCanonical } from "../types.js";

export interface GoogleDocsParagraph {
  style: "TITLE" | "HEADING_1" | "HEADING_2" | "NORMAL_TEXT" | "BULLET" | "NUMBERED" | "CODE";
  text: string;
}
export interface GoogleDocsComment {
  quotedText: string;
  author: string;
  createdTime: string;
  content: string;
}
export interface GoogleDocsSuggestion {
  quotedText: string;
  author: string;
  createdTime: string;
  suggestedText: string;
}
export interface GoogleDocsPayload {
  title: string;
  body: GoogleDocsParagraph[];
  comments: GoogleDocsComment[];
  suggestions: GoogleDocsSuggestion[];
}

const HEADING_LEVEL: Record<string, number> = { HEADING_1: 1, HEADING_2: 2 };

function blockType(style: GoogleDocsParagraph["style"]): RichTextBlock["type"] {
  if (style === "BULLET") return "bullet";
  if (style === "NUMBERED") return "numbered";
  if (style === "CODE") return "code";
  if (style.startsWith("HEADING")) return "heading";
  return "paragraph";
}

/** Thin mapping from Google Docs' native paragraph styles onto the rich-text canonical shape. */
export function adaptGoogleDocs(payload: GoogleDocsPayload): RichTextCanonical {
  return {
    title: payload.title,
    blocks: payload.body
      .filter((p) => p.style !== "TITLE")
      .map((p) => ({
        type: blockType(p.style),
        level: HEADING_LEVEL[p.style],
        text: p.text,
      })),
    comments: payload.comments.map((c) => ({
      anchor: c.quotedText,
      author: c.author,
      ts: c.createdTime,
      text: c.content,
    })),
    suggestions: payload.suggestions.map((s) => ({
      anchor: s.quotedText,
      author: s.author,
      ts: s.createdTime,
      description: `replace with: ${s.suggestedText}`,
    })),
  };
}
