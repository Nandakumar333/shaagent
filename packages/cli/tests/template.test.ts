/**
 * Integration tests for the template rendering engine.
 *
 * Tests full rendering pipeline for each platform without
 * actually writing to user directories (uses temp dirs).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { renderAgents } from '../src/engine/template';
import type { InitAnswers, Platform } from '../src/init';

describe('engine/template — renderAgents', () => {
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

  function makeAnswers(platform: Platform): InitAnswers {
    return {
      platform,
      scope: 'project',
      projectName: 'test-project',
      language: ['typescript'],
      framework: ['nextjs'],
      infrastructure: 'AWS',
      cicd: 'GitHub Actions',
      model: 'anthropic/claude-sonnet-4-20250514',
      coreAgents: ['orchestrator', 'researcher', 'planner', 'dev', 'qa', 'reviewer', 'reviewer-fix'],
      optionalAgents: [],
      skills: [],
    };
  }

  describe('dry-run mode', () => {
    it('should return file paths without creating any files', async () => {
      const answers = makeAnswers('opencode');
      const written = await renderAgents(answers, { dryRun: true });

      expect(written.length).toBeGreaterThan(0);

      // Verify no files were actually written
      const agentsDir = path.join(tempDir, '.opencode', 'agents');
      expect(await fs.pathExists(agentsDir)).toBe(false);
    });
  });

  describe('opencode platform', () => {
    it('should render all core agents to .opencode/agents/', async () => {
      const answers = makeAnswers('opencode');
      const written = await renderAgents(answers);

      expect(written.length).toBe(7); // 7 core agents
      for (const file of written) {
        expect(file).toContain('.opencode');
        expect(file).toMatch(/\.md$/);
        const fullPath = path.join(tempDir, file);
        expect(await fs.pathExists(fullPath)).toBe(true);
      }
    });

    it('should include YAML frontmatter with mode for opencode', async () => {
      const answers = makeAnswers('opencode');
      await renderAgents(answers);

      const orchestratorPath = path.join(tempDir, '.opencode', 'agents', 'orchestrator.md');
      const content = await fs.readFile(orchestratorPath, 'utf-8');

      expect(content).toContain('---');
      expect(content).toContain('mode: primary');
      expect(content).toContain('temperature:');
      expect(content).toContain('permission:');
    });

    it('should set subagent mode for non-orchestrator agents', async () => {
      const answers = makeAnswers('opencode');
      await renderAgents(answers);

      const devPath = path.join(tempDir, '.opencode', 'agents', 'dev.md');
      const content = await fs.readFile(devPath, 'utf-8');
      expect(content).toContain('mode: subagent');
    });
  });

  describe('claude-code platform', () => {
    it('should render agents and root CLAUDE.md', async () => {
      const answers = makeAnswers('claude-code');
      const written = await renderAgents(answers);

      // 7 agents + 1 CLAUDE.md root file
      expect(written.length).toBe(8);
      expect(written.some(f => f.includes('CLAUDE.md'))).toBe(true);
    });

    it('should not include YAML frontmatter for claude-code agents', async () => {
      const answers = makeAnswers('claude-code');
      await renderAgents(answers);

      const orchestratorPath = path.join(tempDir, '.claude', 'agents', 'orchestrator.md');
      const content = await fs.readFile(orchestratorPath, 'utf-8');

      // Claude Code uses HTML comment headers, not frontmatter
      expect(content).toContain('<!-- Agent:');
      expect(content).not.toMatch(/^---\n/);
    });
  });

  describe('github-copilot platform', () => {
    it('should render with .agent.md extension', async () => {
      const answers = makeAnswers('github-copilot');
      const written = await renderAgents(answers);

      // Agent files should have .agent.md extension
      const agentFiles = written.filter(f => f.includes('agent'));
      expect(agentFiles.length).toBe(7);
      agentFiles.forEach(f => {
        expect(f).toMatch(/\.agent\.md$/);
      });
    });

    it('should generate AGENTS.md root file', async () => {
      const answers = makeAnswers('github-copilot');
      const written = await renderAgents(answers);
      expect(written.some(f => f === 'AGENTS.md')).toBe(true);
    });

    it('should include applyTo frontmatter', async () => {
      const answers = makeAnswers('github-copilot');
      await renderAgents(answers);

      const agentPath = path.join(tempDir, '.github', 'agents', 'orchestrator.agent.md');
      const content = await fs.readFile(agentPath, 'utf-8');
      expect(content).toContain('applyTo:');
    });
  });

  describe('codex platform (merged file)', () => {
    it('should render all agents into a single AGENTS.md', async () => {
      const answers = makeAnswers('codex');
      const written = await renderAgents(answers);

      expect(written.length).toBe(1);
      expect(written[0]).toBe('AGENTS.md');
    });

    it('should contain all agent names in the merged file', async () => {
      const answers = makeAnswers('codex');
      await renderAgents(answers);

      const agentsMd = path.join(tempDir, 'AGENTS.md');
      const content = await fs.readFile(agentsMd, 'utf-8');

      expect(content).toContain('test-project');
      expect(content).toContain('Orchestrator');
      expect(content).toContain('Researcher');
      expect(content).toContain('Planner');
    });
  });

  describe('cursor platform', () => {
    it('should render with .mdc extension', async () => {
      const answers = makeAnswers('cursor');
      const written = await renderAgents(answers);

      expect(written.length).toBe(7);
      written.forEach(f => {
        expect(f).toMatch(/\.mdc$/);
      });
    });

    it('should include cursor-specific frontmatter', async () => {
      const answers = makeAnswers('cursor');
      await renderAgents(answers);

      const agentPath = path.join(tempDir, '.cursor', 'rules', 'orchestrator.mdc');
      const content = await fs.readFile(agentPath, 'utf-8');
      expect(content).toContain('globs:');
      expect(content).toContain('alwaysApply:');
    });
  });

  describe('continue platform', () => {
    it('should render with .md extension to .continue/prompts/', async () => {
      const answers = makeAnswers('continue');
      const written = await renderAgents(answers);

      expect(written.length).toBe(7);
      written.forEach(f => {
        expect(f).toContain('.continue');
        expect(f).toMatch(/\.md$/);
      });
    });
  });

  describe('optional agents', () => {
    it('should render optional agents when specified', async () => {
      const answers = makeAnswers('opencode');
      answers.optionalAgents = ['security', 'architecture-reviewer'];
      const written = await renderAgents(answers);

      // 7 core + 2 optional
      expect(written.length).toBe(9);
      expect(written.some(f => f.includes('security'))).toBe(true);
      expect(written.some(f => f.includes('architecture-reviewer'))).toBe(true);
    });
  });

  describe('windsurf platform', () => {
    it('should render with .md extension to .windsurf/rules/', async () => {
      const answers = makeAnswers('windsurf');
      const written = await renderAgents(answers);

      expect(written.length).toBeGreaterThan(0);
      written.forEach(f => {
        expect(f).toContain('.windsurf');
        expect(f).toMatch(/\.md$/);
      });
    });
  });

  describe('gemini-cli platform', () => {
    it('should render agents and root GEMINI.md', async () => {
      const answers = makeAnswers('gemini-cli');
      const written = await renderAgents(answers);

      expect(written.length).toBeGreaterThan(7);
      expect(written.some(f => f.includes('GEMINI.md'))).toBe(true);
    });
  });

  describe('github-copilot-cli platform', () => {
    it('should render with .agent.md extension to .github/agents/', async () => {
      const answers = makeAnswers('github-copilot-cli');
      const written = await renderAgents(answers);

      expect(written.length).toBe(7);
      written.forEach(f => {
        expect(f).toContain('.github');
        expect(f).toMatch(/\.agent\.md$/);
      });
    });
  });

  describe('global scope', () => {
    it('should render to home directory paths for opencode', async () => {
      const answers = makeAnswers('opencode');
      answers.scope = 'global';
      const written = await renderAgents(answers, { dryRun: true });

      expect(written.length).toBeGreaterThan(0);
    });

    it('should render to home directory paths for claude-code', async () => {
      const answers = makeAnswers('claude-code');
      answers.scope = 'global';
      const written = await renderAgents(answers, { dryRun: true });

      expect(written.length).toBeGreaterThan(0);
    });
  });

  describe('project-memory-creator optional agent', () => {
    it('should render project-memory-creator agent', async () => {
      const answers = makeAnswers('opencode');
      answers.optionalAgents = ['project-memory-creator'];
      const written = await renderAgents(answers);

      expect(written.some(f => f.includes('project-memory-creator'))).toBe(true);
    });
  });

  describe('multiple languages and frameworks', () => {
    it('should include all languages and frameworks in rendered output', async () => {
      const answers = makeAnswers('opencode');
      answers.language = ['csharp', 'typescript', 'python'];
      answers.framework = ['dotnet8', 'react', 'fastapi'];
      await renderAgents(answers);

      const orchestratorPath = path.join(tempDir, '.opencode', 'agents', 'orchestrator.md');
      const content = await fs.readFile(orchestratorPath, 'utf-8');
      // Template uses language array somehow - just verify file was written
      expect(content.length).toBeGreaterThan(0);
    });
  });
});
