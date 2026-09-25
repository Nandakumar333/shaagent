/**
 * Shared types for the shaagent CLI.
 * Centralized here to avoid circular imports between modules.
 */

export type Platform =
  | "opencode"
  | "claude-code"
  | "github-copilot"
  | "github-copilot-cli"
  | "codex"
  | "cursor"
  | "continue"
  | "windsurf"
  | "gemini-cli";

/** global = installed once for the user (home directory), project = installed in the current repo */
export type Scope = "global" | "project";

export type Suite = "development" | "jira-analyser" | "both";

export interface DatadogConfig {
  eu?: {
    url?: string;
    site?: string;
    useMcp?: boolean;
  };
  us?: {
    url?: string;
    apiUrl?: string;
    site?: string;
    accessToken?: string;
  };
}

export interface JiraConfig {
  url?: string;
  projectKey?: string;
}

export interface GitLabConfig {
  url?: string;
  projectId?: string;
}

export interface InitAnswers {
  platform: Platform;
  scope: Scope;
  suite?: Suite;
  projectName: string;
  language: string[];
  framework: string[];
  infrastructure: string;
  cicd: string;
  model: string;
  coreAgents: string[];
  optionalAgents: string[];
  skills: string[];
  datadog?: DatadogConfig;
  jira?: JiraConfig;
  gitlab?: GitLabConfig;
}

export interface RenderOptions {
  dryRun: boolean;
}
