# AGENTS.md — shaagent

> Multi-agent orchestration instructions and engineering standards for coding agents.
> Scope: entire repository.

## Project Context

- **Name:** shaagent
- **Purpose:** Production-grade multi-agent AI scaffolding framework supporting OpenCode, Claude Code, GitHub Copilot, Codex, Cursor, Continue, Windsurf, and Gemini CLI.
- **Tech Stack:** Node.js (>=18.0.0), TypeScript, Vitest, Mocha, Handlebars, Commander.js, Inquirer.js
- **CI/CD:** GitHub Actions

---

## Multi-Agent Pipeline & Roles

For software engineering and feature implementation, agents operate in the following sequential order:

```
Researcher ──▶ Planner ──▶ Developer ──▶ QA ──▶ Reviewer ──▶ Reviewer-Fix
```

| Agent            | Responsibility                                                                                      |
| ---------------- | --------------------------------------------------------------------------------------------------- |
| **Orchestrator** | Coordinates the entire pipeline, assigns tasks, gates transitions, and manages loops.               |
| **Researcher**   | Surveys the codebase, maps dependencies, traces patterns, and identifies architecture constraints.  |
| **Planner**      | Produces step-by-step implementation specs with test strategies and file maps before coding starts. |
| **Developer**    | Implements changes strictly according to the plan on dedicated branches and verifies builds.        |
| **QA**           | Writes comprehensive automated tests, validates acceptance criteria, and self-heals test failures.  |
| **Reviewer**     | Performs rigorous code reviews (correctness, security, architecture, performance, naming).          |
| **Reviewer-Fix** | Automatically patches blocking issues flagged during review.                                        |
| **Debugger**     | Reproduces bugs in isolated throwaway scratch scripts (`.shaagent-repro/`) and cleans up afterward. |

For customer tickets, incidents, and RCA:

```
Gate 0 Check ──▶ Ticket Intake ──▶ HAR Analysis ──▶ Telemetry Investigation ──▶ Codebase Investigation ──▶ Confidence Scoring ──▶ Jira RCA Publication
```

| Agent                      | Responsibility                                                                                           |
| -------------------------- | -------------------------------------------------------------------------------------------------------- |
| **Ticket Analyser**        | Primary incident triage, orchestrates investigation agents, and publishes verified dual-perspective RCA. |
| **HAR Analyzer**           | Analyzes HTTP archive (.har) network traces, isolates failing requests, and extracts correlation IDs.    |
| **Telemetry Investigator** | Queries Datadog EU (MCP) and US GovCloud (Bearer token API) logs and APM spans by correlation ID.        |

---

## Runtime & Framework Standards

### 1. Node.js Standards

- **Runtime Target**: Node.js 18+ LTS.
- **Asynchronous Execution**:
  - Use `async`/`await` consistently; avoid unhandled promise rejections.
  - Correctly manage stream pipelines using `stream.pipeline` or `events.once`.
  - Always clean up external handles, intervals, child processes, and database/network connections.
- **Modularity**:
  - Respect project module systems: CommonJS (`require` / `module.exports`) and ECMAScript Modules (`import` / `export`) according to `package.json`.
  - Maintain clean separation between CLI commands, template engines, platform mappers, and manifest managers.

### 2. Mocha & Testing Standards

- **Test Structure**:
  - Use BDD conventions with `describe()` for suites/methods and `it()` for specific scenarios.
  - Follow the **Arrange-Act-Assert (AAA)** pattern for clarity.
  - Keep test files named with `.spec.ts`, `.spec.js`, `.test.ts`, or `.test.js` located in `tests/` or alongside source.
- **Asynchronous Testing**:
  - Return Promises or use `async () => { ... }` directly in `it` blocks.
  - Do NOT combine `done` callbacks with `async/await`.
- **Isolation & Lifecycle**:
  - Use `beforeEach` and `afterEach` hooks to instantiate fresh SUTs and restore stubs/spies (`sinon.restore()`).
  - Tests must never share mutable state or depend on run order.
- **Assertions**:
  - Prefer expressive assertions using Chai (`expect(val).to.equal(...)`) or Node's `node:assert/strict`.
- **Verification Commands**:
  - Run CLI tests: `npm test`
  - Run Mocha suites: `npx mocha 'tests/**/*.spec.js'`
  - Typecheck: `npm run typecheck`
  - Build bundle: `npm run build`

---

## Development Workflow Rules

1. **Never edit production code without a verified plan or failing test.**
2. **Always run build and test verification before finishing any turn:**
   ```bash
   npm test
   npm run build
   ```
3. **Keep the git working directory clean:** throwaway scratch reproduction files must always be deleted before concluding debugging sessions.
