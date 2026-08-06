/**
 * Unit tests for engine/manifest.ts — config read/write.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { saveConfig, loadConfig } from '../src/engine/manifest';
import type { InitAnswers } from '../src/init';

describe('engine/manifest', () => {
  let tempDir: string;
  let originalCwd: string;

  beforeEach(async () => {
    originalCwd = process.cwd();
    tempDir = path.join(os.tmpdir(), `shaagent-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    await fs.ensureDir(tempDir);
    process.chdir(tempDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.remove(tempDir);
  });

  const mockAnswers: InitAnswers = {
    platform: 'opencode',
    scope: 'project',
    projectName: 'test-project',
    language: ['typescript', 'python'],
    framework: ['nextjs', 'fastapi'],
    infrastructure: 'AWS',
    cicd: 'GitHub Actions',
    model: 'anthropic/claude-sonnet-4-20250514',
    coreAgents: ['orchestrator', 'researcher', 'planner', 'dev', 'qa', 'reviewer', 'reviewer-fix'],
    optionalAgents: ['security'],
    skills: ['graphify', 'tdd'],
  };

  describe('saveConfig', () => {
    it('should write shaagent.config.json to the current directory', async () => {
      await saveConfig(mockAnswers);
      const configPath = path.join(tempDir, 'shaagent.config.json');
      expect(await fs.pathExists(configPath)).toBe(true);
    });

    it('should write valid JSON with correct structure', async () => {
      await saveConfig(mockAnswers);
      const configPath = path.join(tempDir, 'shaagent.config.json');
      const content = await fs.readJson(configPath);

      expect(content.platform).toBe('opencode');
      expect(content.model).toBe('anthropic/claude-sonnet-4-20250514');
      expect(content.project.name).toBe('test-project');
      expect(content.project.language).toEqual(['typescript', 'python']);
      expect(content.project.framework).toEqual(['nextjs', 'fastapi']);
      expect(content.project.infrastructure).toBe('AWS');
      expect(content.project.cicd).toBe('GitHub Actions');
      expect(content.agents.core).toEqual(mockAnswers.coreAgents);
      expect(content.agents.optional).toEqual(['security']);
      expect(content.skills.installed).toEqual(['graphify', 'tdd']);
    });

    it('should include $schema reference', async () => {
      await saveConfig(mockAnswers);
      const configPath = path.join(tempDir, 'shaagent.config.json');
      const content = await fs.readJson(configPath);
      expect(content.$schema).toBe('https://shaagent.dev/schema/v1.json');
    });
  });

  describe('loadConfig', () => {
    it('should return null when no config file exists', async () => {
      const config = await loadConfig();
      expect(config).toBeNull();
    });

    it('should return config after saveConfig', async () => {
      await saveConfig(mockAnswers);
      const config = await loadConfig();
      expect(config).not.toBeNull();
      expect((config as any).platform).toBe('opencode');
    });
  });
});
