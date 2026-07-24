# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/nandakumar333/shaagent/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/nandakumar333How to depl/shaagent/releases/tag/v0.1.0
