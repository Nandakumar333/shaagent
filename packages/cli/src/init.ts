/**
 * `shaagent init` — interactive setup wizard
 */

import { Command } from 'commander';
import { prompt } from './prompts';
import { renderAgents } from './engine/template';
import { installSkill } from './install-skill';
import { saveConfig } from './engine/manifest';
import chalk from 'chalk';
import ora from 'ora';

export function initCommand(): Command {
  const cmd = new Command('init');
  cmd
    .description('Initialize multi-agent setup in the current repository')
    .option('-y, --yes', 'Skip prompts and use defaults')
    .option('--platform <name>', 'AI platform (opencode|claude-code|github-copilot|codex|cursor|continue)')
    .option('--dry-run', 'Preview what files would be written without making changes')
    .action(async (opts) => {
      console.log(chalk.cyan('\n  ╔══════════════════════════════════════╗'));
      console.log(chalk.cyan('  ║        shaagent init                 ║'));
      console.log(chalk.cyan('  ╚══════════════════════════════════════╝\n'));

      if (opts.dryRun) {
        console.log(chalk.yellow('  ⚡ DRY RUN — no files will be written\n'));
      }

      const answers = opts.yes ? getDefaults(opts.platform) : await prompt(opts.platform);

      const spinner = ora('Generating agent files...').start();
      try {
        const written = await renderAgents(answers, { dryRun: opts.dryRun ?? false });
        spinner.succeed(opts.dryRun ? 'Agent files previewed (dry run)' : 'Agent files written');

        // Install skills
        if (answers.skills.length > 0 && !opts.dryRun) {
          const skillSpinner = ora('Installing skills...').start();
          for (const skill of answers.skills) {
            await installSkill(skill, answers.platform);
          }
          skillSpinner.succeed(`Skills installed: ${answers.skills.join(', ')}`);
        } else if (answers.skills.length > 0 && opts.dryRun) {
          console.log(chalk.gray(`  Skills to install: ${answers.skills.join(', ')}`));
        }

        if (!opts.dryRun) {
          await saveConfig(answers);
        }

        console.log('\n' + chalk.green(opts.dryRun ? '  ✅ Dry run complete!' : '  ✅ Multi-agent setup complete!'));
        console.log(chalk.gray(opts.dryRun ? '     Files that would be written:' : '     Agents written:'));
        written.forEach(f => console.log(chalk.gray(`       · ${f}`)));
        if (!opts.dryRun) {
          console.log(chalk.gray('\n     Start with: open your AI tool and ask the Orchestrator for help.\n'));
        }
      } catch (err) {
        spinner.fail('Setup failed');
        console.error(chalk.red(String(err)));
        process.exit(1);
      }
    });
  return cmd;
}

function getDefaults(platform?: string): InitAnswers {
  return {
    platform: (platform as Platform) ?? 'opencode',
    projectName: 'my-project',
    language: ['csharp', 'typescript', 'python'],
    framework: ['dotnet8', 'react'],
    infrastructure: 'AWS + Kubernetes',
    cicd: 'GitHub Actions',
    model: 'github-copilot/claude-sonnet-4.6',
    coreAgents: ['orchestrator', 'researcher', 'planner', 'dev', 'qa', 'reviewer', 'reviewer-fix'],
    optionalAgents: [],
    skills: ['graphify', 'caveman', 'review'],
  };
}

export interface InitAnswers {
  platform: Platform;
  projectName: string;
  language: string[];
  framework: string[];
  infrastructure: string;
  cicd: string;
  model: string;
  coreAgents: string[];
  optionalAgents: string[];
  skills: string[];
}

export interface RenderOptions {
  dryRun: boolean;
}

export type Platform =
  | 'opencode'
  | 'claude-code'
  | 'github-copilot'
  | 'codex'
  | 'cursor'
  | 'continue';
