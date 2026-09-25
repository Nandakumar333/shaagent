/**
 * Unit tests for init.ts — initCommand and getDefaults.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initCommand } from '../src/init';

// Mock dependencies
vi.mock('../src/prompts', () => ({
  prompt: vi.fn().mockResolvedValue({
    platform: 'opencode',
    scope: 'project',
    projectName: 'test-project',
    language: ['typescript'],
    framework: ['react'],
    infrastructure: 'AWS',
    cicd: 'GitHub Actions',
    model: 'github-copilot/claude-sonnet-4.6',
    coreAgents: ['orchestrator', 'dev'],
    optionalAgents: [],
    skills: [],
  }),
  getDefaultModel: vi.fn().mockReturnValue('github-copilot/claude-sonnet-4.6'),
}));

vi.mock('../src/engine/template', () => ({
  renderAgents: vi.fn().mockResolvedValue(['file1.md', 'file2.md']),
}));

vi.mock('../src/install-skill', () => ({
  installSkill: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../src/engine/manifest', () => ({
  saveConfig: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../src/platforms', () => ({
  getPlatformPaths: vi.fn().mockReturnValue({
    agentsDir: '.opencode/agents',
    skillsDir: '.opencode/skills',
    rootFile: null,
    note: null,
  }),
}));

describe('init', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initCommand', () => {
    it('should return a Command named "init"', () => {
      const cmd = initCommand();
      expect(cmd.name()).toBe('init');
    });

    it('should have --yes option', () => {
      const cmd = initCommand();
      const opts = cmd.options.map(o => o.long);
      expect(opts).toContain('--yes');
    });

    it('should have --platform option', () => {
      const cmd = initCommand();
      const opts = cmd.options.map(o => o.long);
      expect(opts).toContain('--platform');
    });

    it('should have --global option', () => {
      const cmd = initCommand();
      const opts = cmd.options.map(o => o.long);
      expect(opts).toContain('--global');
    });

    it('should have --project option', () => {
      const cmd = initCommand();
      const opts = cmd.options.map(o => o.long);
      expect(opts).toContain('--project');
    });

    it('should have --suite option', () => {
      const cmd = initCommand();
      const opts = cmd.options.map(o => o.long);
      expect(opts).toContain('--suite');
    });

    it('should have --dry-run option', () => {
      const cmd = initCommand();
      const opts = cmd.options.map(o => o.long);
      expect(opts).toContain('--dry-run');
    });

    it('should have correct description', () => {
      const cmd = initCommand();
      expect(cmd.description()).toContain('Initialize');
    });
  });

  describe('getDefaults (via --yes flag)', () => {
    it('should run with --yes and produce output without prompts', async () => {
      const { renderAgents } = await import('../src/engine/template');
      const { saveConfig } = await import('../src/engine/manifest');

      const cmd = initCommand();
      // Simulate --yes --dry-run to avoid file writes
      await cmd.parseAsync(['node', 'test', '--yes', '--dry-run']);

      expect(renderAgents).toHaveBeenCalledWith(
        expect.objectContaining({
          platform: 'opencode',
          scope: 'project',
          projectName: 'my-project',
        }),
        { dryRun: true }
      );
      // saveConfig should NOT be called in dry-run
      expect(saveConfig).not.toHaveBeenCalled();
    });

    it('should use provided platform flag in defaults', async () => {
      const { renderAgents } = await import('../src/engine/template');

      const cmd = initCommand();
      await cmd.parseAsync(['node', 'test', '--yes', '--platform', 'cursor', '--dry-run']);

      expect(renderAgents).toHaveBeenCalledWith(
        expect.objectContaining({ platform: 'cursor' }),
        { dryRun: true }
      );
    });

    it('should use --global scope flag', async () => {
      const { renderAgents } = await import('../src/engine/template');

      const cmd = initCommand();
      await cmd.parseAsync(['node', 'test', '--yes', '--global', '--dry-run']);

      expect(renderAgents).toHaveBeenCalledWith(
        expect.objectContaining({ scope: 'global' }),
        { dryRun: true }
      );
    });

    it('should use --project scope flag', async () => {
      const { renderAgents } = await import('../src/engine/template');

      const cmd = initCommand();
      await cmd.parseAsync(['node', 'test', '--yes', '--project', '--dry-run']);

      expect(renderAgents).toHaveBeenCalledWith(
        expect.objectContaining({ scope: 'project' }),
        { dryRun: true }
      );
    });

    it('should use --suite jira-analyser flag in defaults', async () => {
      const { renderAgents } = await import('../src/engine/template');

      const cmd = initCommand();
      await cmd.parseAsync(['node', 'test', '--yes', '--suite', 'jira-analyser', '--dry-run']);

      expect(renderAgents).toHaveBeenCalledWith(
        expect.objectContaining({
          suite: 'jira-analyser',
          coreAgents: expect.arrayContaining(['ticket-analyser', 'har-analyzer', 'telemetry-investigator']),
        }),
        { dryRun: true }
      );
    });

    it('should use --suite both flag in defaults', async () => {
      const { renderAgents } = await import('../src/engine/template');

      const cmd = initCommand();
      await cmd.parseAsync(['node', 'test', '--yes', '--suite', 'both', '--dry-run']);

      expect(renderAgents).toHaveBeenCalledWith(
        expect.objectContaining({
          suite: 'both',
          coreAgents: expect.arrayContaining(['orchestrator', 'ticket-analyser']),
        }),
        { dryRun: true }
      );
    });

    it('should install skills and save config when not in dry-run mode', async () => {
      const { renderAgents } = await import('../src/engine/template');
      const { installSkill } = await import('../src/install-skill');
      const { saveConfig } = await import('../src/engine/manifest');

      const cmd = initCommand();
      await cmd.parseAsync(['node', 'test', '--yes']);

      expect(renderAgents).toHaveBeenCalledWith(expect.anything(), { dryRun: false });
      expect(installSkill).toHaveBeenCalled();
      expect(saveConfig).toHaveBeenCalled();
    });

    it('should show ticket-analyser message when only ticket-analyser is installed in non-dry-run', async () => {
      const { prompt } = await import('../src/prompts');
      (prompt as any).mockResolvedValueOnce({
        platform: 'opencode',
        scope: 'project',
        projectName: 'ticket-proj',
        language: [],
        framework: [],
        infrastructure: '',
        cicd: '',
        model: 'model-1',
        coreAgents: ['ticket-analyser', 'har-analyzer'],
        optionalAgents: [],
        skills: ['graphify'],
      });

      const cmd = initCommand();
      await cmd.parseAsync(['node', 'test']);
    });
  });

  describe('getDefaults direct tests', () => {
    it('returns expected defaults for each suite', async () => {
      const { getDefaults } = await import('../src/init');

      const dev = getDefaults('opencode', 'project', 'development');
      expect(dev.suite).toBe('development');
      expect(dev.coreAgents).toContain('orchestrator');

      const jira = getDefaults('cursor', 'global', 'jira-analyser');
      expect(jira.suite).toBe('jira-analyser');
      expect(jira.platform).toBe('cursor');
      expect(jira.scope).toBe('global');
      expect(jira.coreAgents[0]).toBe('ticket-analyser');

      const both = getDefaults('claude-code', 'project', 'both');
      expect(both.suite).toBe('both');
      expect(both.coreAgents).toContain('orchestrator');
      expect(both.coreAgents).toContain('ticket-analyser');
    });
  });
});
