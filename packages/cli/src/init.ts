/**
 * `shaagent init` — interactive setup wizard
 */

import { Command } from "commander";
import { prompt, getDefaultModel } from "./prompts";
import { renderAgents } from "./engine/template";
import { installSkill } from "./install-skill";
import { saveConfig } from "./engine/manifest";
import { getPlatformPaths } from "./platforms";
import chalk from "chalk";
import ora from "ora";
import type {
  Platform,
  Scope,
  Suite,
  InitAnswers,
  RenderOptions,
} from "./types";

// Re-export types for backward compatibility
export type { Platform, Scope, Suite, InitAnswers, RenderOptions };

export function initCommand(): Command {
  const cmd = new Command("init");
  cmd
    .description("Initialize multi-agent setup in the current repository")
    .option("-y, --yes", "Skip prompts and use defaults")
    .option(
      "--platform <name>",
      "AI platform (opencode|claude-code|github-copilot|github-copilot-cli|codex|cursor|continue|windsurf|gemini-cli)",
    )
    .option(
      "--global",
      "Install agents/skills once for this user (home directory), skipping the scope prompt",
    )
    .option(
      "--project",
      "Install agents/skills into the current repository only, skipping the scope prompt",
    )
    .option(
      "--suite <type>",
      "Agent suite to install (development|jira-analyser|both)",
    )
    .option(
      "--dry-run",
      "Preview what files would be written without making changes",
    )
    .action(async (opts) => {
      console.log(chalk.cyan("\n  ╔══════════════════════════════════════╗"));
      console.log(chalk.cyan("  ║        shaagent init                 ║"));
      console.log(chalk.cyan("  ╚══════════════════════════════════════╝\n"));

      if (opts.dryRun) {
        console.log(chalk.yellow("  ⚡ DRY RUN — no files will be written\n"));
      }

      const scopeFlag: Scope | undefined = opts.global
        ? "global"
        : opts.project
          ? "project"
          : undefined;
      const suiteFlag: Suite | undefined = opts.suite;

      const answers = opts.yes
        ? getDefaults(opts.platform, scopeFlag, suiteFlag)
        : await prompt(opts.platform, scopeFlag, suiteFlag);

      const { note } = getPlatformPaths(answers.platform, answers.scope);
      if (note) {
        console.log(chalk.yellow(`  ⚠ ${note}\n`));
      }

      const spinner = ora(
        `Generating agent files (${answers.scope})...`,
      ).start();
      try {
        const written = await renderAgents(answers, {
          dryRun: opts.dryRun ?? false,
        });
        spinner.succeed(
          opts.dryRun
            ? "Agent files previewed (dry run)"
            : "Agent files written",
        );

        // Install skills
        if (answers.skills.length > 0 && !opts.dryRun) {
          const skillSpinner = ora("Installing skills...").start();
          for (const skill of answers.skills) {
            await installSkill(skill, answers.platform, answers.scope);
          }
          skillSpinner.succeed(
            `Skills installed: ${answers.skills.join(", ")}`,
          );
        } else if (answers.skills.length > 0 && opts.dryRun) {
          console.log(
            chalk.gray(`  Skills to install: ${answers.skills.join(", ")}`),
          );
        }

        if (!opts.dryRun) {
          await saveConfig(answers);
        }

        console.log(
          "\n" +
            chalk.green(
              opts.dryRun
                ? "  ✅ Dry run complete!"
                : "  ✅ Multi-agent setup complete!",
            ),
        );
        console.log(
          chalk.gray(
            opts.dryRun
              ? "     Files that would be written:"
              : "     Agents written:",
          ),
        );
        written.forEach((f) => console.log(chalk.gray(`       · ${f}`)));
        if (!opts.dryRun) {
          if (
            answers.coreAgents.includes("ticket-analyser") &&
            !answers.coreAgents.includes("orchestrator")
          ) {
            console.log(
              chalk.gray(
                "\n     Start with: open your AI tool and ask the Ticket Analyser for help (e.g., triage a ticket).\n",
              ),
            );
          } else {
            console.log(
              chalk.gray(
                "\n     Start with: open your AI tool and ask the Orchestrator for help.\n",
              ),
            );
          }
        }
      } catch (err) {
        spinner.fail("Setup failed");
        console.error(chalk.red(String(err)));
        process.exit(1);
      }
    });
  return cmd;
}

export function getDefaults(
  platform?: string,
  scope?: Scope,
  suite?: Suite,
): InitAnswers {
  const chosenSuite: Suite = suite ?? "development";
  const chosenPlatform: Platform = (platform as Platform) ?? "opencode";

  if (chosenSuite === "jira-analyser") {
    return {
      platform: chosenPlatform,
      scope: scope ?? "project",
      suite: "jira-analyser",
      projectName: "my-project",
      language: [],
      framework: [],
      infrastructure: "",
      cicd: "",
      model: getDefaultModel(chosenPlatform),
      coreAgents: [
        "ticket-analyser",
        "har-analyzer",
        "telemetry-investigator",
        "researcher",
      ],
      optionalAgents: [],
      skills: ["graphify", "caveman", "review"],
      jira: {
        url: "https://your-domain.atlassian.net",
        projectKey: "PROJ",
      },
      datadog: {
        eu: {
          url: "https://app.datadoghq.com/",
          site: "datadoghq.com",
          useMcp: true,
        },
      },
    };
  }

  if (chosenSuite === "both") {
    return {
      platform: chosenPlatform,
      scope: scope ?? "project",
      suite: "both",
      projectName: "my-project",
      language: ["csharp", "typescript", "python"],
      framework: ["dotnet8", "react"],
      infrastructure: "AWS + Kubernetes",
      cicd: "GitHub Actions",
      model: getDefaultModel(chosenPlatform),
      coreAgents: [
        "orchestrator",
        "ticket-analyser",
        "har-analyzer",
        "telemetry-investigator",
        "debugger",
        "researcher",
        "planner",
        "dev",
        "qa",
        "reviewer",
        "reviewer-fix",
      ],
      optionalAgents: [],
      skills: ["graphify", "caveman", "review"],
      jira: {
        url: "https://your-domain.atlassian.net",
        projectKey: "PROJ",
      },
      datadog: {
        eu: {
          url: "https://app.datadoghq.com/",
          site: "datadoghq.com",
          useMcp: true,
        },
      },
    };
  }

  return {
    platform: chosenPlatform,
    scope: scope ?? "project",
    suite: "development",
    projectName: "my-project",
    language: ["csharp", "typescript", "python"],
    framework: ["dotnet8", "react"],
    infrastructure: "AWS + Kubernetes",
    cicd: "GitHub Actions",
    model: getDefaultModel(chosenPlatform),
    coreAgents: [
      "orchestrator",
      "debugger",
      "researcher",
      "planner",
      "dev",
      "qa",
      "reviewer",
      "reviewer-fix",
    ],
    optionalAgents: [],
    skills: ["graphify", "caveman", "review"],
  };
}
