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
  'codex',
  'cursor',
  'continue',
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

    it('github-copilot should use .github/instructions/ with .instructions.md extension', () => {
      const paths = getPlatformPaths('github-copilot');
      expect(paths.agentsDir).toContain(path.join('.github', 'instructions'));
      expect(paths.extension).toBe('.instructions.md');
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

    it('should resolve skills to home directory for opencode', () => {
      const paths = getPlatformPaths('opencode');
      const home = os.homedir();
      expect(paths.skillsDir).toContain(home);
      expect(paths.skillsDir).toContain('opencode');
    });

    it('should resolve skills to home directory for claude-code', () => {
      const paths = getPlatformPaths('claude-code');
      const home = os.homedir();
      expect(paths.skillsDir).toContain(home);
      expect(paths.skillsDir).toContain('.claude');
    });
  });
});
