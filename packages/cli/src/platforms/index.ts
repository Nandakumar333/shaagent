/**
 * Platform path resolvers — returns where agent files and skills live
 * for each supported AI platform, for either a repo-local ("project")
 * install or a home-directory ("global") install.
 *
 * Sources (July 2026):
 * - OpenCode: .opencode/agents/*.md ; global ~/.config/opencode/agents/*.md
 * - Claude Code: CLAUDE.md (root) + .claude/agents/*.md ; global ~/.claude/agents + ~/.claude/CLAUDE.md
 * - GitHub Copilot (IDE): AGENTS.md + .github/instructions/*.md.
 *   No official filesystem location for personal/global instructions (they live in the
 *   editor's user profile settings) — the global path below is a best-effort convention
 *   the user can paste into VS Code settings manually.
 * - GitHub Copilot CLI: .github/agents/*.agent.md ; global ~/.copilot/agents/*.agent.md
 * - Codex (OpenAI): AGENTS.md (nearest wins) ; global ~/.codex/AGENTS.md
 * - Cursor: .cursor/rules/*.mdc ; global ~/.cursor/rules/*.mdc
 * - Continue: .continue/prompts/*.md ; global ~/.continue/prompts/*.md (~/.continue is Continue's real global config dir)
 * - Windsurf: .windsurf/rules/*.md, workflows in .windsurf/workflows/ ; global rules best-effort
 *   under ~/.windsurf/rules (Windsurf's only documented global file is the single
 *   ~/.windsurf/global_rules.md — per-file global rules are not officially documented),
 *   global workflows at the documented ~/.codeium/windsurf/global_workflows/
 * - Gemini CLI: GEMINI.md (@-imports .gemini/agents/*.md) ; global ~/.gemini/GEMINI.md + ~/.gemini/agents/*.md
 */

import path from 'path';
import os from 'os';
import type { Platform, Scope } from '../init';

export interface PlatformPaths {
  /** Where individual agent .md files go */
  agentsDir: string;
  /** Where SKILL.md files go */
  skillsDir: string;
  /** Main config/instruction file path */
  configFile: string;
  /** File extension for agent files */
  extension: string;
  /** Whether this platform uses a single merged file or individual files */
  mergedFile: boolean;
  /** Optional: root instruction file that imports/references agents */
  rootInstructionFile?: string;
  /** Optional caveat surfaced to the user (e.g. no official global support) */
  note?: string;
}

export function getPlatformPaths(platform: Platform, scope: Scope = 'project'): PlatformPaths {
  const base = scope === 'global' ? os.homedir() : process.cwd();

  const map: Record<Platform, PlatformPaths> = {
    'opencode': scope === 'global' ? {
      agentsDir:  path.join(base, '.config', 'opencode', 'agents'),
      skillsDir:  path.join(base, '.config', 'opencode', 'skills'),
      configFile: 'opencode.json',
      extension:  '.md',
      mergedFile: false,
    } : {
      agentsDir:  path.join(base, '.opencode', 'agents'),
      skillsDir:  path.join(base, '.opencode', 'skills'),
      configFile: 'opencode.json',
      extension:  '.md',
      mergedFile: false,
    },
    'claude-code': {
      agentsDir:  path.join(base, '.claude', 'agents'),
      skillsDir:  path.join(base, '.claude', 'skills'),
      configFile: 'CLAUDE.md',
      extension:  '.md',
      mergedFile: false,
      rootInstructionFile: path.join(base, 'CLAUDE.md'),
    },
    'github-copilot': scope === 'global' ? {
      agentsDir:  path.join(base, '.config', 'github-copilot', 'instructions'),
      skillsDir:  path.join(base, '.config', 'github-copilot', 'copilot-skills'),
      configFile: 'copilot-instructions.md',
      extension:  '.instructions.md',
      mergedFile: false,
      rootInstructionFile: path.join(base, '.config', 'github-copilot', 'AGENTS.md'),
      note: 'GitHub Copilot (IDE) has no official global-instructions file — copy these into your VS Code user settings to apply them everywhere.',
    } : {
      agentsDir:  path.join(base, '.github', 'instructions'),
      skillsDir:  path.join(base, '.github', 'copilot-skills'),
      configFile: '.github/copilot-instructions.md',
      extension:  '.instructions.md',
      mergedFile: false,
      rootInstructionFile: path.join(base, 'AGENTS.md'),
    },
    'github-copilot-cli': {
      agentsDir:  scope === 'global' ? path.join(base, '.copilot', 'agents') : path.join(base, '.github', 'agents'),
      skillsDir:  scope === 'global' ? path.join(base, '.copilot', 'skills') : path.join(base, '.github', 'copilot-cli-skills'),
      configFile: 'copilot-instructions.md',
      extension:  '.agent.md',
      mergedFile: false,
    },
    'codex': scope === 'global' ? {
      agentsDir:  path.join(base, '.codex'),
      skillsDir:  path.join(base, '.codex', 'skills'),
      configFile: 'AGENTS.md',
      extension:  '.md',
      mergedFile: true,
    } : {
      agentsDir:  base,
      skillsDir:  path.join(base, '.codex', 'skills'),
      configFile: 'AGENTS.md',
      extension:  '.md',
      mergedFile: true,   // Codex prefers a single AGENTS.md
    },
    'cursor': {
      agentsDir:  path.join(base, '.cursor', 'rules'),
      skillsDir:  path.join(base, '.cursor', 'skills'),
      configFile: '.cursorrules',
      extension:  '.mdc',
      mergedFile: false,
    },
    'continue': {
      agentsDir:  path.join(base, '.continue', 'prompts'),
      skillsDir:  path.join(base, '.continue', 'skills'),
      configFile: '.continue/config.json',
      extension:  '.md',
      mergedFile: false,
    },
    'windsurf': {
      agentsDir:  path.join(base, '.windsurf', 'rules'),
      skillsDir:  scope === 'global'
        ? path.join(base, '.codeium', 'windsurf', 'global_workflows')
        : path.join(base, '.windsurf', 'workflows'),
      configFile: 'global_rules.md',
      extension:  '.md',
      mergedFile: false,
      note: scope === 'global'
        ? 'Windsurf only officially documents a single ~/.windsurf/global_rules.md file for global rules — per-agent files here are best-effort.'
        : undefined,
    },
    'gemini-cli': {
      agentsDir:  path.join(base, '.gemini', 'agents'),
      skillsDir:  path.join(base, '.gemini', 'skills'),
      configFile: 'GEMINI.md',
      extension:  '.md',
      mergedFile: false,
      rootInstructionFile: path.join(base, 'GEMINI.md'),
    },
  };

  return map[platform];
}
