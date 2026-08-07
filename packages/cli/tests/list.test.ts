/**
 * Unit tests for list.ts — listCommand.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { listCommand } from '../src/list';

vi.mock('../src/engine/manifest', () => ({
  loadConfig: vi.fn(),
}));

describe('list', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listCommand', () => {
    it('should return a Command named "list"', () => {
      const cmd = listCommand();
      expect(cmd.name()).toBe('list');
    });

    it('should have correct description', () => {
      const cmd = listCommand();
      expect(cmd.description()).toContain('List');
    });

    it('should handle missing config gracefully', async () => {
      const { loadConfig } = await import('../src/engine/manifest');
      (loadConfig as any).mockResolvedValue(null);

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const cmd = listCommand();
      await cmd.parseAsync(['node', 'test']);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No shaagent.config.json'));
      consoleSpy.mockRestore();
    });

    it('should display config when present', async () => {
      const { loadConfig } = await import('../src/engine/manifest');
      (loadConfig as any).mockResolvedValue({
        platform: 'opencode',
        scope: 'project',
        project: { name: 'my-app' },
        agents: { core: ['orchestrator', 'dev'], optional: ['security'] },
        skills: { installed: ['graphify', 'caveman'] },
      });

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const cmd = listCommand();
      await cmd.parseAsync(['node', 'test']);

      const output = consoleSpy.mock.calls.map(c => c[0]).join('\n');
      expect(output).toContain('opencode');
      expect(output).toContain('my-app');
      consoleSpy.mockRestore();
    });

    it('should show optional agents when present', async () => {
      const { loadConfig } = await import('../src/engine/manifest');
      (loadConfig as any).mockResolvedValue({
        platform: 'cursor',
        scope: 'global',
        project: { name: 'test' },
        agents: { core: ['orchestrator'], optional: ['security'] },
        skills: { installed: [] },
      });

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const cmd = listCommand();
      await cmd.parseAsync(['node', 'test']);

      const output = consoleSpy.mock.calls.map(c => c[0]).join('\n');
      expect(output).toContain('Optional Agents');
      consoleSpy.mockRestore();
    });

    it('should not show optional agents section when empty', async () => {
      const { loadConfig } = await import('../src/engine/manifest');
      (loadConfig as any).mockResolvedValue({
        platform: 'cursor',
        scope: 'project',
        project: { name: 'test' },
        agents: { core: ['orchestrator'], optional: [] },
        skills: { installed: ['tdd'] },
      });

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const cmd = listCommand();
      await cmd.parseAsync(['node', 'test']);

      const output = consoleSpy.mock.calls.map(c => c[0]).join('\n');
      expect(output).not.toContain('Optional Agents');
      consoleSpy.mockRestore();
    });
  });
});
