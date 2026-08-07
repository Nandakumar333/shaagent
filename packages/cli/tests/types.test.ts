/**
 * Unit tests for types.ts — type guards and type contracts.
 * Since types.ts only exports TypeScript types, we validate them via usage.
 */

import { describe, it, expect } from 'vitest';
import type { Platform, Scope, InitAnswers, RenderOptions } from '../src/types';

describe('types', () => {
  it('Platform type accepts valid platform strings', () => {
    const platforms: Platform[] = [
      'opencode', 'claude-code', 'github-copilot', 'github-copilot-cli',
      'codex', 'cursor', 'continue', 'windsurf', 'gemini-cli',
    ];
    expect(platforms).toHaveLength(9);
  });

  it('Scope type accepts valid scope strings', () => {
    const scopes: Scope[] = ['global', 'project'];
    expect(scopes).toHaveLength(2);
  });

  it('InitAnswers interface has correct shape', () => {
    const answers: InitAnswers = {
      platform: 'opencode',
      scope: 'project',
      projectName: 'test',
      language: ['typescript'],
      framework: ['react'],
      infrastructure: 'AWS',
      cicd: 'GitHub Actions',
      model: 'claude-sonnet-4.6',
      coreAgents: ['orchestrator'],
      optionalAgents: [],
      skills: [],
    };
    expect(answers.platform).toBe('opencode');
    expect(answers.scope).toBe('project');
  });

  it('RenderOptions interface has correct shape', () => {
    const opts: RenderOptions = { dryRun: true };
    expect(opts.dryRun).toBe(true);
  });
});
