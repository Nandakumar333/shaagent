# ShaAgent

Scaffold a production-grade **multi-agent AI system** into any repository in 30 seconds.
Designed for distributed .NET microservices platforms (120+ services), with full support for Python and React.

```bash
# Node / npm
npx shaagent init

# Python / pip
pip install shaagent && shaagent init
```

---

## What It Does

`shaagent init` asks you three questions and then writes a complete multi-agent system
into your repository, tailored to your chosen AI coding platform:

1. Install scope? (project — committed with the repo, or global — once for this user)
2. Which AI platform? (9 supported — see table below)
3. Which agents? (core set pre-selected, optional agents opt-in)
4. Which skills to install? (graphify, caveman, review, tdd, security-scan, arch-review)

---

## Agent System

### Orchestrator (primary agent)

The Orchestrator is the single entry point. You talk to it; it talks to sub-agents.
It owns the workflow, routes tasks, and synthesises results.

```
Feature: User → Orchestrator → [Researcher → Planner → Dev → QA → Reviewer → Reviewer-Fix] → User
Bug:     User → Orchestrator → [Debugger → Researcher → (small fix: Dev+QA | large: Planner → …)] → User
```

### Core Sub-Agents

| Agent         | Role                                                    |
|---------------|---------------------------------------------------------|
| Debugger      | Reproduce a reported bug in a throwaway setup, confirm the failure, then delete the temp files |
| Researcher    | Explore codebase, find patterns, surface constraints (also does root-cause diagnosis in the debug flow) |
| Planner       | Break requirements into ordered, testable steps         |
| Dev           | Implement code exactly per the plan                     |
| QA            | Write and validate tests, verify acceptance criteria    |
| Reviewer      | Code review: correctness, security basics, quality      |
| Reviewer-Fix  | Auto-patch blocking/major review issues                 |

### Optional Sub-Agents (opt-in)

| Agent                    | Role                                                |
|--------------------------|-----------------------------------------------------|
| Security Auditor         | OWASP-aligned security review                       |
| Architecture Reviewer    | Fitness functions, layer boundaries, ADR generation |
| Project Memory Creator   | Persist decisions and patterns into docs/memory     |

---

## Supported Platforms

| Platform             | Agent file location                        |
|----------------------|--------------------------------------------|
| **OpenCode**         | `.opencode/agents/*.md`                    |
| **Claude Code**      | `.claude/agents/*.md` + `CLAUDE.md`        |
| GitHub Copilot       | `.github/instructions/*.instructions.md` + `AGENTS.md` |
| GitHub Copilot CLI   | `.github/agents/*.agent.md`                |
| Codex                | `AGENTS.md` (merged)                       |
| Cursor               | `.cursor/rules/*.mdc`                       |
| Continue             | `.continue/prompts/*.md`                   |
| Windsurf             | `.windsurf/rules/*.md`                      |
| Gemini CLI           | `.gemini/agents/*.md` + `GEMINI.md`        |

### Install Scope

Every install targets one of two scopes:

| Scope     | Flag        | Where files land                          | Best for                        |
|-----------|-------------|-------------------------------------------|---------------------------------|
| Project   | `--project` | in the repo (`.claude/`, `.cursor/`, …)   | committed, per-repo agent setup |
| Global    | `--global`  | home directory (`~/.claude/`, …)          | one setup across every project  |

When neither flag is passed, `shaagent init` asks. Some platforms (GitHub Copilot IDE, Windsurf) have no official global-instructions location — shaagent surfaces a caveat and writes a best-effort path.

---

## Skills

Skills are Markdown files that extend agent capabilities. They install to your
platform's global skill directory.

| Skill          | What it does                                    | Install path (OpenCode)                         |
|----------------|-------------------------------------------------|-------------------------------------------------|
| `graphify`     | Codebase knowledge graph (service map, deps)    | `~/.config/opencode/skills/graphify/SKILL.md`   |
| `caveman`      | Token compression + progressive simplification  | `~/.config/opencode/skills/caveman/SKILL.md`    |
| `review`       | Systematic code review (.NET-focused)           | `~/.config/opencode/skills/review/SKILL.md`     |
| `tdd`          | Red-Green-Refactor (xUnit/pytest/Vitest)        | `~/.config/opencode/skills/tdd/SKILL.md`        |
| `security-scan`| OWASP-aligned security audit for .NET           | `~/.config/opencode/skills/security-scan/SKILL.md` |
| `arch-review`  | Architecture fitness functions (microservices)   | `~/.config/opencode/skills/arch-review/SKILL.md`|

