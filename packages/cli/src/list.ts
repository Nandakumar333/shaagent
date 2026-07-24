/**
 * `shaagent list` — list agents and skills
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { loadConfig } from './engine/manifest';

export function listCommand(): Command {
  const cmd = new Command('list');
  cmd.description('List installed agents and skills');
  cmd.action(async () => {
    const config = await loadConfig() as any;
    if (!config) {
      console.log(chalk.yellow('No shaagent.config.json found. Run `shaagent init` first.'));
      return;
    }
    console.log(chalk.cyan(`\nPlatform: ${config.platform}`));
    console.log(chalk.cyan(`Project:  ${config.project?.name}`));
    console.log(chalk.white('\nCore Agents:'));
    config.agents?.core?.forEach((a: string) => console.log(`  · ${a}`));
    if (config.agents?.optional?.length) {
      console.log(chalk.white('\nOptional Agents:'));
      config.agents.optional.forEach((a: string) => console.log(`  · ${a}`));
    }
    console.log(chalk.white('\nInstalled Skills:'));
    config.skills?.installed?.forEach((s: string) => console.log(`  · ${s}`));
    console.log();
  });
  return cmd;
}
