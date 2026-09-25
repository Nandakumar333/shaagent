/**
 * Reads/writes shaagent.config.json in the current project.
 * Validates config against the JSON schema before saving.
 */

import fs from "fs-extra";
import path from "path";
import type { InitAnswers, Platform, Suite } from "../types";

const CONFIG_FILE = "shaagent.config.json";

const VALID_SUITES: Suite[] = ["development", "jira-analyser", "both"];

const VALID_PLATFORMS: Platform[] = [
  "opencode",
  "claude-code",
  "github-copilot",
  "github-copilot-cli",
  "codex",
  "cursor",
  "continue",
  "windsurf",
  "gemini-cli",
];

const VALID_CORE_AGENTS = [
  "orchestrator",
  "debugger",
  "researcher",
  "planner",
  "dev",
  "qa",
  "reviewer",
  "reviewer-fix",
  "ticket-analyser",
  "har-analyzer",
  "telemetry-investigator",
];

const VALID_OPTIONAL_AGENTS = [
  "security",
  "architecture-reviewer",
  "project-memory-creator",
];

const VALID_SKILLS = [
  "graphify",
  "caveman",
  "review",
  "tdd",
  "security-scan",
  "arch-review",
];

export interface ConfigValidationError {
  field: string;
  message: string;
}

/**
 * Validates config structure. Returns array of errors (empty = valid).
 * Lightweight validation without external dependency (no ajv needed for this schema size).
 */
function validateConfig(
  config: Record<string, unknown>,
): ConfigValidationError[] {
  const errors: ConfigValidationError[] = [];

  // Required: platform
  if (!config.platform || typeof config.platform !== "string") {
    errors.push({
      field: "platform",
      message: "platform is required and must be a string",
    });
  } else if (!VALID_PLATFORMS.includes(config.platform as Platform)) {
    errors.push({
      field: "platform",
      message: `Invalid platform "${config.platform}". Valid: ${VALID_PLATFORMS.join(", ")}`,
    });
  }

  // Optional: suite
  if (config.suite !== undefined) {
    if (
      typeof config.suite !== "string" ||
      !VALID_SUITES.includes(config.suite as Suite)
    ) {
      errors.push({
        field: "suite",
        message: `Invalid suite "${config.suite}". Valid: ${VALID_SUITES.join(", ")}`,
      });
    }
  }

  // Optional: model
  if (config.model !== undefined && typeof config.model !== "string") {
    errors.push({ field: "model", message: "model must be a string" });
  }

  // Optional: project
  if (config.project !== undefined) {
    if (typeof config.project !== "object" || config.project === null) {
      errors.push({ field: "project", message: "project must be an object" });
    } else {
      const proj = config.project as Record<string, unknown>;
      if (proj.language !== undefined && !Array.isArray(proj.language)) {
        errors.push({
          field: "project.language",
          message: "project.language must be an array",
        });
      }
      if (proj.framework !== undefined && !Array.isArray(proj.framework)) {
        errors.push({
          field: "project.framework",
          message: "project.framework must be an array",
        });
      }
    }
  }

  // Optional: agents
  if (config.agents !== undefined) {
    if (typeof config.agents !== "object" || config.agents === null) {
      errors.push({ field: "agents", message: "agents must be an object" });
    } else {
      const agents = config.agents as Record<string, unknown>;
      if (agents.core !== undefined) {
        if (!Array.isArray(agents.core)) {
          errors.push({
            field: "agents.core",
            message: "agents.core must be an array",
          });
        } else {
          for (const a of agents.core) {
            if (!VALID_CORE_AGENTS.includes(a as string)) {
              errors.push({
                field: "agents.core",
                message: `Invalid core agent "${a}". Valid: ${VALID_CORE_AGENTS.join(", ")}`,
              });
            }
          }
        }
      }
      if (agents.optional !== undefined) {
        if (!Array.isArray(agents.optional)) {
          errors.push({
            field: "agents.optional",
            message: "agents.optional must be an array",
          });
        } else {
          for (const a of agents.optional) {
            if (!VALID_OPTIONAL_AGENTS.includes(a as string)) {
              errors.push({
                field: "agents.optional",
                message: `Invalid optional agent "${a}". Valid: ${VALID_OPTIONAL_AGENTS.join(", ")}`,
              });
            }
          }
        }
      }
    }
  }

  // Optional: skills
  if (config.skills !== undefined) {
    if (typeof config.skills !== "object" || config.skills === null) {
      errors.push({ field: "skills", message: "skills must be an object" });
    } else {
      const skills = config.skills as Record<string, unknown>;
      if (skills.installed !== undefined) {
        if (!Array.isArray(skills.installed)) {
          errors.push({
            field: "skills.installed",
            message: "skills.installed must be an array",
          });
        } else {
          for (const s of skills.installed) {
            if (!VALID_SKILLS.includes(s as string)) {
              errors.push({
                field: "skills.installed",
                message: `Invalid skill "${s}". Valid: ${VALID_SKILLS.join(", ")}`,
              });
            }
          }
        }
      }
    }
  }

  // Optional: datadog
  if (config.datadog !== undefined) {
    if (typeof config.datadog !== "object" || config.datadog === null) {
      errors.push({ field: "datadog", message: "datadog must be an object" });
    }
  }

  // Optional: jira
  if (config.jira !== undefined) {
    if (typeof config.jira !== "object" || config.jira === null) {
      errors.push({ field: "jira", message: "jira must be an object" });
    }
  }

  // Optional: gitlab
  if (config.gitlab !== undefined) {
    if (typeof config.gitlab !== "object" || config.gitlab === null) {
      errors.push({ field: "gitlab", message: "gitlab must be an object" });
    }
  }

  return errors;
}

export async function saveConfig(answers: InitAnswers): Promise<void> {
  const config: Record<string, unknown> = {
    $schema: "https://shaagent.dev/schema/v1.json",
    platform: answers.platform,
    scope: answers.scope,
    model: answers.model,
    project: {
      name: answers.projectName,
      language: answers.language,
      framework: answers.framework,
      infrastructure: answers.infrastructure,
      cicd: answers.cicd,
    },
    agents: {
      core: answers.coreAgents,
      optional: answers.optionalAgents,
    },
    skills: {
      installed: answers.skills,
    },
  };

  if (answers.suite) {
    config.suite = answers.suite;
  }
  if (answers.datadog) {
    config.datadog = answers.datadog;
  }
  if (answers.jira) {
    config.jira = answers.jira;
  }
  if (answers.gitlab) {
    config.gitlab = answers.gitlab;
  }

  const errors = validateConfig(config);
  if (errors.length > 0) {
    const msgs = errors.map((e) => `  - ${e.field}: ${e.message}`).join("\n");
    throw new Error(`Invalid configuration:\n${msgs}`);
  }

  const configPath = path.join(process.cwd(), CONFIG_FILE);
  await fs.writeJson(configPath, config, { spaces: 2 });
}

export async function loadConfig(): Promise<Record<string, unknown> | null> {
  const configPath = path.join(process.cwd(), CONFIG_FILE);
  if (!(await fs.pathExists(configPath))) return null;

  const config = await fs.readJson(configPath);

  const errors = validateConfig(config);
  if (errors.length > 0) {
    const msgs = errors.map((e) => `  - ${e.field}: ${e.message}`).join("\n");
    throw new Error(
      `Invalid ${CONFIG_FILE}:\n${msgs}\n\nRun "shaagent init" to regenerate.`,
    );
  }

  return config;
}
