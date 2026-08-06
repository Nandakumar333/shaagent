# Multi-Agent Orchestration — Architecture & Design

## Overview

`shaagent` is a zero-config CLI tool that scaffolds a production-grade multi-agent system
into any repository. It uses a **single set of generic templates** that emit the correct format
for any supported AI coding platform.

It installs via **npx** (Node/npm) or **pip** (Python) and detects the host environment to emit
the correct agent configuration files tailored to your AI coding platform.

---

## Design Principles

1. **Single Template, All Platforms** — one generic template set generates agent configs for
   all 9 supported platforms: OpenCode, Claude Code, GitHub Copilot, GitHub Copilot CLI, Codex,
   Cursor, Continue, Windsurf, and Gemini CLI. Platform-specific formatting (frontmatter, file
   structure, extensions) is handled by the template engine.
2. **Orchestration-first** — a single Orchestrator agent owns the workflow; all sub-agents are
   addressed through it. No sub-agent talks to another directly.
3. **Skill-composable** — skills are installable modules (MD + optional scripts) that extend
   any agent's capability without modifying core templates.
4. **Incremental adoption** — start with the 8 core sub-agents (including Debugger); opt-in to
   advanced ones (Security, ArchReview, MemoryCreator) per repo.
5. **Convention over configuration** — sensible defaults; override via `shaagent.config.json`.
6. **Project or global scope** — install into a single repo (committed with the code) or once
   into the user's home directory (applies to every project). Selected via `--project` /
   `--global` or the interactive scope prompt.

---

## Installation Strategy

### Why dual-runtime (npx + pip)?

Most developers have either Node.js or Python. Shipping on both ensures zero friction:

| Runtime | Command              | Best for                         |
|---------|----------------------|----------------------------------|
| Node    | `npx shaagent init`  | JS/TS repos, frontend teams      |
| Python  | `pip install shaagent && shaagent init` | Python repos, data teams |

Both CLIs are thin wrappers that call the same **template engine** (TypeScript compiled to CJS,
bundled with `pkg` or `esbuild` for the npm package; ported/generated for pip via `pyproject.toml`).

---

## Repository Layout (this project)

```
shaagent/
├── packages/
│   ├── cli/                        # Node.js CLI (npx entry point)
│   │   ├── src/
│   │   │   ├── index.ts            # CLI entry, commander.js
│   │   │   ├── init.ts             # `shaagent init` command + types
│   │   │   ├── install-skill.ts    # `shaagent skill install <name>` command
│   │   │   ├── list.ts             # `shaagent list agents|skills`
│   │   │   ├── prompts.ts          # inquirer.js interactive prompts
│   │   │   ├── platforms/
│   │   │   │   └── index.ts        # scope-aware path resolver (all 9 platforms, project|global)
│   │   │   └── engine/
│   │   │       ├── template.ts     # Handlebars template renderer + platform formatter
│   │   │       ├── paths.ts        # package-resource resolver (dev monorepo vs bundled dist/)
│   │   │       └── manifest.ts     # reads/writes shaagent.config.json
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── py/                         # Python wrapper (pip entry point)
│       ├── shaagent/
│       │   ├── __init__.py
│       │   ├── cli.py              # Typer CLI, delegates to Node bundle
│       │   └── bundled/            # compiled Node bundle (included in wheel)
│       └── pyproject.toml
│
├── templates/
│   └── generic/                    # ← SINGLE template set for ALL platforms
│       └── agents/
│           ├── orchestrator.md.hbs
│           ├── debugger.md.hbs
│           ├── researcher.md.hbs
│           ├── planner.md.hbs
│           ├── dev.md.hbs
│           ├── qa.md.hbs
│           ├── reviewer.md.hbs
│           ├── reviewer-fix.md.hbs
│           └── optional/
│               ├── security.md.hbs
│               ├── architecture-reviewer.md.hbs
│               └── project-memory-creator.md.hbs
│
├── skills/                         # Built-in installable skills
│   ├── graphify/
│   │   ├── SKILL.md
│   │   └── references/
│   ├── caveman/
│   │   └── SKILL.md
│   ├── tdd/
│   │   └── SKILL.md
│   ├── security-scan/
│   │   └── SKILL.md
│   └── arch-review/
│       └── SKILL.md
│
├── shaagent.config.schema.json   # JSON Schema for project config
├── ARCHITECTURE.md                 # this file
└── README.md
```

---

## How the Single-Template Strategy Works

The template engine follows this flow:

