# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.4] - 2026-08-07

### Added
- **Runtime Pipeline Override** — control which agents run per-task directly in the prompt. Supports `skip`, `include`, `only`, `fast`/`quick` keywords and agent name aliases. No config changes or re-scaffolding needed. Dev is never skippable; Gate 2 always applies.

## [0.2.0] - 2026-07-31

### Added
- **Three new AI coding platforms** (now 9 total):
  - GitHub Copilot CLI (`.github/agents/*.agent.md`, global `~/.copilot/agents/`)
  - Windsurf (`.windsurf/rules/*.md`, workflows in `.windsurf/workflows/`)
  - Gemini CLI (`GEMINI.md` + `.gemini/agents/*.md` via `@`-imports)
- **Install scope** — choose where agents/skills land:
  - `--project` (default) writes into the current repository (committed with the code).
  - `--global` writes once into the user's home directory (applies to every project).
  - Interactive scope prompt when neither flag is passed; `shaagent list` now shows the scope.
- **Debugger** core agent — reproduces a reported bug in a throwaway setup, confirms the failure, then deletes the temp files. Drives a dedicated bug/debug lifecycle (Debugger → Researcher root-cause → small fix or full pipeline). Included in the default core set.
- **CI/CD prompt** during `shaagent init` (default `GitHub Actions`); value flows into generated agent context.
- Expanded interactive choices: languages now include JavaScript, Go, and Java; frameworks now include Angular, Vue, Spring Boot, and Express.
- Platform caveats surfaced during init (e.g. GitHub Copilot IDE has no official global-instructions file; Windsurf documents only a single global rules file).

### Changed
- Centralized package-resource resolution in `engine/paths.ts` — templates and skills resolve correctly in both development (monorepo) and bundled (`dist/`) npm installs.
- Per-platform plan/review/memory directories and root instruction files (`CLAUDE.md`, `AGENTS.md`, `GEMINI.md`) generated for the new platforms.

## [0.1.2] - 2026-07-25

### Fixed
- Skills now install to project-local directory (`.opencode/skills/`, `.claude/skills/`) instead of global home directory. Previously, selecting skills during `shaagent init` would write them to `~/.config/opencode/skills/` where they were invisible in the project.

## [0.1.0] - 2026-07-25

### Added
- Initial release of `shaagent` CLI.
- `shaagent init` — interactive setup wizard with platform detection.
- `shaagent init --yes` — non-interactive mode with sensible defaults.
- `shaagent init --dry-run` — preview output without writing files.
- `shaagent skill install <name>` — install built-in skills.
- `shaagent skill list` — list available skills.
- `shaagent list` — show current configuration.
- Support for 6 AI coding platforms:
  - OpenCode (`.opencode/agents/*.md`)
  - Claude Code (`CLAUDE.md` + `.claude/agents/*.md`)
  - GitHub Copilot (`AGENTS.md` + `.github/instructions/*.instructions.md`)
  - Codex / OpenAI (single merged `AGENTS.md`)
  - Cursor (`.cursor/rules/*.mdc`)
  - Continue (`.continue/prompts/*.md`)
- 7 core agent templates (Orchestrator, Researcher, Planner, Dev, QA, Reviewer, Reviewer-Fix).
- 3 optional agent templates (Security, Architecture Reviewer, Project Memory Creator).
- 6 built-in skills (graphify, caveman, review, tdd, security-scan, arch-review).
- Single generic Handlebars template set with per-platform formatting.
- JSON Schema for `shaagent.config.json` validation.
- Python wrapper package (delegates to Node bundle, pure-Python fallback).
- CI/CD pipeline with GitHub Actions (lint, test, build, publish).

### Security
- Input validation for skill names (path traversal protection).
- No network calls, no user data collection, no secrets handling.

[Unreleased]: https://github.com/nandakumar333/shaagent/compare/v0.2.4...HEAD
[0.2.4]: https://github.com/nandakumar333/shaagent/compare/v0.2.0...v0.2.4
[0.2.0]: https://github.com/nandakumar333/shaagent/compare/v0.1.2...v0.2.0
[0.1.2]: https://github.com/nandakumar333/shaagent/compare/v0.1.0...v0.1.2
[0.1.0]: https://github.com/nandakumar333/shaagent/releases/tag/v0.1.0
