import type { WebPageCanonical } from "../types.js";

export interface WebArticlePayload {
  url: string;
  title: string;
  datePublished?: string;
  textBlocks: string[];
}

/** Thin mapping from a reader-view web article extraction onto the web-page canonical shape. */
export function adaptWebArticle(payload: WebArticlePayload): WebPageCanonical {
  return {
    url: payload.url,
    title: payload.title,
    publishedAt: payload.datePublished,
    paragraphs: payload.textBlocks,
  };
}
