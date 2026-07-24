/**
 * `shaagent skill install <name>` — install a skill to the platform's skill directory
 */

import { Command } from 'commander';
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { getPlatformPaths } from './platforms';
import { loadConfig } from './engine/manifest';
import { getSkillsRoot } from './engine/paths';
import type { Platform } from './init';

/** Valid skill name pattern: alphanumeric, hyphens, underscores only */
const VALID_SKILL_NAME = /^[a-zA-Z0-9_-]+$/;

export function skillCommand(): Command {
  const cmd = new Command('skill');
  cmd.description('Manage skills for your multi-agent setup');

  cmd
    .command('install <skillName>')
    .description('Install a skill to your AI platform skill directory')
    .option('--platform <name>', 'Override platform from shaagent.config.json')
    .action(async (skillName: string, opts) => {
      const config = await loadConfig();
      const platform: Platform = opts.platform ?? (config as any)?.platform ?? 'opencode';
      await installSkill(skillName, platform);
    });

  cmd
    .command('list')
    .description('List available built-in skills')
    .action(async () => {
      const skillsRoot = getSkillsRoot();
      const skills = await fs.readdir(skillsRoot);
      console.log(chalk.cyan('\nAvailable skills:'));
      for (const s of skills) {
        const skillMd = path.join(skillsRoot, s, 'SKILL.md');
        const exists = await fs.pathExists(skillMd);
        if (exists) {
          console.log(`  · ${chalk.white(s.padEnd(22))} ${chalk.gray(skillMd)}`);
        }
      }
    });

  return cmd;
}

/**
 * Validates a skill name to prevent path traversal and injection attacks.
 * Only allows alphanumeric characters, hyphens, and underscores.
 */
export function validateSkillName(skillName: string): boolean {
  if (!skillName || skillName.length === 0 || skillName.length > 64) {
    return false;
  }
  if (!VALID_SKILL_NAME.test(skillName)) {
    return false;
  }
  // Extra safety: reject if path resolution escapes the skills root
  const skillsRoot = getSkillsRoot();
  const resolved = path.resolve(skillsRoot, skillName);
  if (!resolved.startsWith(skillsRoot)) {
    return false;
  }
  return true;
}

export async function installSkill(skillName: string, platform: Platform): Promise<void> {
  // Validate skill name to prevent path traversal
  if (!validateSkillName(skillName)) {
    console.error(chalk.red(`  ✗ Invalid skill name "${skillName}". Use only alphanumeric, hyphens, underscores.`));
    return;
  }

  const skillsRoot = getSkillsRoot();
  const { skillsDir } = getPlatformPaths(platform);
  const src = path.join(skillsRoot, skillName);

  if (!(await fs.pathExists(src))) {
    console.warn(chalk.yellow(`  ⚠ Skill "${skillName}" not found in built-in library, skipping.`));
    return;
  }

  const dest = path.join(skillsDir, skillName);
  await fs.ensureDir(dest);
  await fs.copy(src, dest, { overwrite: false });

  const home = process.env.HOME ?? process.env.USERPROFILE ?? '';
  const displayPath = home ? dest.replace(home, '~') : dest;
  console.log(chalk.green(`  ✔ Installed skill: ${skillName} → ${displayPath}`));
}
