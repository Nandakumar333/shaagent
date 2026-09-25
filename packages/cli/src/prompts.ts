/**
 * Interactive prompts for `shaagent init`
 *
 * Supports all major AI coding platforms with a single generic template set.
 * Platform selection determines output format (file structure, frontmatter, extensions).
 */

import inquirer from "inquirer";
import type { InitAnswers, Platform, Scope, Suite } from "./types";

export const PLATFORMS = [
  { name: "OpenCode            — .opencode/agents/*.md", value: "opencode" },
  {
    name: "Claude Code         — CLAUDE.md + .claude/agents/*.md",
    value: "claude-code",
  },
  {
    name: "GitHub Copilot      — AGENTS.md + .github/instructions/*.md",
    value: "github-copilot",
  },
  {
    name: "GitHub Copilot CLI  — .github/agents/*.agent.md",
    value: "github-copilot-cli",
  },
  { name: "Codex (OpenAI)      — single AGENTS.md (merged)", value: "codex" },
  { name: "Cursor              — .cursor/rules/*.mdc", value: "cursor" },
  { name: "Continue            — .continue/prompts/*.md", value: "continue" },
  { name: "Windsurf            — .windsurf/rules/*.md", value: "windsurf" },
  {
    name: "Gemini CLI          — GEMINI.md + .gemini/agents/*.md",
    value: "gemini-cli",
  },
];

export const SCOPES = [
  {
    name: "Project — install into this repository (.claude/, .cursor/, ... — committed with the code)",
    value: "project",
  },
  {
    name: "Global  — install once for this user (home directory — applies to every project)",
    value: "global",
  },
];

export const SUITES = [
  {
    name: "Development Suite  — Orchestrator and subagents for software development (Dev, QA, Reviewer, Debugger, Planner...)",
    value: "development",
  },
  {
    name: "Jira Analyser Suite — JiraAnalyser and subagents for ticket & RCA analysis (HAR Analyzer, Telemetry Investigator...)",
    value: "jira-analyser",
  },
  {
    name: "Both Suites         — Install both Orchestrator & JiraAnalyser suites",
    value: "both",
  },
];

export const DEV_CORE_AGENTS = [
  {
    name: "Orchestrator  (required, always included)",
    value: "orchestrator",
    checked: true,
  },
  { name: "Debugger", value: "debugger", checked: true },
  { name: "Researcher", value: "researcher", checked: true },
  { name: "Planner", value: "planner", checked: true },
  { name: "Dev", value: "dev", checked: true },
  { name: "QA", value: "qa", checked: true },
  { name: "Reviewer", value: "reviewer", checked: true },
  { name: "Reviewer-Fix", value: "reviewer-fix", checked: true },
];

export const JIRA_CORE_AGENTS = [
  {
    name: "Ticket Analyser        (required, primary triage & RCA agent)",
    value: "ticket-analyser",
    checked: true,
  },
  {
    name: "HAR Analyzer           (HTTP Archive parser & correlation extractor)",
    value: "har-analyzer",
    checked: true,
  },
  {
    name: "Telemetry Investigator (Datadog EU MCP vs US ddog-gov.com logs & traces)",
    value: "telemetry-investigator",
    checked: true,
  },
  {
    name: "Researcher             (Codebase investigation via GitLab MCP / repo)",
    value: "researcher",
    checked: true,
  },
  {
    name: "Debugger               (Reproduction script generation & verification)",
    value: "debugger",
    checked: false,
  },
];