```
[Generic .hbs Template] ──► [Handlebars Render (inject variables)] ──► [Platform Formatter] ──► [Output File]
```

### What the Generic Template Contains
- YAML frontmatter: `name`, `description`, `model` (Handlebars variable)
- Markdown body: full agent instructions (platform-agnostic)

### What the Platform Formatter Does

| Platform | Frontmatter Transform | File Extension | Output Location |
|----------|----------------------|----------------|-----------------|
| OpenCode | Adds `mode`, `temperature`, `permission` | `.md` | `.opencode/agents/` |
| Claude Code | Strips frontmatter, adds HTML comment | `.md` | `.claude/agents/` + root `CLAUDE.md` |
| GitHub Copilot | Converts to `applyTo` frontmatter | `.instructions.md` | `.github/instructions/` + root `AGENTS.md` |
| GitHub Copilot CLI | Converts to `name`, `description` frontmatter | `.agent.md` | `.github/agents/` |
| Codex | Merges ALL into single file | `AGENTS.md` | repo root |
| Cursor | Converts to `description`, `globs`, `alwaysApply` | `.mdc` | `.cursor/rules/` |
| Continue | Plain markdown with title header | `.md` | `.continue/prompts/` |
| Windsurf | Converts to `trigger`, `description` frontmatter | `.md` | `.windsurf/rules/` |
| Gemini CLI | Strips frontmatter, adds HTML comment | `.md` | `.gemini/agents/` + root `GEMINI.md` |

Under **global** scope the output location moves to the platform's home-directory equivalent
(e.g. `~/.config/opencode/agents/`, `~/.claude/agents/`, `~/.copilot/agents/`); the frontmatter
transform and extension are unchanged.

### Root Instruction Files

Some platforms expect a root file that references individual agents:

| Platform | Root File | Content |
|----------|-----------|---------|
| Claude Code | `CLAUDE.md` | `@.claude/agents/orchestrator.md` imports |
| GitHub Copilot | `AGENTS.md` | Pipeline overview + reference to `.github/instructions/` |
| Codex | `AGENTS.md` | Full merged content (all agents in one file) |
| Gemini CLI | `GEMINI.md` | `@.gemini/agents/*.md` imports + project context |

---

## Agent Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER / DEVELOPER                         │
└──────────────────────────────┬──────────────────────────────────┘
                               │  natural language task
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                     ORCHESTRATOR AGENT                          │
│  • Parses intent → selects workflow                             │
│  • Owns task state & routing                                    │
│  • Delegates to sub-agents via explicit handoff messages        │
│  • Collects & synthesises results                               │
│  • Reports back to user                                         │
└──────┬───────┬────────┬───────┬────────┬───────────────────────┘
       │       │        │       │        │
  ┌────▼──┐ ┌──▼───┐ ┌──▼──┐ ┌─▼──┐ ┌───▼──────┐
  │Resear-│ │Plann-│ │ Dev │ │ QA │ │ Reviewer │
  │  cher │ │  er  │ │     │ │    │ │          │
  └───────┘ └──────┘ └──┬──┘ └──┬─┘ └─────┬────┘
                         │       │          │
                         └───────┼──────────┘
                                 │ findings / issues
                                 ▼
                         ┌───────────────┐
                         │ Reviewer-Fix  │
                         │ (auto-patch)  │
                         └───────────────┘

  Optional sub-agents (opt-in per repo):
  ┌──────────┐  ┌──────────────────────┐  ┌───────────────────────┐
  │ Security │  │ Architecture         │  │ Project Memory        │
  │  Auditor │  │ Reviewer             │  │ Creator               │
  └──────────┘  └──────────────────────┘  └───────────────────────┘
```

---

## Workflow — Standard Feature Lifecycle

```
User task
    │
    ▼
[Orchestrator] ─► [Researcher]   → background research, existing patterns
    │
    ▼
[Orchestrator] ─► [Planner]      → step-by-step implementation plan
    │
    ▼
[Orchestrator] ─► [Dev]          → code implementation
    │
    ▼
[Orchestrator] ─► [QA]           → test generation + execution
    │
    ▼
[Orchestrator] ─► [Reviewer]     → code review, standards check
    │
    ├─ (issues found) ─► [Reviewer-Fix] → automated patch + re-review loop
    │
    └─ (approved) ─────► [Orchestrator] → summary to user
```

---

## Workflow — Bug / Debug Lifecycle

Triggered when the request is a defect (error, crash, wrong output, regression) instead of a new requirement.

```
Bug report
    │
    ▼
