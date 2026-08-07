/**
 * Interactive prompts for `shaagent init`
 *
 * Supports all major AI coding platforms with a single generic template set.
 * Platform selection determines output format (file structure, frontmatter, extensions).
 */

import inquirer from 'inquirer';
import type { InitAnswers, Platform, Scope } from './types';

const PLATFORMS = [
  { name: 'OpenCode            — .opencode/agents/*.md',                       value: 'opencode' },
  { name: 'Claude Code         — CLAUDE.md + .claude/agents/*.md',             value: 'claude-code' },
  { name: 'GitHub Copilot      — AGENTS.md + .github/instructions/*.md',       value: 'github-copilot' },
  { name: 'GitHub Copilot CLI  — .github/agents/*.agent.md',                   value: 'github-copilot-cli' },
  { name: 'Codex (OpenAI)      — single AGENTS.md (merged)',                   value: 'codex' },
  { name: 'Cursor              — .cursor/rules/*.mdc',                         value: 'cursor' },
  { name: 'Continue            — .continue/prompts/*.md',                      value: 'continue' },
  { name: 'Windsurf            — .windsurf/rules/*.md',                        value: 'windsurf' },
  { name: 'Gemini CLI          — GEMINI.md + .gemini/agents/*.md',             value: 'gemini-cli' },
];

const SCOPES = [
  { name: 'Project — install into this repository (.claude/, .cursor/, ... — committed with the code)', value: 'project' },
  { name: 'Global  — install once for this user (home directory — applies to every project)',           value: 'global' },
];

const CORE_AGENTS = [
  { name: 'Orchestrator  (required, always included)', value: 'orchestrator', checked: true },
  { name: 'Debugger',      value: 'debugger',      checked: true },
  { name: 'Researcher',    value: 'researcher',    checked: true },
  { name: 'Planner',       value: 'planner',       checked: true },
  { name: 'Dev',           value: 'dev',           checked: true },
  { name: 'QA',            value: 'qa',            checked: true },
  { name: 'Reviewer',      value: 'reviewer',      checked: true },
  { name: 'Reviewer-Fix',  value: 'reviewer-fix',  checked: true },
];

const OPTIONAL_AGENTS = [
  { name: 'Security Auditor',         value: 'security',               checked: false },
  { name: 'Architecture Reviewer',    value: 'architecture-reviewer',  checked: false },
  { name: 'Project Memory Creator',   value: 'project-memory-creator', checked: false },
];

const SKILLS = [
  { name: 'graphify      — codebase knowledge graph (service map, dependencies)', value: 'graphify',      checked: true },
  { name: 'caveman       — token compression + code simplification',                value: 'caveman',       checked: true },
  { name: 'review        — systematic code review checklist (.NET-focused)',        value: 'review',        checked: true },
  { name: 'tdd           — Red-Green-Refactor TDD cycle (xUnit/pytest/Vitest)',     value: 'tdd',           checked: false },
  { name: 'security-scan — OWASP-aligned security audit for .NET',                  value: 'security-scan', checked: false },
  { name: 'arch-review   — architecture fitness functions for microservices',        value: 'arch-review',   checked: false },
];

export async function prompt(platformFlag?: string, scopeFlag?: Scope): Promise<InitAnswers> {
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'scope',
      message: 'Install agents/skills globally (this user) or just for this project?',
      choices: SCOPES,
      when: !scopeFlag,
    },
    {
      type: 'list',
      name: 'platform',
      message: 'Which AI coding platform do you use?',
      choices: PLATFORMS,
      when: !platformFlag,
    },
    {
      type: 'input',
      name: 'projectName',
      message: 'Project name?',
      default: detectProjectName(),
    },
    {
      type: 'checkbox',
      name: 'language',
      message: 'Primary language(s)?',
      choices: [
        { name: 'C# / .NET',  value: 'csharp' },
        { name: 'TypeScript',  value: 'typescript' },
        { name: 'Python',      value: 'python' },
        { name: 'JavaScript',  value: 'javascript' },
        { name: 'Rust',        value: 'rust' },
        { name: 'Go',          value: 'go' },
        { name: 'Java',        value: 'java' },
      ],
    },
    {
      type: 'checkbox',
      name: 'framework',
      message: 'Framework(s)?',
      choices: [
        { name: '.NET 8 / ASP.NET Core', value: 'dotnet8' },
        { name: 'React',                  value: 'react' },
        { name: 'Next.js',                value: 'nextjs' },
        { name: 'FastAPI',                value: 'fastapi' },
        { name: 'Angular',                value: 'angular' },
        { name: 'Vue',                    value: 'vue' },
        { name: 'Spring Boot',            value: 'spring-boot' },
        { name: 'Express',                value: 'express' },
        { name: 'Mocha',                   value: 'mocha' },
      ],
    },
    {
      type: 'input',
      name: 'infrastructure',
      message: 'Infrastructure? (e.g., AWS, Azure, GCP, Kubernetes)',
      default: 'AWS + Kubernetes',
    },
    {
      type: 'input',
      name: 'cicd',
      message: 'CI/CD platform?',
      default: 'GitHub Actions',
    },
    {
      type: 'input',
      name: 'model',
      message: 'Default model? (provider/model-id)',
      default: getDefaultModel(platformFlag),
    },
    {
      type: 'checkbox',
      name: 'coreAgents',
      message: 'Select core agents to install:',
      choices: CORE_AGENTS,
    },
    {
      type: 'checkbox',
      name: 'optionalAgents',
      message: 'Select optional agents:',
      choices: OPTIONAL_AGENTS,
    },
    {
      type: 'checkbox',
      name: 'skills',
      message: 'Select skills to install:',
      choices: SKILLS,
    },
  ]);

  return {
    ...answers,
    platform: (platformFlag ?? answers.platform) as Platform,
    scope: (scopeFlag ?? answers.scope) as Scope,
    model: answers.model || getDefaultModel(answers.platform),
    // Orchestrator is always included
    coreAgents: ['orchestrator', ...answers.coreAgents.filter((a: string) => a !== 'orchestrator')],
  };
}

function getDefaultModel(platform?: string): string {
  switch (platform) {
    case 'opencode':            return 'github-copilot/claude-sonnet-4.6';
    case 'claude-code':         return 'claude-sonnet-4-20250514';
    case 'github-copilot':      return 'claude-sonnet-4.6';
    case 'github-copilot-cli':  return 'claude-sonnet-4.6';
    case 'codex':                return 'codex-1';
    case 'cursor':                return 'claude-sonnet-4.6';
    case 'continue':              return 'anthropic/claude-sonnet-4-20250514';
    case 'windsurf':              return 'claude-sonnet-4';
    case 'gemini-cli':            return 'gemini-3.1-pro';
    default:                      return 'github-copilot/claude-sonnet-4.6';
  }
}

function detectProjectName(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pkg = require(`${process.cwd()}/package.json`);
    return pkg.name ?? 'my-project';
  } catch {
    try {
      const fs = require('fs');
      const toml = fs.readFileSync(`${process.cwd()}/pyproject.toml`, 'utf-8');
      const match = toml.match(/name\s*=\s*"(.+?)"/);
      return match?.[1] ?? 'my-project';
    } catch {
      return 'my-project';
    }
  }
}
