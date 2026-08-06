/**
 * Reads/writes shaagent.config.json in the current project.
 */

import fs from 'fs-extra';
import path from 'path';
import type { InitAnswers } from '../init';

const CONFIG_FILE = 'shaagent.config.json';

export async function saveConfig(answers: InitAnswers): Promise<void> {
  const config = {
    $schema: 'https://shaagent.dev/schema/v1.json',
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
  const configPath = path.join(process.cwd(), CONFIG_FILE);
  await fs.writeJson(configPath, config, { spaces: 2 });
}

export async function loadConfig(): Promise<Record<string, unknown> | null> {
  const configPath = path.join(process.cwd(), CONFIG_FILE);
  if (!(await fs.pathExists(configPath))) return null;
  return fs.readJson(configPath);
}