[Orchestrator] ─► [Debugger]     → throwaway reproduction, confirm failure, capture evidence,
    │                              then DELETE all temp files (git tree left clean)
    │  ├─ cannot reproduce ─► ask user for missing steps/env, halt
    ▼
[Orchestrator] ─► [Researcher]   → root-cause diagnosis, blast radius, fix options
    │                              writes {bug}-diagnosis.md
    ▼
⛔ GATE D — user reviews diagnosis: fix it? (yes / not now)
    │
    ├─ small & straightforward ─► [Dev] fix → [QA] regression test → Gate 2 (commit)
    │
    └─ large / risky / cross-service ─► [Planner] → standard feature pipeline (Gate 1 …)
```

The Debugger only ever creates and then removes temporary reproduction files; it never edits production code. Root cause and the fix belong to Researcher and Dev respectively.

---

## Platform → File Mapping

| Platform | Agent files location (project) | Global location | Root instruction file | Extension |
|----------|-------------------------------|-----------------|----------------------|-----------|
| OpenCode | `.opencode/agents/` | `~/.config/opencode/agents/` | — | `.md` |
| Claude Code | `.claude/agents/` | `~/.claude/agents/` | `CLAUDE.md` (with `@` imports) | `.md` |
| GitHub Copilot | `.github/instructions/` | `~/.config/github-copilot/instructions/` * | `AGENTS.md` (repo root) | `.instructions.md` |
| GitHub Copilot CLI | `.github/agents/` | `~/.copilot/agents/` | — | `.agent.md` |
| Codex (OpenAI) | repo root (merged) | `~/.codex/AGENTS.md` | `AGENTS.md` (all-in-one) | `.md` |
| Cursor | `.cursor/rules/` | `~/.cursor/rules/` | — | `.mdc` |
| Continue | `.continue/prompts/` | `~/.continue/prompts/` | — | `.md` |
| Windsurf | `.windsurf/rules/` | `~/.windsurf/rules/` * | — | `.md` |
| Gemini CLI | `.gemini/agents/` | `~/.gemini/agents/` | `GEMINI.md` (with `@` imports) | `.md` |

\* No officially documented per-file global location — shaagent writes a best-effort path and
surfaces a caveat during init.

---

## Install Scope: Project vs Global

Every install resolves to one of two scopes, chosen via `--project` (default), `--global`, or
the interactive scope prompt:

| Scope   | Base directory      | Committed with code? | Use case                          |
|---------|---------------------|----------------------|-----------------------------------|
| project | `process.cwd()`     | yes                  | per-repo agent setup, team-shared |
| global  | `os.homedir()`      | no                   | one setup applied to every repo   |

`getPlatformPaths(platform, scope)` resolves the correct `agentsDir`, `skillsDir`, root
instruction file, and any platform caveat `note` for the chosen scope. The `note` is printed to
the user during init (e.g. GitHub Copilot IDE and Windsurf lack official per-file global paths).

---

## Skills System

Skills are Markdown files that agents load on demand. They follow a strict contract:

```
skills/<skill-name>/
├── SKILL.md        ← the agent reads this; contains instructions + tool usage
└── references/     ← optional supporting docs, scripts, examples
    └── *.md
