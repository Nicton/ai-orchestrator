// Jira integration contract stub.
// Intentionally contains NO live credentials/tokens.
//
// Goal: keep the orchestrator code wired to a stable API surface,
// while auth + real Jira REST calls are implemented later.

import { z } from 'zod';

export const jiraConfigSchema = z.object({
  enabled: z.boolean().default(false),
  baseUrl: z.string().url().optional(), // e.g. https://your-domain.atlassian.net
  email: z.string().email().optional(),
  apiToken: z.string().min(1).optional(),
  projectKey: z.string().min(1).optional(),
});

export type JiraConfig = z.infer<typeof jiraConfigSchema>;

export type JiraCreateIssueInput = {
  summary: string;
  descriptionMarkdown?: string;
  issueType?: string; // e.g. Story/Task/Bug
  labels?: string[];
  externalIdempotencyKey?: string;
};

export type JiraIssueRef = {
  id?: string;
  key?: string;
  url?: string;
};

export async function jiraCreateIssue(_cfg: JiraConfig, _input: JiraCreateIssueInput): Promise<JiraIssueRef> {
  // TODO: implement Jira REST API call.
  // For now return empty ref to make it explicit it's a stub.
  return {};
}

export async function jiraFindIssueByMarker(_cfg: JiraConfig, _marker: string): Promise<JiraIssueRef | null> {
  // TODO: implement JQL search by a marker label/custom field.
  return null;
}