Install a skill later:
```bash
shaagent skill install tdd
shaagent skill install security-scan --platform claude-code
```

---

## Workflow Example

Once set up, use your AI tool and talk to the **Orchestrator**:

```
"Ticket ABC-1234: Add discount calculation to the OrderService that supports promo codes
and publishes a DiscountApplied event for the NotificationService."
```

The Orchestrator will:
1. Ask **Researcher** to explore OrderService, find existing patterns, map service dependencies.
2. Ask **Planner** to create a detailed implementation plan with interfaces and acceptance criteria.
3. **PAUSE** — present the plan for your approval.
4. Ask **Dev** to implement on a feature branch following existing .NET patterns.
5. Ask **QA** to write xUnit tests covering happy path, edge cases, and integration.
6. Ask **Reviewer** to perform systematic code review (security, perf, correctness).
7. Ask **Reviewer-Fix** to patch any blocking/major issues.
8. (Auto) Ask **Security** since this touches payment-adjacent logic.
9. **PAUSE** — ask for commit message approval.
10. Commit, report final summary.
11. Ask **Project Memory Creator** to persist the architectural decision.

---

## Configuration

`shaagent.config.json` (auto-generated, edit as needed):

```json
{
  "$schema": "https://shaagent.dev/schema/v1.json",
  "platform": "opencode",
  "scope": "project",
  "model": "github-copilot/claude-sonnet-4.6",
  "project": {
    "name": "my-platform",
    "language": ["csharp", "typescript", "python"],
    "framework": ["dotnet8", "react"],
    "infrastructure": "AWS + Kubernetes",
    "cicd": "GitHub Actions"
  },
  "agents": {
    "core": ["orchestrator", "debugger", "researcher", "planner", "dev", "qa", "reviewer", "reviewer-fix"],
    "optional": ["security", "architecture-reviewer", "project-memory-creator"]
  },
  "skills": {
    "installed": ["graphify", "caveman", "review", "tdd"]
  }
}
```

---

## Commands

```bash
shaagent init                          # Interactive setup
shaagent init --yes                    # Non-interactive, all defaults
shaagent init --platform claude-code   # Skip platform prompt
shaagent init --project                # Install into this repo (skip scope prompt)
shaagent init --global                 # Install into home dir for all projects
shaagent init --dry-run                # Preview files without writing
shaagent init --yes --dry-run          # Preview defaults without writing
shaagent skill install tdd             # Install a skill
shaagent skill list                    # List available skills
shaagent list                          # Show current configuration
```

---

## Project Structure

```
your-repo/
├── .opencode/                  ← (or .claude/, .github/, .windsurf/, .gemini/, etc.)
│   └── agents/
│       ├── orchestrator.md     ← primary agent
│       ├── debugger.md
│       ├── researcher.md
│       ├── planner.md
│       ├── dev.md
│       ├── qa.md
│       ├── reviewer.md
│       ├── reviewer-fix.md
│       └── security.md         ← if opt-in selected
└── shaagent.config.json
```

---

## Requirements

- Node.js 18+ (for `npx shaagent`) **or** Python 3.10+ (for `pip install shaagent`)
- An AI coding platform (OpenCode, Claude Code, etc.) installed in your editor
- For graphify: Python 3.10+ and `pip install graphifyy`

## Target Stack

This scaffold is optimised for:
- **.NET 8 / C# 12** — 90% of services (ASP.NET Core, EF Core, MassTransit, FluentValidation)
- **Python 3.11+** — 5% (utilities, scripts, FastAPI services)
- **React 18 / TypeScript** — 5% (frontend applications)
- **Architecture:** DDD, CQRS, Event Sourcing, Clean Architecture
- **Testing:** xUnit + Moq + FluentAssertions, pytest, Vitest
- **Infrastructure:** AWS / Azure / GCP + Kubernetes

---

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full design document including:
- Agent hierarchy diagram
- Workflow routing decision rules
- Platform-to-file mapping table
- Skills system contract
- Configuration schema reference
