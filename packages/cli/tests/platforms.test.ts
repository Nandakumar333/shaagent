/**
 * Unit tests for platforms/index.ts — platform path resolvers.
 */

import { describe, it, expect } from 'vitest';
import path from 'path';
import os from 'os';
import { getPlatformPaths } from '../src/platforms';
import type { Platform } from '../src/init';

const ALL_PLATFORMS: Platform[] = [
  'opencode',
  'claude-code',
  'github-copilot',
  'github-copilot-cli',
  'codex',
  'cursor',
  'continue',
  'windsurf',
  'gemini-cli',
];

describe('platforms/index', () => {
  describe('getPlatformPaths', () => {
    it.each(ALL_PLATFORMS)('should return valid paths for platform: %s', (platform) => {
      const paths = getPlatformPaths(platform);
      expect(paths).toBeDefined();
      expect(paths.agentsDir).toBeTruthy();
      expect(paths.skillsDir).toBeTruthy();
      expect(paths.configFile).toBeTruthy();
      expect(paths.extension).toBeTruthy();
      expect(typeof paths.mergedFile).toBe('boolean');
    });

    it('opencode should use .opencode/agents/ with .md extension', () => {
      const paths = getPlatformPaths('opencode');
      expect(paths.agentsDir).toContain(path.join('.opencode', 'agents'));
      expect(paths.extension).toBe('.md');
      expect(paths.mergedFile).toBe(false);
      expect(paths.rootInstructionFile).toBeUndefined();
    });

    it('claude-code should use .claude/agents/ with .md extension and have rootInstructionFile', () => {
      const paths = getPlatformPaths('claude-code');
      expect(paths.agentsDir).toContain(path.join('.claude', 'agents'));
      expect(paths.extension).toBe('.md');
      expect(paths.mergedFile).toBe(false);
      expect(paths.rootInstructionFile).toBeDefined();
      expect(paths.rootInstructionFile).toContain('CLAUDE.md');
    });

    it('github-copilot should use .github/agents/ + .github/skills/ with .agent.md extension', () => {
      const paths = getPlatformPaths('github-copilot');
      expect(paths.agentsDir).toContain(path.join('.github', 'agents'));
      expect(paths.skillsDir).toContain(path.join('.github', 'skills'));
      expect(paths.extension).toBe('.agent.md');
      expect(paths.mergedFile).toBe(false);
      expect(paths.rootInstructionFile).toBeDefined();
      expect(paths.rootInstructionFile).toContain('AGENTS.md');
    });

    it('codex should use merged file mode', () => {
      const paths = getPlatformPaths('codex');
      expect(paths.mergedFile).toBe(true);
      expect(paths.configFile).toBe('AGENTS.md');
    });

    it('cursor should use .cursor/rules/ with .mdc extension', () => {
      const paths = getPlatformPaths('cursor');
      expect(paths.agentsDir).toContain(path.join('.cursor', 'rules'));
      expect(paths.extension).toBe('.mdc');
      expect(paths.mergedFile).toBe(false);
    });

    it('continue should use .continue/prompts/ with .md extension', () => {
      const paths = getPlatformPaths('continue');
      expect(paths.agentsDir).toContain(path.join('.continue', 'prompts'));
      expect(paths.extension).toBe('.md');
      expect(paths.mergedFile).toBe(false);
    });

    it('should resolve skills to project-local directory for opencode', () => {
      const paths = getPlatformPaths('opencode');
      expect(paths.skillsDir).toContain('.opencode');
      expect(paths.skillsDir).toContain('skills');
      expect(paths.skillsDir).toBe(path.join(process.cwd(), '.opencode', 'skills'));
    });

    it('should resolve skills to project-local directory for claude-code', () => {
      const paths = getPlatformPaths('claude-code');
      expect(paths.skillsDir).toContain('.claude');
      expect(paths.skillsDir).toContain('skills');
      expect(paths.skillsDir).toBe(path.join(process.cwd(), '.claude', 'skills'));
    });

    it('github-copilot-cli should use .github/agents/ with .agent.md extension', () => {
      const paths = getPlatformPaths('github-copilot-cli');
      expect(paths.agentsDir).toContain(path.join('.github', 'agents'));
      expect(paths.extension).toBe('.agent.md');
      expect(paths.mergedFile).toBe(false);
    });

    it('github-copilot-cli should use .github/skills/ for skills', () => {
      const paths = getPlatformPaths('github-copilot-cli');
      expect(paths.skillsDir).toBe(path.join(process.cwd(), '.github', 'skills'));
    });

    it('windsurf should use .windsurf/rules/ with .md extension', () => {
      const paths = getPlatformPaths('windsurf');
      expect(paths.agentsDir).toContain(path.join('.windsurf', 'rules'));
      expect(paths.extension).toBe('.md');
      expect(paths.mergedFile).toBe(false);
    });

    it('gemini-cli should use .gemini/agents/ with GEMINI.md rootInstructionFile', () => {
      const paths = getPlatformPaths('gemini-cli');
      expect(paths.agentsDir).toContain(path.join('.gemini', 'agents'));
      expect(paths.rootInstructionFile).toContain('GEMINI.md');
    });
  });

  describe('getPlatformPaths — global scope', () => {
    it.each(ALL_PLATFORMS)('should root paths under the home directory for platform: %s', (platform) => {
      const paths = getPlatformPaths(platform, 'global');
      expect(paths.agentsDir.startsWith(os.homedir())).toBe(true);
      expect(paths.skillsDir.startsWith(os.homedir())).toBe(true);
    });

    it('claude-code global should use ~/.claude/agents and ~/.claude/CLAUDE.md', () => {
      const paths = getPlatformPaths('claude-code', 'global');
      expect(paths.agentsDir).toBe(path.join(os.homedir(), '.claude', 'agents'));
      expect(paths.rootInstructionFile).toBe(path.join(os.homedir(), 'CLAUDE.md'));
    });

    it('github-copilot-cli global should use ~/.copilot/agents and ~/.copilot/skills', () => {
      const paths = getPlatformPaths('github-copilot-cli', 'global');
      expect(paths.agentsDir).toBe(path.join(os.homedir(), '.copilot', 'agents'));
      expect(paths.skillsDir).toBe(path.join(os.homedir(), '.copilot', 'skills'));
    });

    it('codex global should keep merged-file mode under ~/.codex', () => {
      const paths = getPlatformPaths('codex', 'global');
      expect(paths.mergedFile).toBe(true);
      expect(paths.agentsDir).toBe(path.join(os.homedir(), '.codex'));
    });
  });
});
