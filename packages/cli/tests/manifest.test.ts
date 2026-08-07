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

    it('should throw on invalid platform in config file', async () => {
      const configPath = path.join(tempDir, 'shaagent.config.json');
      await fs.writeJson(configPath, { platform: 'invalid-platform' });
      await expect(loadConfig()).rejects.toThrow('Invalid');
    });

    it('should throw when platform is missing', async () => {
      const configPath = path.join(tempDir, 'shaagent.config.json');
      await fs.writeJson(configPath, { model: 'some-model' });
      await expect(loadConfig()).rejects.toThrow('platform');
    });

    it('should throw when model is not a string', async () => {
      const configPath = path.join(tempDir, 'shaagent.config.json');
      await fs.writeJson(configPath, { platform: 'opencode', model: 123 });
      await expect(loadConfig()).rejects.toThrow('model');
    });

    it('should throw when project is not an object', async () => {
      const configPath = path.join(tempDir, 'shaagent.config.json');
      await fs.writeJson(configPath, { platform: 'opencode', project: 'bad' });
      await expect(loadConfig()).rejects.toThrow('project');
    });

    it('should throw when project.language is not an array', async () => {
      const configPath = path.join(tempDir, 'shaagent.config.json');
      await fs.writeJson(configPath, { platform: 'opencode', project: { language: 'ts' } });
      await expect(loadConfig()).rejects.toThrow('language');
    });

    it('should throw when project.framework is not an array', async () => {
      const configPath = path.join(tempDir, 'shaagent.config.json');
      await fs.writeJson(configPath, { platform: 'opencode', project: { framework: 'react' } });
      await expect(loadConfig()).rejects.toThrow('framework');
    });

    it('should throw when agents is not an object', async () => {
      const configPath = path.join(tempDir, 'shaagent.config.json');
      await fs.writeJson(configPath, { platform: 'opencode', agents: 'bad' });
      await expect(loadConfig()).rejects.toThrow('agents');
    });

    it('should throw when agents.core is not an array', async () => {
      const configPath = path.join(tempDir, 'shaagent.config.json');
      await fs.writeJson(configPath, { platform: 'opencode', agents: { core: 'orchestrator' } });
      await expect(loadConfig()).rejects.toThrow('agents.core');
    });

    it('should throw on invalid core agent name', async () => {
      const configPath = path.join(tempDir, 'shaagent.config.json');
      await fs.writeJson(configPath, { platform: 'opencode', agents: { core: ['invalid-agent'] } });
      await expect(loadConfig()).rejects.toThrow('Invalid core agent');
    });

    it('should throw when agents.optional is not an array', async () => {
      const configPath = path.join(tempDir, 'shaagent.config.json');
      await fs.writeJson(configPath, { platform: 'opencode', agents: { optional: 'security' } });
      await expect(loadConfig()).rejects.toThrow('agents.optional');
    });

    it('should throw on invalid optional agent name', async () => {
      const configPath = path.join(tempDir, 'shaagent.config.json');
      await fs.writeJson(configPath, { platform: 'opencode', agents: { optional: ['bogus'] } });
      await expect(loadConfig()).rejects.toThrow('Invalid optional agent');
    });

    it('should throw when skills is not an object', async () => {
      const configPath = path.join(tempDir, 'shaagent.config.json');
      await fs.writeJson(configPath, { platform: 'opencode', skills: 'bad' });
      await expect(loadConfig()).rejects.toThrow('skills');
    });

    it('should throw when skills.installed is not an array', async () => {
      const configPath = path.join(tempDir, 'shaagent.config.json');
      await fs.writeJson(configPath, { platform: 'opencode', skills: { installed: 'graphify' } });
      await expect(loadConfig()).rejects.toThrow('skills.installed');
    });

    it('should throw on invalid skill name', async () => {
      const configPath = path.join(tempDir, 'shaagent.config.json');
      await fs.writeJson(configPath, { platform: 'opencode', skills: { installed: ['fake-skill'] } });
      await expect(loadConfig()).rejects.toThrow('Invalid skill');
    });
  });

  describe('saveConfig validation', () => {
    it('should throw when given invalid platform', async () => {
      const bad = { ...mockAnswers, platform: 'invalid' as any };
      await expect(saveConfig(bad)).rejects.toThrow('Invalid configuration');
    });

    it('should throw when given invalid core agent', async () => {
      const bad = { ...mockAnswers, coreAgents: ['orchestrator', 'nonexistent'] };
      await expect(saveConfig(bad)).rejects.toThrow('Invalid');
    });

    it('should throw when given invalid optional agent', async () => {
      const bad = { ...mockAnswers, optionalAgents: ['bogus-agent'] };
      await expect(saveConfig(bad)).rejects.toThrow('Invalid');
    });

    it('should throw when given invalid skill', async () => {
      const bad = { ...mockAnswers, skills: ['nonexistent-skill'] };
      await expect(saveConfig(bad)).rejects.toThrow('Invalid');
    });
  });
});
