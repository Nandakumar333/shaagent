/**
 * Platform path resolvers — returns where agent files and skills live
 * for each supported AI platform.
 *
 * Updated based on official documentation (July 2026):
 * - OpenCode: .opencode/agents/*.md with YAML frontmatter
 * - Claude Code: CLAUDE.md (root) + .claude/rules/*.md for path-scoped rules
 * - GitHub Copilot: AGENTS.md + .github/instructions/*.instructions.md
 * - Codex (OpenAI): AGENTS.md files anywhere in repo (nearest wins)
 * - Cursor: .cursor/rules/*.mdc files
 * - Continue: .continue/prompts/*.md
 */

import path from 'path';
import os from 'os';
import type { Platform } from '../init';

export interface PlatformPaths {
  /** Where individual agent .md files go (repo-local) */
  agentsDir: string;
  /** Where SKILL.md files go (global or repo-local) */
  skillsDir: string;
  /** Main config/instruction file path */
  configFile: string;
  /** File extension for agent files */
  extension: string;
  /** Whether this platform uses a single merged file or individual files */
  mergedFile: boolean;
  /** Optional: root instruction file that imports/references agents */
  rootInstructionFile?: string;
}

export function getPlatformPaths(platform: Platform): PlatformPaths {
  const cwd = process.cwd();
  const home = os.homedir();

  const map: Record<Platform, PlatformPaths> = {
    'opencode': {
      agentsDir:  path.join(cwd, '.opencode', 'agents'),
      skillsDir:  path.join(home, '.config', 'opencode', 'skills'),
      configFile: 'opencode.json',
      extension:  '.md',
      mergedFile: false,
    },
    'claude-code': {
      agentsDir:  path.join(cwd, '.claude', 'agents'),
      skillsDir:  path.join(home, '.claude', 'skills'),
      configFile: 'CLAUDE.md',
      extension:  '.md',
      mergedFile: false,
      rootInstructionFile: path.join(cwd, 'CLAUDE.md'),
    },
    'github-copilot': {
      agentsDir:  path.join(cwd, '.github', 'instructions'),
      skillsDir:  path.join(cwd, '.github', 'copilot-skills'),
      configFile: '.github/copilot-instructions.md',
      extension:  '.instructions.md',
      mergedFile: false,
      rootInstructionFile: path.join(cwd, 'AGENTS.md'),
    },
    'codex': {
      agentsDir:  cwd,
      skillsDir:  path.join(cwd, '.codex', 'skills'),
      configFile: 'AGENTS.md',
      extension:  '.md',
      mergedFile: true,   // Codex prefers a single AGENTS.md
    },
    'cursor': {
      agentsDir:  path.join(cwd, '.cursor', 'rules'),
      skillsDir:  path.join(cwd, '.cursor', 'skills'),
      configFile: '.cursorrules',
      extension:  '.mdc',
      mergedFile: false,
    },
    'continue': {
      agentsDir:  path.join(cwd, '.continue', 'prompts'),
      skillsDir:  path.join(cwd, '.continue', 'skills'),
      configFile: '.continue/config.json',
      extension:  '.md',
      mergedFile: false,
    },
  };

  return map[platform];
}
