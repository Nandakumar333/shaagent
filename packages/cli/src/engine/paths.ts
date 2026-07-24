/**
 * Centralized path resolution for shaagent package resources.
 *
 * Handles both development (running from src/) and production (bundled dist/) paths.
 * Uses package.json location as the anchor point for reliable resolution.
 */

import path from 'path';
import fs from 'fs';

/**
 * Find the package root by walking up from __dirname until we find package.json
 * that belongs to shaagent (not a dependency's package.json).
 */
function findPackageRoot(): string {
  let dir = __dirname;
  const maxDepth = 10;
  let depth = 0;

  while (depth < maxDepth) {
    const pkgPath = path.join(dir, 'package.json');
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        if (pkg.name === 'shaagent') {
          return dir;
        }
      } catch {
        // Continue searching
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) break; // Reached filesystem root
    dir = parent;
    depth++;
  }

  // Fallback: assume standard monorepo structure
  return path.resolve(__dirname, '../..');
}

let _packageRoot: string | null = null;

/** Returns the root directory of the shaagent CLI package */
export function getPackageRoot(): string {
  if (!_packageRoot) {
    _packageRoot = findPackageRoot();
  }
  return _packageRoot;
}

/**
 * Returns the root directory where templates are stored.
 * In development: <monorepo>/templates
 * In production (bundled): <package>/templates
 */
export function getTemplatesRoot(): string {
  const pkgRoot = getPackageRoot();

  // Check if templates are in the package itself (bundled distribution)
  const localTemplates = path.join(pkgRoot, 'templates');
  if (fs.existsSync(localTemplates)) {
    return localTemplates;
  }

  // Development: templates are at the monorepo root
  const monorepoTemplates = path.resolve(pkgRoot, '../../templates');
  if (fs.existsSync(monorepoTemplates)) {
    return monorepoTemplates;
  }

  // Fallback
  return localTemplates;
}

/**
 * Returns the root directory where built-in skills are stored.
 * In development: <monorepo>/skills
 * In production (bundled): <package>/skills
 */
export function getSkillsRoot(): string {
  const pkgRoot = getPackageRoot();

  // Check if skills are in the package itself (bundled distribution)
  const localSkills = path.join(pkgRoot, 'skills');
  if (fs.existsSync(localSkills)) {
    return localSkills;
  }

  // Development: skills are at the monorepo root
  const monorepoSkills = path.resolve(pkgRoot, '../../skills');
  if (fs.existsSync(monorepoSkills)) {
    return monorepoSkills;
  }

  // Fallback
  return localSkills;
}

/**
 * Resets cached paths (useful for testing).
 */
export function _resetPathCache(): void {
  _packageRoot = null;
}
