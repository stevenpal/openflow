import type { StreamShape } from "../ledger/types.js";

export interface ChatMessage {
  author: string;
  text: string;
  ts: string;
  thread_id?: string;
}
export type ChatCanonical = ChatMessage[];

export interface RichTextBlock {
  type: "heading" | "paragraph" | "bullet" | "numbered" | "code";
  level?: number;
  text: string;
}
export interface RichTextComment {
  anchor: string;
  author: string;
  ts: string;
  text: string;
}
export interface RichTextSuggestion {
  anchor: string;
  author: string;
  ts: string;
  description: string;
}
export interface RichTextCanonical {
  title: string;
  blocks: RichTextBlock[];
  comments: RichTextComment[];
  suggestions: RichTextSuggestion[];
}

export interface TabularCanonical {
  sheetName: string;
  headers: string[];
  rows: string[][];
}

export interface PresentationSlide {
  index: number;
  title?: string;
  bullets: string[];
  notes?: string;
}
export interface PresentationCanonical {
  title: string;
  slides: PresentationSlide[];
}

export interface WebPageCanonical {
  url: string;
  title: string;
  publishedAt?: string;
  paragraphs: string[];
}

export interface EmailMessage {
  subject: string;
  from: string;
  to: string[];
  date: string;
  body: string;
}
export type EmailCanonical = EmailMessage[];

export interface QueryResultCanonical {
  source: string;
  records: Record<string, unknown>[];
}

export interface TranscriptSegment {
  speaker: string;
  start: string;
  text: string;
}
export interface TranscriptCanonical {
  title: string;
  segments: TranscriptSegment[];
}

export interface TaskItemCanonical {
  id: string;
  title: string;
  status: string;
  assignee?: string;
  description: string;
  comments: RichTextComment[];
}

export interface PlainTextCanonical {
  path: string;
  content: string;
}

export type CanonicalByShape = {
  chat: ChatCanonical;
  "rich-text": RichTextCanonical;
  tabular: TabularCanonical;
  presentation: PresentationCanonical;
  "web-page": WebPageCanonical;
  email: EmailCanonical;
  "query-result": QueryResultCanonical;
  transcript: TranscriptCanonical;
  "task-item": TaskItemCanonical;
  "plain-text": PlainTextCanonical;
};

export type Canonical<S extends StreamShape = StreamShape> = CanonicalByShape[S];
