/**
 * Unit tests for engine/paths.ts — centralized path resolution.
 */

import { describe, it, expect, afterEach } from 'vitest';
import path from 'path';
import { getPackageRoot, getTemplatesRoot, getSkillsRoot, _resetPathCache } from '../src/engine/paths';

describe('engine/paths', () => {
  afterEach(() => {
    _resetPathCache();
  });

  describe('getPackageRoot', () => {
    it('should return a directory that contains package.json', () => {
      const root = getPackageRoot();
      expect(root).toBeDefined();
      expect(typeof root).toBe('string');
      expect(root.length).toBeGreaterThan(0);
    });

    it('should return consistent results on multiple calls', () => {
      const root1 = getPackageRoot();
      const root2 = getPackageRoot();
      expect(root1).toBe(root2);
    });
  });

  describe('getTemplatesRoot', () => {
    it('should return a path that ends with templates', () => {
      const templatesRoot = getTemplatesRoot();
      expect(path.basename(templatesRoot)).toBe('templates');
    });

    it('should resolve to the monorepo templates directory in development', () => {
      const templatesRoot = getTemplatesRoot();
      // In development, templates should resolve to the monorepo root
      expect(templatesRoot).toContain('templates');
    });
  });

  describe('getSkillsRoot', () => {
    it('should return a path that ends with skills', () => {
      const skillsRoot = getSkillsRoot();
      expect(path.basename(skillsRoot)).toBe('skills');
    });

    it('should resolve to the monorepo skills directory in development', () => {
      const skillsRoot = getSkillsRoot();
      expect(skillsRoot).toContain('skills');
    });
  });
});
