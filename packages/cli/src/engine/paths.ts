/**
 * Centralized path resolution for shaagent package resources.
 *
 * Handles both development (running from src/) and production (bundled dist/) paths.
 *
 * When installed via npm, the layout is:
 *   node_modules/shaagent/
 *   ├── package.json
 *   └── dist/
 *       ├── index.js        ← __dirname points here
 *       ├── templates/      ← bundled templates
 *       └── skills/         ← bundled skills
 *
 * In development (monorepo):
 *   packages/cli/src/engine/ ← __dirname points here
 *   ../../templates/         ← monorepo root templates
 *   ../../skills/            ← monorepo root skills
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
        if (pkg.name === 'shaagent' || pkg.name === '@shaagent/cli') {
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
 *
 * Search order:
 * 1. Sibling to __dirname (bundled: dist/templates when running from dist/index.js)
 * 2. <packageRoot>/dist/templates (npm installed package)
 * 3. <packageRoot>/templates (if templates at package root)
 * 4. <monorepoRoot>/templates (development mode)
 */
export function getTemplatesRoot(): string {
  const pkgRoot = getPackageRoot();

  // 1. Sibling to the running script (dist/templates when bundled)
  const siblingTemplates = path.join(__dirname, 'templates');
  if (fs.existsSync(siblingTemplates)) {
    return siblingTemplates;
  }

  // 2. Inside dist/ under the package root (npm install)
  const distTemplates = path.join(pkgRoot, 'dist', 'templates');
  if (fs.existsSync(distTemplates)) {
    return distTemplates;
  }

  // 3. At the package root level
  const localTemplates = path.join(pkgRoot, 'templates');
  if (fs.existsSync(localTemplates)) {
    return localTemplates;
  }

  // 4. Development: templates are at the monorepo root
  const monorepoTemplates = path.resolve(pkgRoot, '../../templates');
  if (fs.existsSync(monorepoTemplates)) {
    return monorepoTemplates;
  }

  // Fallback — return the sibling path (most likely in production)
  return siblingTemplates;
}

/**
 * Returns the root directory where built-in skills are stored.
 *
 * Search order mirrors getTemplatesRoot().
 */
export function getSkillsRoot(): string {
  const pkgRoot = getPackageRoot();

  // 1. Sibling to the running script (dist/skills when bundled)
  const siblingSkills = path.join(__dirname, 'skills');
  if (fs.existsSync(siblingSkills)) {
    return siblingSkills;
  }

  // 2. Inside dist/ under the package root (npm install)
  const distSkills = path.join(pkgRoot, 'dist', 'skills');
  if (fs.existsSync(distSkills)) {
    return distSkills;
  }

  // 3. At the package root level
  const localSkills = path.join(pkgRoot, 'skills');
  if (fs.existsSync(localSkills)) {
    return localSkills;
  }

  // 4. Development: skills are at the monorepo root
  const monorepoSkills = path.resolve(pkgRoot, '../../skills');
  if (fs.existsSync(monorepoSkills)) {
    return monorepoSkills;
  }

  // Fallback
  return siblingSkills;
}

/**
 * Resets cached paths (useful for testing).
 */
export function _resetPathCache(): void {
  _packageRoot = null;
}