```

### Built-in skills

| Skill          | Purpose                                                    |
|----------------|------------------------------------------------------------|
| `graphify`     | Turn any codebase/docs into a queryable knowledge graph    |
| `caveman`      | Simplify complex code to minimal working examples          |
| `tdd`          | Enforce Red-Green-Refactor TDD cycles                      |
| `security-scan`| OWASP-aligned security audit for code changes              |
| `arch-review`  | Architecture fitness function evaluation                   |

Skills install to the platform-correct path:
- OpenCode: `~/.config/opencode/skills/<name>/SKILL.md`
- Claude Code: `~/.claude/skills/<name>/SKILL.md`
- GitHub Copilot: `.github/copilot-skills/<name>/SKILL.md`
- Codex: `.codex/skills/<name>/SKILL.md`
- Cursor: `.cursor/skills/<name>/SKILL.md`
- Continue: `.continue/skills/<name>/SKILL.md`

---

## Configuration File: `shaagent.config.json`

```json
{
  "$schema": "https://shaagent.dev/schema/v1.json",
  "platform": "github-copilot",
  "scope": "project",
  "model": "claude-sonnet-4",
  "project": {
    "name": "my-app",
    "language": ["typescript", "python"],
    "framework": ["nextjs", "fastapi"],
    "infrastructure": "AWS + Kubernetes",
    "cicd": "GitHub Actions"
  },
  "agents": {
    "core": ["orchestrator", "debugger", "researcher", "planner", "dev", "qa", "reviewer", "reviewer-fix"],
    "optional": ["security", "architecture-reviewer"]
  },
  "skills": {
    "installed": ["graphify", "tdd", "caveman"]
  }
}
```

---

## Init Interactive Flow

```
$ npx shaagent init

  ╔══════════════════════════════════════╗
  ║         shaagent init                ║
  ╚══════════════════════════════════════╝

  ? Install agents/skills globally (this user) or just for this project?
    ❯ Project — install into this repository (committed with the code)
      Global  — install once for this user (home directory)

  ? Which AI coding platform do you use?
    ❯ OpenCode            — .opencode/agents/*.md
      Claude Code         — CLAUDE.md + .claude/agents/*.md
      GitHub Copilot      — AGENTS.md + .github/instructions/*.md
      GitHub Copilot CLI  — .github/agents/*.agent.md
      Codex (OpenAI)      — single AGENTS.md (merged)
      Cursor              — .cursor/rules/*.mdc
      Continue            — .continue/prompts/*.md
      Windsurf            — .windsurf/rules/*.md
      Gemini CLI          — GEMINI.md + .gemini/agents/*.md

  ? Project name? (auto-detected)
    > my-app

  ? Primary language(s)?
    ◉ TypeScript
    ◉ Python
    ◯ C# / .NET
    ◯ Rust

  ? Framework(s)?
    ◉ Next.js
    ◉ FastAPI
    ◯ React

  ? Infrastructure?
    > AWS + Kubernetes

  ? CI/CD platform?
    > GitHub Actions

  ? Default model? (provider/model-id)
    > claude-sonnet-4

  ? Select core agents to install: (all checked by default)
    ◉ Orchestrator  (required)
    ◉ Debugger
    ◉ Researcher
    ◉ Planner
    ◉ Dev
    ◉ QA
    ◉ Reviewer
    ◉ Reviewer-Fix

  ? Select optional agents:
    ◯ Security Auditor
    ◯ Architecture Reviewer
    ◯ Project Memory Creator

  ? Select skills to install:
    ◉ graphify  (knowledge graph for your codebase)
    ◉ caveman   (simplify complex code)
    ◯ tdd       (test-driven development)
    ◯ security-scan

  ✔ Agent files written
  ✔ Skills installed: graphify, caveman

  ✅ Multi-agent setup complete!
     Agents written:
       · .github/instructions/orchestrator.instructions.md
       · .github/instructions/debugger.instructions.md
       · .github/instructions/researcher.instructions.md
       · .github/instructions/planner.instructions.md
       · .github/instructions/dev.instructions.md
       · .github/instructions/qa.instructions.md
       · .github/instructions/reviewer.instructions.md
       · .github/instructions/reviewer-fix.instructions.md
       · AGENTS.md

     Start with: open your AI tool and ask the Orchestrator for help.
```

---

## Platform Compatibility Matrix

| Feature | OpenCode | Claude Code | GH Copilot | GH Copilot CLI | Codex | Cursor | Continue | Windsurf | Gemini CLI |
|---------|----------|-------------|------------|----------------|-------|--------|----------|----------|------------|
| Individual agent files | ✅ | ✅ | ✅ | ✅ | ❌ (merged) | ✅ | ✅ | ✅ | ✅ |
| YAML frontmatter | ✅ | ❌ | ✅ (`applyTo`) | ✅ (`name`) | ❌ | ✅ | ❌ | ✅ (`trigger`) | ❌ |
| Root instruction file | ❌ | ✅ `CLAUDE.md` | ✅ `AGENTS.md` | ❌ | ✅ `AGENTS.md` | ❌ | ❌ | ❌ | ✅ `GEMINI.md` |
| Permission system | ✅ (native) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Mode (primary/subagent) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ (`trigger`) | ❌ |
| Path-scoped rules | ❌ | ✅ (`paths:`) | ✅ (`applyTo:`) | ❌ | ❌ | ✅ (`globs:`) | ❌ | ❌ | ❌ |
| Skills support | ✅ (native) | ✅ (skills/) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Global scope | ✅ | ✅ | ⚠ best-effort | ✅ | ✅ | ✅ | ✅ | ⚠ best-effort | ✅ |
