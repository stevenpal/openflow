import type { TabularCanonical } from "../types.js";

export interface GoogleSheetsPayload {
  properties: { title: string };
  values: string[][];
}

/** Thin mapping from Google Sheets' native values grid onto the tabular canonical shape. */
export function adaptGoogleSheets(payload: GoogleSheetsPayload): TabularCanonical {
  const [headers = [], ...rows] = payload.values;
  return { sheetName: payload.properties.title, headers, rows };
}
