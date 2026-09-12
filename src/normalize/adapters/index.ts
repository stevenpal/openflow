import type { StreamShape } from "../../ledger/types.js";
import { adaptSlack } from "./slack.js";
import { adaptGoogleDocs } from "./google-docs.js";
import { adaptGoogleSheets } from "./google-sheets.js";
import { adaptGoogleSlides } from "./google-slides.js";
import { adaptWebArticle } from "./web-article.js";
import { adaptGmail } from "./gmail.js";
import { adaptRestApiResult } from "./rest-api.js";
import { adaptOtterTranscript } from "./otter-transcript.js";
import { adaptLinearIssue } from "./linear.js";
import { adaptLocalFile } from "./local-file.js";

export interface AdapterRegistration {
  shape: StreamShape;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adapt: (payload: any) => unknown;
}

export const ADAPTERS: Record<string, AdapterRegistration> = {
  slack: { shape: "chat", adapt: adaptSlack },
  "google-docs": { shape: "rich-text", adapt: adaptGoogleDocs },
  "google-sheets": { shape: "tabular", adapt: adaptGoogleSheets },
  "google-slides": { shape: "presentation", adapt: adaptGoogleSlides },
  "web-article": { shape: "web-page", adapt: adaptWebArticle },
  gmail: { shape: "email", adapt: adaptGmail },
  "rest-api": { shape: "query-result", adapt: adaptRestApiResult },
  "otter-transcript": { shape: "transcript", adapt: adaptOtterTranscript },
  linear: { shape: "task-item", adapt: adaptLinearIssue },
  "local-file": { shape: "plain-text", adapt: adaptLocalFile },
};
