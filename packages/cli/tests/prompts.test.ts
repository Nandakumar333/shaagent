/**
 * Unit tests for prompts.ts — prompt function and helpers.
 * We mock inquirer to test the logic without interactive input.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('inquirer', () => ({
  default: {
    prompt: vi.fn(),
  },
}));

describe('prompts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('prompt function', () => {
    it('should return answers with platform from flag', async () => {
      const inquirer = (await import('inquirer')).default;
      (inquirer.prompt as any).mockResolvedValue({
        scope: 'project',
        projectName: 'test',
        language: ['typescript'],
        framework: ['react'],
        infrastructure: 'AWS',
        cicd: 'GitHub Actions',
        model: 'claude-sonnet-4.6',
        coreAgents: ['orchestrator', 'dev'],
        optionalAgents: [],
        skills: ['graphify'],
      });

      const { prompt } = await import('../src/prompts');
      const result = await prompt('cursor', undefined);

      expect(result.platform).toBe('cursor');
    });

    it('should return answers with scope from flag', async () => {
      const inquirer = (await import('inquirer')).default;
      (inquirer.prompt as any).mockResolvedValue({
        platform: 'opencode',
        projectName: 'test',
        language: ['python'],
        framework: ['fastapi'],
        infrastructure: 'GCP',
        cicd: 'GitLab CI',
        model: 'github-copilot/claude-sonnet-4.6',
        coreAgents: ['orchestrator'],
        optionalAgents: [],
        skills: [],
      });

      const { prompt } = await import('../src/prompts');
      const result = await prompt(undefined, 'global');

      expect(result.scope).toBe('global');
    });

    it('should always include orchestrator in coreAgents', async () => {
      const inquirer = (await import('inquirer')).default;
      (inquirer.prompt as any).mockResolvedValue({
        platform: 'opencode',
        scope: 'project',
        projectName: 'test',
        language: [],
        framework: [],
        infrastructure: '',
        cicd: '',
        model: '',
        coreAgents: ['dev', 'qa'],
        optionalAgents: [],
        skills: [],
      });

      const { prompt } = await import('../src/prompts');
      const result = await prompt('opencode', 'project');

      expect(result.coreAgents[0]).toBe('orchestrator');
      expect(result.coreAgents).toContain('dev');
      expect(result.coreAgents).toContain('qa');
    });

    it('should not duplicate orchestrator if already selected', async () => {
      const inquirer = (await import('inquirer')).default;
      (inquirer.prompt as any).mockResolvedValue({
        platform: 'opencode',
        scope: 'project',
        projectName: 'test',
        language: [],
        framework: [],
        infrastructure: '',
        cicd: '',
        model: '',
        coreAgents: ['orchestrator', 'dev'],
        optionalAgents: [],
        skills: [],
      });

      const { prompt } = await import('../src/prompts');
      const result = await prompt('opencode', 'project');

      const orchestratorCount = result.coreAgents.filter(a => a === 'orchestrator').length;
      expect(orchestratorCount).toBe(1);
    });

    it('should use platform default model when model is empty', async () => {
      const inquirer = (await import('inquirer')).default;
      (inquirer.prompt as any).mockResolvedValue({
        platform: 'claude-code',
        scope: 'project',
        projectName: 'test',
        language: [],
        framework: [],
        infrastructure: '',
        cicd: '',
        model: '',
        coreAgents: ['orchestrator'],
        optionalAgents: [],
        skills: [],
      });

      const { prompt } = await import('../src/prompts');
      const result = await prompt('claude-code', 'project');

      expect(result.model).toBe('claude-sonnet-4-20250514');
    });

    it('should use user-provided model when present', async () => {
      const inquirer = (await import('inquirer')).default;
      (inquirer.prompt as any).mockResolvedValue({
        platform: 'opencode',
        scope: 'project',
        projectName: 'test',
        language: [],
        framework: [],
        infrastructure: '',
        cicd: '',
        model: 'custom/model-v2',
        coreAgents: ['orchestrator'],
        optionalAgents: [],
        skills: [],
      });

      const { prompt } = await import('../src/prompts');
      const result = await prompt('opencode', 'project');

      expect(result.model).toBe('custom/model-v2');
    });

    it.each([
      ['github-copilot', 'claude-sonnet-4.6'],
      ['github-copilot-cli', 'claude-sonnet-4.6'],
      ['codex', 'codex-1'],
      ['cursor', 'claude-sonnet-4.6'],
      ['continue', 'anthropic/claude-sonnet-4-20250514'],
      ['windsurf', 'claude-sonnet-4'],
      ['gemini-cli', 'gemini-3.1-pro'],
    ])('should use correct default model for %s platform', async (platform, expectedModel) => {
      const inquirer = (await import('inquirer')).default;
      (inquirer.prompt as any).mockResolvedValue({
        platform,
        scope: 'project',
        projectName: 'test',
        language: [],
        framework: [],
        infrastructure: '',
        cicd: '',
        model: '',
        coreAgents: ['orchestrator'],
        optionalAgents: [],
        skills: [],
      });

      const { prompt } = await import('../src/prompts');
      const result = await prompt(platform, 'project');

      expect(result.model).toBe(expectedModel);
    });

    it('should configure ticket-analyser as primary agent when jira-analyser suite is selected', async () => {
      const inquirer = (await import('inquirer')).default;
      (inquirer.prompt as any).mockResolvedValue({
        scope: 'project',
        suite: 'jira-analyser',
        platform: 'opencode',
        projectName: 'jira-test',
        jiraUrl: 'https://test.atlassian.net',
        jiraProjectKey: 'OPS',
        datadogEuUrl: 'https://app.datadoghq.com/',
        datadogUsAccessToken: 'secret-token-123',
        gitlabUrl: 'https://gitlab.com',
        gitlabProjectId: 'my-group/project',
        model: 'github-copilot/claude-sonnet-4.6',
        jiraCoreAgents: ['ticket-analyser', 'har-analyzer', 'telemetry-investigator'],
        skills: ['graphify'],
      });

      const { prompt } = await import('../src/prompts');
      const result = await prompt('opencode', 'project', 'jira-analyser');

      expect(result.suite).toBe('jira-analyser');
      expect(result.coreAgents[0]).toBe('ticket-analyser');
      expect(result.coreAgents).toContain('har-analyzer');
      expect(result.coreAgents).toContain('telemetry-investigator');
      expect(result.coreAgents).not.toContain('orchestrator');
      expect(result.jira).toEqual({
        url: 'https://test.atlassian.net',
        projectKey: 'OPS',
      });
      expect(result.datadog?.us?.accessToken).toBe('secret-token-123');
      expect(result.gitlab?.projectId).toBe('my-group/project');
    });

    it('should configure both orchestrator and ticket-analyser when both suite is selected', async () => {
      const inquirer = (await import('inquirer')).default;
      (inquirer.prompt as any).mockResolvedValue({
        scope: 'project',
        suite: 'both',
        platform: 'opencode',
        projectName: 'both-test',
        language: ['typescript'],
        framework: ['react'],
        infrastructure: 'AWS',
        cicd: 'GitHub Actions',
        jiraUrl: 'https://test.atlassian.net',
        jiraProjectKey: 'DEV',
        model: 'github-copilot/claude-sonnet-4.6',
        bothCoreAgents: ['orchestrator', 'ticket-analyser', 'dev'],
        optionalAgents: [],
        skills: [],
      });

      const { prompt } = await import('../src/prompts');
      const result = await prompt('opencode', 'project', 'both');

      expect(result.suite).toBe('both');
      expect(result.coreAgents).toContain('orchestrator');
      expect(result.coreAgents).toContain('ticket-analyser');
      expect(result.coreAgents).toContain('dev');
    });

    it('should correctly evaluate when predicates and default values in getQuestions', async () => {
      const { getQuestions } = await import('../src/prompts');

      // Test without flags
      const questions = getQuestions();
      expect(questions.length).toBeGreaterThan(10);

      // Invoke all when and default functions across suites
      const testContexts = [
        { suite: 'development', gitlabUrl: '' },
        { suite: 'jira-analyser', gitlabUrl: 'https://gitlab.com' },
        { suite: 'both', gitlabUrl: 'https://gitlab.com' },
      ];

      for (const ctx of testContexts) {
        for (const q of questions) {
          if (typeof q.when === 'function') {
            q.when(ctx);
          }
          if (typeof q.default === 'function') {
            q.default({ platform: 'cursor' });
          }
        }
      }

      // Test with flags provided (should skip scope, suite, platform)
      const flagged = getQuestions('cursor', 'project', 'development');
      const scopeQ = flagged.find(q => q.name === 'scope');
      expect(scopeQ?.when).toBe(false);
      const suiteQ = flagged.find(q => q.name === 'suite');
      expect(suiteQ?.when).toBe(false);
      const platformQ = flagged.find(q => q.name === 'platform');
      expect(platformQ?.when).toBe(false);
    });
  });
});
