import type { QueryResultCanonical } from "../types.js";

export interface RestApiResultPayload {
  endpoint: string;
  data: Record<string, unknown>[];
}

/** Thin mapping from a generic REST/API JSON result onto the query-result canonical shape. */
export function adaptRestApiResult(payload: RestApiResultPayload): QueryResultCanonical {
  return { source: payload.endpoint, records: payload.data };
}