export const BOTH_CORE_AGENTS = [
  {
    name: "Orchestrator           (required, always included for development)",
    value: "orchestrator",
    checked: true,
  },
  {
    name: "Ticket Analyser        (required, primary triage & RCA agent)",
    value: "ticket-analyser",
    checked: true,
  },
  {
    name: "HAR Analyzer           (HTTP Archive parser & correlation extractor)",
    value: "har-analyzer",
    checked: true,
  },
  {
    name: "Telemetry Investigator (Datadog EU MCP vs US ddog-gov.com logs & traces)",
    value: "telemetry-investigator",
    checked: true,
  },
  { name: "Debugger", value: "debugger", checked: true },
  { name: "Researcher", value: "researcher", checked: true },
  { name: "Planner", value: "planner", checked: true },
  { name: "Dev", value: "dev", checked: true },
  { name: "QA", value: "qa", checked: true },
  { name: "Reviewer", value: "reviewer", checked: true },
  { name: "Reviewer-Fix", value: "reviewer-fix", checked: true },
];

export const OPTIONAL_AGENTS = [
  { name: "Security Auditor", value: "security", checked: false },
  {
    name: "Architecture Reviewer",
    value: "architecture-reviewer",
    checked: false,
  },
  {
    name: "Project Memory Creator",
    value: "project-memory-creator",
    checked: false,
  },
];

export const SKILLS = [
  {
    name: "graphify      — codebase knowledge graph (service map, dependencies)",
    value: "graphify",
    checked: true,
  },
  {
    name: "caveman       — token compression + code simplification",
    value: "caveman",
    checked: true,
  },
  {
    name: "review        — systematic code review checklist (.NET-focused)",
    value: "review",
    checked: true,
  },
  {
    name: "tdd           — Red-Green-Refactor TDD cycle (xUnit/pytest/Vitest)",
    value: "tdd",
    checked: false,
  },
  {
    name: "security-scan — OWASP-aligned security audit for .NET",
    value: "security-scan",
    checked: false,
  },
  {
    name: "arch-review   — architecture fitness functions for microservices",
    value: "arch-review",
    checked: false,
  },
];

