/**
 * Shared types for the shaagent CLI.
 * Centralized here to avoid circular imports between modules.
 */

export type Platform =
  | 'opencode'
  | 'claude-code'
  | 'github-copilot'
  | 'github-copilot-cli'
  | 'codex'
  | 'cursor'
  | 'continue'
  | 'windsurf'
  | 'gemini-cli';

/** global = installed once for the user (home directory), project = installed in the current repo */
export type Scope = 'global' | 'project';

export interface InitAnswers {
  platform: Platform;
  scope: Scope;
  projectName: string;
  language: string[];
  framework: string[];
  infrastructure: string;
  cicd: string;
  model: string;
  coreAgents: string[];
  optionalAgents: string[];
  skills: string[];
}

export interface RenderOptions {
  dryRun: boolean;
}
