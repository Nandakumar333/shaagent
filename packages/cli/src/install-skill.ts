/**
 * `shaagent skill install [name]` — install skills to the platform's skill directory
 */

import { Command } from "commander";
import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import inquirer from "inquirer";
import { getPlatformPaths } from "./platforms";
import { loadConfig } from "./engine/manifest";
import { getSkillsRoot } from "./engine/paths";
import {
  MANDATORY_SKILL_NAMES,
  OPTIONAL_SKILLS,
  resolveMandatorySkills,
} from "./prompts";
import type { Platform, Scope } from "./types";

/** Valid skill name pattern: alphanumeric, hyphens, underscores only */
const VALID_SKILL_NAME = /^[a-zA-Z0-9_-]+$/;

export function skillCommand(): Command {
  const cmd = new Command("skill");
  cmd.description("Manage skills for your multi-agent setup");

  cmd
    .command("install [skillName]")
    .description(
      "Install a skill (or interactively select optional skills alongside mandatory skills)",
    )
    .option("--platform <name>", "Override platform from shaagent.config.json")
    .option(
      "--global",
      "Install into the global (home directory) skill location",
    )
    .option(
      "-y, --yes",
      "Skip prompt and install mandatory + default optional skills",
    )
    .action(async (skillName: string | undefined, opts) => {
      const config = await loadConfig();
      const platform: Platform =
        opts.platform ??
        ((config as Record<string, unknown>)?.platform as Platform) ??
        "opencode";
      const scope: Scope = opts.global
        ? "global"
        : (((config as Record<string, unknown>)?.scope as Scope) ?? "project");

      if (skillName) {
        await installSkill(skillName, platform, scope);
        return;
      }

      let selectedOptional: string[];
      if (opts.yes) {
        selectedOptional = OPTIONAL_SKILLS.filter((s) => s.checked).map(
          (s) => s.value,
        );
      } else {
        const answers = await inquirer.prompt([
          {
            type: "checkbox",
            name: "skills",
            message:
              "Select optional skills to install (mandatory skills: review, solid-dev, security-scan, arch-review are auto-installed):",
            choices: OPTIONAL_SKILLS,
          },
        ] as any);
        selectedOptional = (answers as { skills?: string[] }).skills ?? [];
      }

      const skillsToInstall = resolveMandatorySkills(selectedOptional);
      for (const s of skillsToInstall) {
        await installSkill(s, platform, scope);
      }
    });

  cmd
    .command("list")
    .description("List available built-in skills")
    .action(async () => {
      const skillsRoot = getSkillsRoot();
      const skills = await fs.readdir(skillsRoot);
      console.log(chalk.cyan("\nAvailable skills:"));
      for (const s of skills) {
        const skillMd = path.join(skillsRoot, s, "SKILL.md");
        const exists = await fs.pathExists(skillMd);
        if (exists) {
          const badge = MANDATORY_SKILL_NAMES.includes(s)
            ? chalk.yellow("(mandatory)")
            : chalk.gray("(optional) ");
          console.log(
            `  · ${chalk.white(s.padEnd(16))} ${badge} ${chalk.gray(skillMd)}`,
          );
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

export async function installSkill(
  skillName: string,
  platform: Platform,
  scope: Scope = "project",
): Promise<void> {
  // Validate skill name to prevent path traversal
  if (!validateSkillName(skillName)) {
    console.error(
      chalk.red(
        `  ✗ Invalid skill name "${skillName}". Use only alphanumeric, hyphens, underscores.`,
      ),
    );
    return;
  }

  const skillsRoot = getSkillsRoot();
  const { skillsDir } = getPlatformPaths(platform, scope);
  const src = path.join(skillsRoot, skillName);

  if (!(await fs.pathExists(src))) {
    console.warn(
      chalk.yellow(
        `  ⚠ Skill "${skillName}" not found in built-in library, skipping.`,
      ),
    );
    return;
  }

  const dest = path.join(skillsDir, skillName);
  await fs.ensureDir(dest);
  await fs.copy(src, dest, { overwrite: false });

  const home = process.env.HOME ?? process.env.USERPROFILE ?? "";
  const displayPath = home ? dest.replace(home, "~") : dest;
  console.log(
    chalk.green(`  ✔ Installed skill: ${skillName} → ${displayPath}`),
  );
}