export async function prompt(
  platformFlag?: string,
  scopeFlag?: Scope,
  suiteFlag?: Suite,
): Promise<InitAnswers> {
  const answers: Record<string, any> = await inquirer.prompt([
    // Step 2: Global or Project scope
    {
      type: "list",
      name: "scope",
      message:
        "Install agents/skills globally (this user) or just for this project?",
      choices: SCOPES,
      when: !scopeFlag,
    },
    // Step 3: Agent suite choice
    {
      type: "list",
      name: "suite",
      message: "Which agent suite would you like to install?",
      choices: SUITES,
      when: !suiteFlag,
    },
    // Step 4: Required questions based on chosen agent suite
    {
      type: "list",
      name: "platform",
      message: "Which AI coding platform do you use?",
      choices: PLATFORMS,
      when: !platformFlag,
    },
    {
      type: "input",
      name: "projectName",
      message: "Project name?",
      default: detectProjectName(),
    },
    // Development-specific questions
    {
      type: "checkbox",
      name: "language",
      message: "Primary language(s)?",
      choices: [
        { name: "C# / .NET", value: "csharp" },
        { name: "TypeScript", value: "typescript" },
        { name: "Python", value: "python" },
        { name: "JavaScript", value: "javascript" },
        { name: "Rust", value: "rust" },
        { name: "Go", value: "go" },
        { name: "Java", value: "java" },
      ],
      when: (ans: any) => (ans.suite ?? suiteFlag) !== "jira-analyser",
    },
    {
      type: "checkbox",
      name: "framework",
      message: "Framework(s)?",
      choices: [
        { name: ".NET 8 / ASP.NET Core", value: "dotnet8" },
        { name: "React", value: "react" },
        { name: "Next.js", value: "nextjs" },
        { name: "FastAPI", value: "fastapi" },
        { name: "Angular", value: "angular" },
        { name: "Vue", value: "vue" },
        { name: "Spring Boot", value: "spring-boot" },
        { name: "Express", value: "express" },
        { name: "Mocha", value: "mocha" },
      ],
      when: (ans: any) => (ans.suite ?? suiteFlag) !== "jira-analyser",
    },
    {
      type: "input",
      name: "infrastructure",
      message: "Infrastructure? (e.g., AWS, Azure, GCP, Kubernetes)",
      default: "AWS + Kubernetes",
      when: (ans: any) => (ans.suite ?? suiteFlag) !== "jira-analyser",
    },
    {
      type: "input",
      name: "cicd",
      message: "CI/CD platform?",
      default: "GitHub Actions",
      when: (ans: any) => (ans.suite ?? suiteFlag) !== "jira-analyser",
    },
    // Jira Analyser-specific questions
    {
      type: "input",
      name: "jiraUrl",
      message: "Jira URL? (e.g., https://your-domain.atlassian.net)",
      default: "https://your-domain.atlassian.net",
      when: (ans: any) => (ans.suite ?? suiteFlag) !== "development",
    },
    {
      type: "input",
      name: "jiraProjectKey",
      message: "Jira Project Key? (e.g., PROJ, SUPPORT)",
      default: "PROJ",
      when: (ans: any) => (ans.suite ?? suiteFlag) !== "development",
    },
    {
      type: "input",
      name: "datadogEuUrl",
      message: "Datadog EU Web UI URL?",
      default: "https://app.datadoghq.com/",
      when: (ans: any) => (ans.suite ?? suiteFlag) !== "development",
    },
    {
      type: "password",
      name: "datadogUsAccessToken",
      message:
        "Datadog US GovCloud Access Token? (Bearer token for https://api.ddog-gov.com/, leave empty if not used)",
      mask: "*",
      when: (ans: any) => (ans.suite ?? suiteFlag) !== "development",
    },
    {
      type: "input",
      name: "gitlabUrl",
      message:
        "GitLab URL? (e.g., https://gitlab.com, leave empty if not used)",
      default: "",
      when: (ans: any) => (ans.suite ?? suiteFlag) !== "development",
    },
    {
      type: "input",
      name: "gitlabProjectId",
      message: "GitLab Project ID or Path? (e.g., 12345 or group/project)",
      default: "",
      when: (ans: any) => {
        const isJira = (ans.suite ?? suiteFlag) !== "development";
        return isJira && Boolean(ans.gitlabUrl);
      },
    },
    // Model selection
    {
      type: "input",
      name: "model",
      message: "Default model? (provider/model-id)",
      default: (ans: any) => getDefaultModel(platformFlag ?? ans.platform),
    },
    // Agents selection based on chosen suite
    {
      type: "checkbox",
      name: "devCoreAgents",
      message: "Select core development agents to install:",
      choices: DEV_CORE_AGENTS,
      when: (ans: any) =>
        (ans.suite ?? suiteFlag ?? "development") === "development",
    },
    {
      type: "checkbox",
      name: "jiraCoreAgents",
      message: "Select Jira Analyser agents to install:",
      choices: JIRA_CORE_AGENTS,
      when: (ans: any) => (ans.suite ?? suiteFlag) === "jira-analyser",
    },
    {
      type: "checkbox",
      name: "bothCoreAgents",
      message: "Select core agents to install:",
      choices: BOTH_CORE_AGENTS,
      when: (ans: any) => (ans.suite ?? suiteFlag) === "both",
    },
    {
      type: "checkbox",
      name: "optionalAgents",
      message: "Select optional agents:",
      choices: OPTIONAL_AGENTS,
      when: (ans: any) => (ans.suite ?? suiteFlag) !== "jira-analyser",
    },
    {
      type: "checkbox",
      name: "skills",
      message: "Select skills to install:",
      choices: SKILLS,
    },
  ] as any);

  const selectedPlatform = (platformFlag ?? answers.platform) as Platform;
  const selectedScope = (scopeFlag ?? answers.scope) as Scope;
  const selectedSuite: Suite = (suiteFlag ??
    answers.suite ??
    "development") as Suite;

  // Resolve coreAgents based on suite choice
  let coreAgents: string[] = [];
  if (selectedSuite === "development") {
    const rawDev =
      answers.devCoreAgents ??
      answers.coreAgents ??
      DEV_CORE_AGENTS.map((a) => a.value);
    coreAgents = [
      "orchestrator",
      ...rawDev.filter((a: string) => a !== "orchestrator"),
    ];
  } else if (selectedSuite === "jira-analyser") {
    const rawJira =
      answers.jiraCoreAgents ??
      answers.coreAgents ??
      JIRA_CORE_AGENTS.filter((a) => a.checked).map((a) => a.value);
    coreAgents = [
      "ticket-analyser",
      ...rawJira.filter((a: string) => a !== "ticket-analyser"),
    ];
  } else {
    // 'both'
    const rawBoth =
      answers.bothCoreAgents ??
      answers.coreAgents ??
      BOTH_CORE_AGENTS.map((a) => a.value);
    coreAgents = [
      "orchestrator",
      "ticket-analyser",
      ...rawBoth.filter(
        (a: string) => a !== "orchestrator" && a !== "ticket-analyser",
      ),
    ];
  }

  // Construct datadog, jira, gitlab objects if applicable
  const hasDatadog = Boolean(
    answers.datadogEuUrl || answers.datadogUsAccessToken,
  );
  const datadog = hasDatadog
    ? {
        eu: {
          url: answers.datadogEuUrl || "https://app.datadoghq.com/",
          site: (answers.datadogEuUrl || "").includes("datadoghq.eu")
            ? "datadoghq.eu"
            : "datadoghq.com",
          useMcp: true,
        },
        ...(answers.datadogUsAccessToken
          ? {
              us: {
                url: "https://app.ddog-gov.com/",
                apiUrl: "https://api.ddog-gov.com/",
                site: "ddog-gov.com",
                accessToken: answers.datadogUsAccessToken,
              },
            }
          : {}),
      }
    : undefined;

  const hasJira = Boolean(answers.jiraUrl || answers.jiraProjectKey);
  const jira = hasJira
    ? {
        url: answers.jiraUrl || "https://your-domain.atlassian.net",
        projectKey: answers.jiraProjectKey || "PROJ",
      }
    : undefined;

  const hasGitlab = Boolean(answers.gitlabUrl);
  const gitlab = hasGitlab
    ? {
        url: answers.gitlabUrl,
        projectId: answers.gitlabProjectId || "",
      }
    : undefined;

  return {
    platform: selectedPlatform,
    scope: selectedScope,
    suite: selectedSuite,
    projectName: answers.projectName || detectProjectName(),
    language: answers.language ?? [],
    framework: answers.framework ?? [],
    infrastructure: answers.infrastructure ?? "",
    cicd: answers.cicd ?? "",
    model: answers.model || getDefaultModel(selectedPlatform),
    coreAgents,
    optionalAgents: answers.optionalAgents ?? [],
    skills: answers.skills ?? [],
    datadog,
    jira,
    gitlab,
  };
}

export function getDefaultModel(platform?: string): string {
  switch (platform) {
    case "opencode":
      return "github-copilot/claude-sonnet-4.6";
    case "claude-code":
      return "claude-sonnet-4-20250514";
    case "github-copilot":
      return "claude-sonnet-4.6";
    case "github-copilot-cli":
      return "claude-sonnet-4.6";
    case "codex":
      return "codex-1";
    case "cursor":
      return "claude-sonnet-4.6";
    case "continue":
      return "anthropic/claude-sonnet-4-20250514";
    case "windsurf":
      return "claude-sonnet-4";
    case "gemini-cli":
      return "gemini-3.1-pro";
    default:
      return "github-copilot/claude-sonnet-4.6";
  }
}

function detectProjectName(): string {
  try {
    const pkg = require(`${process.cwd()}/package.json`);
    return pkg.name ?? "my-project";
  } catch {
    try {
      const fs = require("fs");
      const toml = fs.readFileSync(`${process.cwd()}/pyproject.toml`, "utf-8");
      const match = toml.match(/name\s*=\s*"(.+?)"/);
      return match?.[1] ?? "my-project";
    } catch {
      return "my-project";
    }
  }
}
