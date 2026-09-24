# ShaAgent

[![CI](https://github.com/Nandakumar333/shaagent/actions/workflows/ci.yml/badge.svg)](https://github.com/Nandakumar333/shaagent/actions/workflows/ci.yml)
[![Security](https://github.com/Nandakumar333/shaagent/actions/workflows/security.yml/badge.svg)](https://github.com/Nandakumar333/shaagent/actions/workflows/security.yml)
[![npm version](https://img.shields.io/npm/v/shaagent)](https://www.npmjs.com/package/shaagent)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

Scaffold a production-grade **multi-agent AI system** into any repository in 30 seconds.
Designed for distributed .NET microservices platforms (120+ services), with full support for Python and React.

```bash
npx shaagent init
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

ShaAgent supports dedicated primary agents designed for specific engineering workflows:

### 1. Orchestrator (primary feature/bugfix agent)

The Orchestrator owns the software development lifecycle. You talk to it; it delegates to sub-agents in strict sequence.

```
Feature: User → Orchestrator → [Researcher → Planner → Dev → QA → Reviewer → Reviewer-Fix] → User
Bug:     User → Orchestrator → [Debugger → Researcher → (small fix: Dev+QA | large: Planner → …)] → User
```

### 2. TicketAnalyser (primary incident & RCA agent)

TicketAnalyser automates customer incident triage, observability log analysis, code defect mapping, and root cause analysis (RCA).

```
Incident: User (Ticket #) → TicketAnalyser (Gate 0 Pre-flight) → [Jira Intake → HAR Analyzer → Telemetry Investigator (Datadog EU MCP / US Bearer Token) → Researcher (GitLab)] → RCA Published to Jira
```

- **Pre-Flight Gate 0**: Verifies Jira MCP, Datadog EU MCP / US credentials, and GitLab MCP before proceeding.
- **HAR & Correlation Extraction**: Parses `.har` network captures and extracts primary `correlationId`.
- **Regional Telemetry Routing**:
  - **EU**: Queries logs and APM spans via the Datadog MCP server (`https://app.datadoghq.com/`).
  - **US**: Queries Datadog GovCloud (`https://app.ddog-gov.com/`, API: `https://api.ddog-gov.com/`) using `accessToken` as a Bearer token (`Authorization: Bearer <accessToken>`).
- **Anti-Hallucination & Evidence Score**: Mandates attached evidence (log lines, stack trace, code lines) and computes a 0–100% confidence score. Prohibits guessing when confidence is $< 70\%$.
- **Jira Publishing**: Directly posts formatted, verified RCA reports as ticket comments via Jira MCP.

### Core Sub-Agents

| Agent                      | Role                                                                                                      |
| -------------------------- | --------------------------------------------------------------------------------------------------------- |
| **HAR Analyzer**           | Parse `.har` attachments, filter failing HTTP requests (4xx/5xx/drops), extract `correlationId` & headers |
| **Telemetry Investigator** | Query Datadog logs & APM spans by `correlationId` (EU Datadog MCP vs US Bearer Token API)                 |
| **Debugger**               | Reproduce a reported bug in a throwaway setup, confirm the failure, then delete the temp files            |
| **Researcher**             | Explore codebase, find patterns, trace stack traces to GitLab code lines/blame, surface constraints       |
| **Planner**                | Break requirements into ordered, testable steps                                                           |
| **Dev**                    | Implement code exactly per the plan                                                                       |
| **QA**                     | Write and validate tests, verify acceptance criteria                                                      |
| **Reviewer**               | Code review: correctness, security basics, quality                                                        |
| **Reviewer-Fix**           | Auto-patch blocking/major review issues                                                                   |

### Optional Sub-Agents (opt-in)

| Agent                  | Role                                                |
| ---------------------- | --------------------------------------------------- |
| Security Auditor       | OWASP-aligned security review                       |
| Architecture Reviewer  | Fitness functions, layer boundaries, ADR generation |
| Project Memory Creator | Persist decisions and patterns into docs/memory     |

---

## Supported Platforms

| Platform           | Agent file location                                    |
| ------------------ | ------------------------------------------------------ |
| **OpenCode**       | `.opencode/agents/*.md`                                |
| **Claude Code**    | `.claude/agents/*.md` + `CLAUDE.md`                    |
| GitHub Copilot     | `.github/instructions/*.instructions.md` + `AGENTS.md` |
| GitHub Copilot CLI | `.github/agents/*.agent.md`                            |
| Codex              | `AGENTS.md` (merged)                                   |
| Cursor             | `.cursor/rules/*.mdc`                                  |
| Continue           | `.continue/prompts/*.md`                               |
| Windsurf           | `.windsurf/rules/*.md`                                 |
| Gemini CLI         | `.gemini/agents/*.md` + `GEMINI.md`                    |

### Install Scope

Every install targets one of two scopes:

| Scope   | Flag        | Where files land                        | Best for                        |
| ------- | ----------- | --------------------------------------- | ------------------------------- |
| Project | `--project` | in the repo (`.claude/`, `.cursor/`, …) | committed, per-repo agent setup |
| Global  | `--global`  | home directory (`~/.claude/`, …)        | one setup across every project  |

When neither flag is passed, `shaagent init` asks. Some platforms (GitHub Copilot IDE, Windsurf) have no official global-instructions location — shaagent surfaces a caveat and writes a best-effort path.

---

## Skills

Skills are Markdown files that extend agent capabilities. They install to your
platform's global skill directory.

| Skill           | What it does                                   | Install path (OpenCode)                            |
| --------------- | ---------------------------------------------- | -------------------------------------------------- |
| `graphify`      | Codebase knowledge graph (service map, deps)   | `~/.config/opencode/skills/graphify/SKILL.md`      |
| `caveman`       | Token compression + progressive simplification | `~/.config/opencode/skills/caveman/SKILL.md`       |
| `review`        | Systematic code review (.NET-focused)          | `~/.config/opencode/skills/review/SKILL.md`        |
| `tdd`           | Red-Green-Refactor (xUnit/pytest/Vitest)       | `~/.config/opencode/skills/tdd/SKILL.md`           |
| `security-scan` | OWASP-aligned security audit for .NET          | `~/.config/opencode/skills/security-scan/SKILL.md` |
| `arch-review`   | Architecture fitness functions (microservices) | `~/.config/opencode/skills/arch-review/SKILL.md`   |

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

### TicketAnalyser Workflow Example

```
"Analyse ticket PROJ-8421, parse the attached HAR file, check Datadog telemetry, and publish an initial RCA to Jira."
```

TicketAnalyser will:

1. **Gate 0**: Verify Jira MCP, Datadog EU MCP or US Bearer token credentials, and GitLab MCP are connected.
2. Retrieve ticket details and download customer attachments via Jira MCP.
3. Delegate to **HAR Analyzer** to parse the attached `.har` file, finding the failing request (`POST /api/v2/orders/checkout` -> `500`) and extracting the `correlationId`.
4. Delegate to **Telemetry Investigator**:
   - Detect environment (EU: `https://app.datadoghq.com/` via MCP; US: `https://app.ddog-gov.com/` via Bearer token API).
   - Search logs and APM spans by `correlationId`, extracting the exact exception class and stack trace.
5. Delegate to **Researcher** via GitLab MCP to trace the stack trace to the exact repository file and line number, inspecting git blame and recent merge requests.
6. Enforce the anti-hallucination evidence rubric, compute the mandatory 0–100% confidence score, format the RCA report, and publish it as a comment to the Jira ticket.

---

## Runtime Pipeline Override

Control which agents run **per-task** directly in your prompt — no config changes needed.

### Syntax

Add pipeline instructions alongside your task:

```
"ADS-410, skip review and review-fix, include security check"
"ADS-410, fast"
"ADS-410, only dev and security"
```

### Supported keywords

| Keyword                             | Effect                                                |
| ----------------------------------- | ----------------------------------------------------- |
| `skip <agents>`                     | Remove those steps from the pipeline                  |
| `include <agents>` / `add <agents>` | Force-enable optional agents                          |
| `only <agents>`                     | Run ONLY listed agents + dev (dev is never skippable) |
| `fast` / `quick`                    | Preset: skip qa, reviewer, reviewer-fix               |
| `no review` / `skip review`         | Skip reviewer + reviewer-fix                          |
| `security only`                     | Preset: researcher + dev + security                   |
| `with memory`                       | Force project-memory-creator post-commit              |

### Examples

| Prompt                                   | Pipeline                                            |
| ---------------------------------------- | --------------------------------------------------- |
| `ADS-410, skip review and review-fix`    | RESEARCHER → PLANNER → DEV → QA → Commit            |
| `ADS-410, skip review, include security` | RESEARCHER → PLANNER → DEV → QA → SECURITY → Commit |
| `ADS-410, only dev and security`         | DEV → SECURITY → Commit                             |
| `ADS-410, fast`                          | RESEARCHER → PLANNER → DEV → Commit                 |
| `ADS-410` (no override)                  | Full pipeline                                       |

### Agent name aliases

Accepts natural variants: `review` → reviewer, `testing` → qa, `sec` → security, `memory` → project-memory-creator, `arch-review` → architecture-reviewer.

### Rules

- **Dev is never skippable** — always runs regardless of override
- Skip reviewer → automatically skips reviewer-fix
- Skip planner → automatically skips Gate 1
- Gate 2 (commit approval) always applies
- The orchestrator announces the resolved pipeline before executing

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
    "core": [
      "orchestrator",
      "debugger",
      "researcher",
      "planner",
      "dev",
      "qa",
      "reviewer",
      "reviewer-fix"
    ],
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

## Development

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

### Setup

```bash
git clone https://github.com/Nandakumar333/shaagent.git
cd shaagent
npm install       # installs deps + activates husky pre-commit hooks
npm run build
npm test
```

### Creating a Release

This project uses [Changesets](https://github.com/changesets/changesets) for automated versioning:

```bash
npx changeset            # describe your change (patch/minor/major)
git add . && git commit -m "feat: my feature"
git push                 # CI handles version bump + npm publish
```

### Pre-commit Hooks

Husky runs lint-staged on every commit, which:

- Lints and fixes TypeScript files via ESLint
- Formats all staged files via Prettier

---

## Security

- **Vulnerability scanning**: Dependabot monitors dependencies weekly
- **Static analysis**: CodeQL runs on every push/PR
- **npm audit**: Automated in CI pipeline
- **OSSF Scorecard**: Supply chain security assessment

To report a vulnerability, see [SECURITY.md](./SECURITY.md).

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development workflow, commit conventions, and PR guidelines.

---

## Requirements

- Node.js 18+
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

---

## License

[MIT](./LICENSE)
