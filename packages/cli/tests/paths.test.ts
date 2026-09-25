/**
 * Unit tests for engine/paths.ts — centralized path resolution.
 */

import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest';
import path from 'path';
import fs from 'fs';
import { getPackageRoot, getTemplatesRoot, getSkillsRoot, _resetPathCache } from '../src/engine/paths';

describe('engine/paths', () => {
  afterEach(() => {
    _resetPathCache();
    vi.restoreAllMocks();
  });

  describe('getPackageRoot', () => {
    it('should return a directory that contains package.json', () => {
      const root = getPackageRoot();
      expect(root).toBeDefined();
      expect(typeof root).toBe('string');
      expect(root.length).toBeGreaterThan(0);
    });

    it('should return consistent results on multiple calls (cached)', () => {
      const root1 = getPackageRoot();
      const root2 = getPackageRoot();
      expect(root1).toBe(root2);
    });

    it('should find package root even after cache reset', () => {
      const root1 = getPackageRoot();
      _resetPathCache();
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
      expect(templatesRoot).toContain('templates');
    });

    it('should fallback when no templates directories exist', () => {
      const originalExistsSync = fs.existsSync;
      vi.spyOn(fs, 'existsSync').mockImplementation((p: fs.PathLike) => {
        const pStr = String(p);
        if (pStr.includes('templates')) return false;
        return originalExistsSync(p);
      });
      _resetPathCache();
      const templatesRoot = getTemplatesRoot();
      // Should return the sibling fallback path
      expect(path.basename(templatesRoot)).toBe('templates');
    });

    it('should prefer sibling templates directory', () => {
      const originalExistsSync = fs.existsSync;
      vi.spyOn(fs, 'existsSync').mockImplementation((p: fs.PathLike) => {
        const pStr = String(p);
        // Make sibling templates exist
        if (pStr.endsWith(path.join('engine', 'templates'))) return true;
        if (pStr.includes('templates')) return false;
        return originalExistsSync(p);
      });
      _resetPathCache();
      const templatesRoot = getTemplatesRoot();
      expect(templatesRoot).toContain('templates');
    });

    it('should use dist/templates when sibling does not exist but dist does', () => {
      const originalExistsSync = fs.existsSync;
      const pkgRoot = getPackageRoot();
      _resetPathCache();
      vi.spyOn(fs, 'existsSync').mockImplementation((p: fs.PathLike) => {
        const pStr = String(p);
        if (pStr.endsWith(path.join('engine', 'templates'))) return false;
        if (pStr === path.join(pkgRoot, 'dist', 'templates')) return true;
        if (pStr.includes('templates')) return false;
        return originalExistsSync(p);
      });
      const templatesRoot = getTemplatesRoot();
      expect(templatesRoot).toContain('templates');
    });

    it('should use package root templates when dist does not exist', () => {
      const originalExistsSync = fs.existsSync;
      const pkgRoot = getPackageRoot();
      _resetPathCache();
      vi.spyOn(fs, 'existsSync').mockImplementation((p: fs.PathLike) => {
        const pStr = String(p);
        if (pStr.endsWith(path.join('engine', 'templates'))) return false;
        if (pStr === path.join(pkgRoot, 'dist', 'templates')) return false;
        if (pStr === path.join(pkgRoot, 'templates')) return true;
        if (pStr.includes('templates')) return false;
        return originalExistsSync(p);
      });
      const templatesRoot = getTemplatesRoot();
      expect(templatesRoot).toBe(path.join(pkgRoot, 'templates'));
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

    it('should fallback when no skills directories exist', () => {
      const originalExistsSync = fs.existsSync;
      vi.spyOn(fs, 'existsSync').mockImplementation((p: fs.PathLike) => {
        const pStr = String(p);
        if (pStr.includes('skills')) return false;
        return originalExistsSync(p);
      });
      _resetPathCache();
      const skillsRoot = getSkillsRoot();
      expect(path.basename(skillsRoot)).toBe('skills');
    });

    it('should prefer sibling skills directory', () => {
      const originalExistsSync = fs.existsSync;
      vi.spyOn(fs, 'existsSync').mockImplementation((p: fs.PathLike) => {
        const pStr = String(p);
        if (pStr.endsWith(path.join('engine', 'skills'))) return true;
        if (pStr.includes('skills')) return false;
        return originalExistsSync(p);
      });
      _resetPathCache();
      const skillsRoot = getSkillsRoot();
      expect(skillsRoot).toContain('skills');
    });

    it('should use dist/skills when sibling does not exist but dist does', () => {
      const originalExistsSync = fs.existsSync;
      const pkgRoot = getPackageRoot();
      _resetPathCache();
      vi.spyOn(fs, 'existsSync').mockImplementation((p: fs.PathLike) => {
        const pStr = String(p);
        if (pStr.endsWith(path.join('engine', 'skills'))) return false;
        if (pStr === path.join(pkgRoot, 'dist', 'skills')) return true;
        if (pStr.includes('skills')) return false;
        return originalExistsSync(p);
      });
      const skillsRoot = getSkillsRoot();
      expect(skillsRoot).toBe(path.join(pkgRoot, 'dist', 'skills'));
    });

    it('should use package root skills when dist does not exist', () => {
      const originalExistsSync = fs.existsSync;
      const pkgRoot = getPackageRoot();
      _resetPathCache();
      vi.spyOn(fs, 'existsSync').mockImplementation((p: fs.PathLike) => {
        const pStr = String(p);
        if (pStr.endsWith(path.join('engine', 'skills'))) return false;
        if (pStr === path.join(pkgRoot, 'dist', 'skills')) return false;
        if (pStr === path.join(pkgRoot, 'skills')) return true;
        if (pStr.includes('skills')) return false;
        return originalExistsSync(p);
      });
      const skillsRoot = getSkillsRoot();
      expect(skillsRoot).toBe(path.join(pkgRoot, 'skills'));
    });

    it('should use bundled sibling or dist templates when SHAAGENT_BUNDLED is true', () => {
      process.env.SHAAGENT_BUNDLED = 'true';
      try {
        const pkgRoot = getPackageRoot();
        _resetPathCache();
        vi.spyOn(fs, 'existsSync').mockImplementation((p: fs.PathLike) => {
          const pStr = String(p);
          if (pStr.endsWith(path.join('engine', 'templates'))) return true;
          if (pStr.endsWith(path.join('engine', 'skills'))) return true;
          return false;
        });
        expect(getTemplatesRoot()).toContain('templates');
        expect(getSkillsRoot()).toContain('skills');

        vi.spyOn(fs, 'existsSync').mockImplementation((p: fs.PathLike) => {
          const pStr = String(p);
          if (pStr === path.join(pkgRoot, 'dist', 'templates')) return true;
          if (pStr === path.join(pkgRoot, 'dist', 'skills')) return true;
          return false;
        });
        expect(getTemplatesRoot()).toBe(path.join(pkgRoot, 'dist', 'templates'));
        expect(getSkillsRoot()).toBe(path.join(pkgRoot, 'dist', 'skills'));
      } finally {
        delete process.env.SHAAGENT_BUNDLED;
      }
    });
  });
});
