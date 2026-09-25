/**
 * Unit tests for install-skill.ts — skill validation and installation.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { validateSkillName } from '../src/install-skill';

describe('install-skill', () => {
  describe('validateSkillName', () => {
    it('should accept valid skill names', () => {
      expect(validateSkillName('graphify')).toBe(true);
      expect(validateSkillName('tdd')).toBe(true);
      expect(validateSkillName('security-scan')).toBe(true);
      expect(validateSkillName('arch-review')).toBe(true);
      expect(validateSkillName('my_skill')).toBe(true);
      expect(validateSkillName('skill123')).toBe(true);
    });

    it('should reject empty strings', () => {
      expect(validateSkillName('')).toBe(false);
    });

    it('should reject names with path separators', () => {
      expect(validateSkillName('../etc/passwd')).toBe(false);
      expect(validateSkillName('..\\windows\\system32')).toBe(false);
      expect(validateSkillName('foo/bar')).toBe(false);
      expect(validateSkillName('foo\\bar')).toBe(false);
    });

    it('should reject names with dots (potential traversal)', () => {
      expect(validateSkillName('..')).toBe(false);
      expect(validateSkillName('...')).toBe(false);
      expect(validateSkillName('.hidden')).toBe(false);
    });

    it('should reject names with special characters', () => {
      expect(validateSkillName('skill name')).toBe(false); // spaces
      expect(validateSkillName('skill@name')).toBe(false); // @
      expect(validateSkillName('skill;name')).toBe(false); // semicolons
      expect(validateSkillName('skill|name')).toBe(false); // pipes
      expect(validateSkillName('$(cmd)')).toBe(false);     // command injection
    });

    it('should reject excessively long names', () => {
      const longName = 'a'.repeat(65);
      expect(validateSkillName(longName)).toBe(false);
    });

    it('should accept names at the max length boundary', () => {
      const maxName = 'a'.repeat(64);
      expect(validateSkillName(maxName)).toBe(true);
    });
  });

  describe('installSkill', () => {
    let tempDir: string;
    let originalCwd: string;

    beforeEach(async () => {
      originalCwd = process.cwd();
      tempDir = path.join(os.tmpdir(), `shaagent-skill-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
      await fs.ensureDir(tempDir);
      process.chdir(tempDir);
    });

    afterEach(async () => {
      process.chdir(originalCwd);
      await fs.remove(tempDir);
    });

    it('should ignore invalid skill names safely', async () => {
      const { installSkill } = await import('../src/install-skill');
      await expect(installSkill('../invalid', 'opencode', 'project')).resolves.toBeUndefined();
    });

    it('should warn and skip nonexistent skill names', async () => {
      const { installSkill } = await import('../src/install-skill');
      await expect(installSkill('nonexistent_skill_xyz', 'opencode', 'project')).resolves.toBeUndefined();
    });

    it('should copy existing built-in skill to target platform dir', async () => {
      const { installSkill } = await import('../src/install-skill');
      await installSkill('graphify', 'opencode', 'project');
      const installed = path.join(tempDir, '.opencode', 'skills', 'graphify');
      expect(await fs.pathExists(installed)).toBe(true);
    });
  });

  describe('skillCommand', () => {
    it('creates skill command with install and list subcommands', async () => {
      const { skillCommand } = await import('../src/install-skill');
      const cmd = skillCommand();
      expect(cmd.name()).toBe('skill');
      const subcmds = cmd.commands.map(c => c.name());
      expect(subcmds).toContain('install');
      expect(subcmds).toContain('list');
    });

    it('executes list subcommand without error', async () => {
      const { skillCommand } = await import('../src/install-skill');
      const cmd = skillCommand();
      await cmd.parseAsync(['node', 'test', 'list']);
    });
  });
});
