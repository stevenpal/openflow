import type { TaskItemCanonical } from "../types.js";

export interface LinearIssuePayload {
  identifier: string;
  title: string;
  state: { name: string };
  assignee?: { name: string };
  description: string;
  comments: { body: string; user: { name: string }; createdAt: string }[];
}

/** Thin mapping from Linear's native issue shape onto the task-item canonical shape. */
export function adaptLinearIssue(payload: LinearIssuePayload): TaskItemCanonical {
  return {
    id: payload.identifier,
    title: payload.title,
    status: payload.state.name,
    assignee: payload.assignee?.name,
    description: payload.description,
    comments: payload.comments.map((c) => ({
      anchor: payload.identifier,
      author: c.user.name,
      ts: c.createdAt,
      text: c.body,
    })),
  };
}
