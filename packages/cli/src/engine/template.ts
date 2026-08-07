/**
 * Template engine — renders Handlebars agent templates to disk.
 *
 * Uses a SINGLE set of generic templates for ALL platforms.
 * Platform-specific formatting (frontmatter, file naming, merged files)
 * is handled by this engine at render time.
 */

import Handlebars from 'handlebars';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import type { InitAnswers, Platform } from '../types';
import { getPlatformPaths } from '../platforms';
import { getTemplatesRoot } from './paths';

// Resolved at runtime via centralized path resolution
function getGenericDir(): string {
  return path.join(getTemplatesRoot(), 'generic', 'agents');
}

// ─── Handlebars Helpers ─────────────────────────────────────────────────────

Handlebars.registerHelper('eq', (a, b) => a === b);
Handlebars.registerHelper('neq', (a, b) => a !== b);
Handlebars.registerHelper('or', (...args) => {
  args.pop(); // remove Handlebars options
  return args.some(Boolean);
});
Handlebars.registerHelper('includes', (arr: string[], value: string) => {
  return Array.isArray(arr) && arr.includes(value);
});

// ─── Main Export ────────────────────────────────────────────────────────────

import type { RenderOptions } from '../types';

export async function renderAgents(answers: InitAnswers, options?: RenderOptions): Promise<string[]> {
  const dryRun = options?.dryRun ?? false;
  const platformPaths = getPlatformPaths(answers.platform, answers.scope);
  const { agentsDir, extension, mergedFile } = platformPaths;

  if (!dryRun) {
    await fs.ensureDir(agentsDir);
  }

  const allAgents = [...answers.coreAgents, ...answers.optionalAgents];
  const written: string[] = [];
  const context = buildContext(answers);

  if (mergedFile) {
    // Platforms like Codex use a single merged AGENTS.md file
    const mergedContent = await renderMergedFile(allAgents, context, answers.platform);
    const outFile = path.join(agentsDir, platformPaths.configFile);
    if (!dryRun) {
      await fs.writeFile(outFile, mergedContent, 'utf-8');
    }
    written.push(displayPath(outFile));
  } else {
    // Platforms that use individual files per agent
    for (const agentName of allAgents) {
      const templatePath = resolveTemplatePath(agentName);
      if (!templatePath) {
        console.warn(`  ⚠ No template found for agent "${agentName}"`);
        continue;
      }
      const raw = await fs.readFile(templatePath, 'utf-8');
      const compiled = Handlebars.compile(raw);
      let rendered = compiled(context);

      // Transform frontmatter for the target platform
      rendered = transformForPlatform(rendered, agentName, answers.platform, context);

      const outFile = path.join(agentsDir, `${agentName}${extension}`);
      if (!dryRun) {
        await fs.ensureDir(path.dirname(outFile));
        await fs.writeFile(outFile, rendered, 'utf-8');
      }
      written.push(displayPath(outFile));
    }

    // Generate root instruction file if platform needs one
    if (platformPaths.rootInstructionFile) {
      const rootContent = generateRootInstruction(allAgents, answers.platform, context);
      if (!dryRun) {
        await fs.ensureDir(path.dirname(platformPaths.rootInstructionFile));
        await fs.writeFile(platformPaths.rootInstructionFile, rootContent, 'utf-8');
      }
      written.push(displayPath(platformPaths.rootInstructionFile));
    }
  }

  return written;
}

/** Shortens an absolute path for display: relative to cwd inside a project, `~`-relative for global installs */
function displayPath(absPath: string): string {
  const cwdPrefix = process.cwd() + path.sep;
  if (absPath.startsWith(cwdPrefix)) return absPath.slice(cwdPrefix.length);
  const home = require('os').homedir() + path.sep;
  if (absPath.startsWith(home)) return path.join('~', absPath.slice(home.length));
  return absPath;
}

// ─── Template Resolution ────────────────────────────────────────────────────

/**
 * Resolves template path from the single generic templates directory.
 * Checks core agents first, then optional/ subdirectory.
 */
function resolveTemplatePath(agentName: string): string | null {
  const genericDir = getGenericDir();

  const corePath = path.join(genericDir, `${agentName}.md.hbs`);
  if (fs.existsSync(corePath)) return corePath;

  const optionalPath = path.join(genericDir, 'optional', `${agentName}.md.hbs`);
  if (fs.existsSync(optionalPath)) return optionalPath;

  return null;
}

// ─── Platform-Specific Transformations ──────────────────────────────────────

/**
 * Transforms rendered markdown content for the target platform.
 * Different platforms expect different frontmatter formats.
 */
function transformForPlatform(
  content: string,
  agentName: string,
  platform: Platform,
  context: Record<string, unknown>,
): string {
  // Parse existing frontmatter from the generic template
  const { frontmatter, body } = parseFrontmatter(content);

  switch (platform) {
    case 'opencode':
      return buildOpencodeFormat(frontmatter, body, agentName);

    case 'claude-code':
      return buildClaudeCodeFormat(frontmatter, body, agentName);

    case 'github-copilot':
      return buildCopilotFormat(frontmatter, body, agentName);

    case 'cursor':
      return buildCursorFormat(frontmatter, body, agentName);

    case 'continue':
      return buildContinueFormat(frontmatter, body, agentName);

    case 'windsurf':
      return buildWindsurfFormat(frontmatter, body, agentName);

    case 'gemini-cli':
      return buildGeminiFormat(frontmatter, body, agentName);

    case 'github-copilot-cli':
      return buildCopilotCliFormat(frontmatter, body, agentName);

    case 'codex':
      // Codex uses merged file, shouldn't reach here
      return content;

    default:
      return content;
  }
}

/**
 * OpenCode format: YAML frontmatter with description, mode, model, temperature, permission
 */
function buildOpencodeFormat(
  fm: Record<string, string>,
  body: string,
  agentName: string,
): string {
  const mode = agentName === 'orchestrator' ? 'primary' : 'subagent';
  const temperature = getTemperatureForAgent(agentName);

  const permission = getPermissionsForAgent(agentName);
  const permLines = Object.entries(permission)
    .map(([k, v]) => `  ${k}: ${v}`)
    .join('\n');

  const frontmatter = [
    '---',
    `description: ${fm.description || fm.name || agentName}`,
    `mode: ${mode}`,
    `model: ${fm.model || '{{model}}'}`,
    `temperature: ${temperature}`,
    'permission:',
    permLines,
    '---',
  ].join('\n');

  return `${frontmatter}\n\n${body}`;
}

/**
 * Claude Code format: No frontmatter for agents (content-only .md files in .claude/agents/)
 * Claude Code uses plain markdown; scope is provided by file location.
 */
function buildClaudeCodeFormat(
  fm: Record<string, string>,
  body: string,
  _agentName: string,
): string {
  // Claude Code agents are plain markdown (the CLAUDE.md imports them)
  // Add a comment header for identification
  const header = `<!-- Agent: ${fm.name || _agentName} | ${fm.description || ''} -->\n\n`;
  return `${header}${body}`;
}

/**
 * GitHub Copilot format: YAML frontmatter with applyTo for .agent.md files
 */
function buildCopilotFormat(
  fm: Record<string, string>,
  body: string,
  agentName: string,
): string {
  // Copilot .agent.md files use applyTo for scope
  const frontmatter = [
    '---',
    `applyTo: "**"`,
    '---',
    '',
    `# ${titleCase(agentName)} Agent`,
    '',
    `> ${fm.description || ''}`,
  ].join('\n');

  return `${frontmatter}\n\n${body}`;
}

/**
 * Cursor format: .mdc files with frontmatter
 */
function buildCursorFormat(
  fm: Record<string, string>,
  body: string,
  agentName: string,
): string {
  const frontmatter = [
    '---',
    `description: ${fm.description || agentName}`,
    `globs: "**"`,
    `alwaysApply: false`,
    '---',
  ].join('\n');

  return `${frontmatter}\n\n${body}`;
}

/**
 * Continue format: Plain markdown with metadata comment
 */
function buildContinueFormat(
  fm: Record<string, string>,
  body: string,
  agentName: string,
): string {
  const header = [
    `# ${titleCase(agentName)}`,
    '',
    `> ${fm.description || ''}`,
  ].join('\n');

  return `${header}\n\n${body}`;
}

/**
 * Windsurf format: .windsurf/rules/*.md with trigger/description frontmatter
 */
function buildWindsurfFormat(
  fm: Record<string, string>,
  body: string,
  agentName: string,
): string {
  const trigger = agentName === 'orchestrator' ? 'always_on' : 'model_decision';
  const frontmatter = [
    '---',
    `trigger: ${trigger}`,
    `description: ${fm.description || agentName}`,
    '---',
  ].join('\n');

  return `${frontmatter}\n\n${body}`;
}

/**
 * Gemini CLI format: plain markdown, imported into GEMINI.md via @-import syntax
 */
function buildGeminiFormat(
  fm: Record<string, string>,
  body: string,
  agentName: string,
): string {
  const header = `<!-- Agent: ${fm.name || agentName} | ${fm.description || ''} -->\n\n`;
  return `${header}${body}`;
}

/**
 * GitHub Copilot CLI format: .agent.md files with name/description frontmatter
 */
function buildCopilotCliFormat(
  fm: Record<string, string>,
  body: string,
  agentName: string,
): string {
  const frontmatter = [
    '---',
    `name: ${titleCase(agentName)}`,
    `description: ${fm.description || agentName}`,
    '---',
  ].join('\n');

  return `${frontmatter}\n\n${body}`;
}

// ─── Merged File (Codex / AGENTS.md) ────────────────────────────────────────

/**
 * For Codex: renders all agents into a single AGENTS.md file.
 * Follows the AGENTS.md spec (https://agents.md).
 */
async function renderMergedFile(
  agents: string[],
  context: Record<string, unknown>,
  _platform: Platform,
): Promise<string> {
  const sections: string[] = [];

  // Header
  sections.push(`# AGENTS.md — ${context.projectName}`);
  sections.push('');
  sections.push(`> Multi-agent orchestration instructions for coding agents.`);
  sections.push(`> Generated by shaagent. Scope: entire repository.`);
  sections.push('');

  if (context.techStack) {
    sections.push(`## Tech Stack`);
    sections.push(`${context.techStack}`);
    sections.push('');
  }

  if (context.infrastructure) {
    sections.push(`## Infrastructure`);
    sections.push(`${context.infrastructure}`);
    sections.push('');
  }

  sections.push('## Agent Roles');
  sections.push('');
  sections.push('The following agents operate in a sequential pipeline. Each agent has a specific responsibility:');
  sections.push('');
  sections.push('| Agent | Role |');
  sections.push('|-------|------|');

  // Render each agent template and append as a section
  for (const agentName of agents) {
    const templatePath = resolveTemplatePath(agentName);
    if (!templatePath) continue;

    const raw = await fs.readFile(templatePath, 'utf-8');
    const compiled = Handlebars.compile(raw);
    const rendered = compiled(context);
    const { frontmatter, body } = parseFrontmatter(rendered);

    sections[sections.length - 1] += `\n| ${titleCase(agentName)} | ${(frontmatter.description || '').replace(/\n/g, ' ').slice(0, 100)} |`;
  }

  sections.push('');
  sections.push('---');
  sections.push('');

  // Now add full agent instructions
  for (const agentName of agents) {
    const templatePath = resolveTemplatePath(agentName);
    if (!templatePath) continue;

    const raw = await fs.readFile(templatePath, 'utf-8');
    const compiled = Handlebars.compile(raw);
    const rendered = compiled(context);
    const { body } = parseFrontmatter(rendered);

    sections.push(`---`);
    sections.push('');
    sections.push(body.trim());
    sections.push('');
  }

  return sections.join('\n');
}

// ─── Root Instruction File Generation ───────────────────────────────────────

/**
 * Generates the root instruction file (CLAUDE.md or AGENTS.md)
 * that references/imports individual agent files.
 */
function generateRootInstruction(
  agents: string[],
  platform: Platform,
  context: Record<string, unknown>,
): string {
  const lines: string[] = [];

  if (platform === 'claude-code') {
    lines.push(`# ${context.projectName} — Agent Instructions`);
    lines.push('');
    lines.push(`## Project Context`);
    if (context.techStack) lines.push(`- **Tech Stack:** ${context.techStack}`);
    if (context.infrastructure) lines.push(`- **Infrastructure:** ${context.infrastructure}`);
    lines.push('');
    lines.push('## Multi-Agent Pipeline');
    lines.push('');
    lines.push('This project uses a multi-agent orchestration system. Agent instructions are in `.claude/agents/`:');
    lines.push('');
    for (const agent of agents) {
      lines.push(`- @.claude/agents/${agent}.md`);
    }
    lines.push('');
    lines.push('Start by reading the **orchestrator** agent instructions when working on any ticket or feature.');
  } else if (platform === 'github-copilot') {
    lines.push(`# AGENTS.md — ${context.projectName}`);
    lines.push('');
    lines.push(`This project uses a multi-agent orchestration pipeline.`);
    lines.push(`Agent instructions are in \`.github/agents/\`.`);
    lines.push('');
    if (context.techStack) lines.push(`**Tech Stack:** ${context.techStack}`);
    if (context.infrastructure) lines.push(`**Infrastructure:** ${context.infrastructure}`);
    lines.push('');
    lines.push('## Pipeline Order');
    lines.push('');
    lines.push('Execute agents in this sequence for feature work:');
    lines.push('1. Researcher → 2. Planner → 3. Developer → 4. QA → 5. Reviewer → 6. Review-Fix');
    lines.push('');
    lines.push('## Agent Details');
    lines.push('');
    lines.push('See `.github/agents/` for detailed per-agent instructions.');
  } else if (platform === 'gemini-cli') {
    lines.push(`# ${context.projectName} — Agent Instructions`);
    lines.push('');
    lines.push(`## Project Context`);
    if (context.techStack) lines.push(`- **Tech Stack:** ${context.techStack}`);
    if (context.infrastructure) lines.push(`- **Infrastructure:** ${context.infrastructure}`);
    lines.push('');
    lines.push('## Multi-Agent Pipeline');
    lines.push('');
    lines.push('This project uses a multi-agent orchestration system. Agent instructions are imported from `.gemini/agents/`:');
    lines.push('');
    for (const agent of agents) {
      lines.push(`@.gemini/agents/${agent}.md`);
    }
    lines.push('');
    lines.push('Start by reading the **orchestrator** agent instructions when working on any ticket or feature.');
  }

  return lines.join('\n') + '\n';
}

// ─── Context Builder ────────────────────────────────────────────────────────

function buildContext(answers: InitAnswers): Record<string, unknown> {
  const techStack = [
    ...answers.framework.map(f => frameworkLabel(f)),
    ...answers.language.map(l => languageLabel(l)),
  ].filter(Boolean).join(', ');

  // Resolve platform-appropriate plan/review/memory directories
  const planDir = getPlanDir(answers.platform);
  const reviewDir = getReviewDir(answers.platform);
  const memoryFile = getMemoryFile(answers.platform);

  return {
    projectName: answers.projectName,
    projectDescription: '',
    platform: answers.platform,
    language: answers.language,
    languageList: answers.language.join(', '),
    framework: answers.framework,
    frameworkList: answers.framework.join(', '),
    techStack,
    infrastructure: answers.infrastructure || '',
    cicd: answers.cicd || 'GitHub Actions',
    model: answers.model || 'anthropic/claude-sonnet-4-20250514',
    coreAgents: answers.coreAgents,
    optionalAgents: answers.optionalAgents,
    allAgents: [...answers.coreAgents, ...answers.optionalAgents],
    skills: answers.skills,
    hasSkills: answers.skills.length > 0,
    hasOptional: answers.optionalAgents.length > 0,
    year: new Date().getFullYear(),
    // Platform-specific paths used inside templates
    planDir,
    reviewDir,
    memoryFile,
  };
}

// ─── Utility Functions ──────────────────────────────────────────────────────

function parseFrontmatter(content: string): { frontmatter: Record<string, string>; body: string } {
  const fm: Record<string, string> = {};
  if (!content.startsWith('---')) {
    return { frontmatter: fm, body: content };
  }

  const endIdx = content.indexOf('---', 3);
  if (endIdx === -1) {
    return { frontmatter: fm, body: content };
  }

  const fmBlock = content.slice(3, endIdx).trim();
  const body = content.slice(endIdx + 3).trim();

  // Simple YAML-like parsing (key: value)
  for (const line of fmBlock.split('\n')) {
    const match = line.match(/^(\w+):\s*(.+)$/);
    if (match) {
      fm[match[1]] = match[2].trim();
    }
  }

  return { frontmatter: fm, body };
}

function titleCase(str: string): string {
  return str
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function getTemperatureForAgent(agentName: string): number {
  const temps: Record<string, number> = {
    orchestrator: 0.3,
    debugger: 0.2,
    researcher: 0.2,
    planner: 0.3,
    dev: 0.2,
    qa: 0.2,
    reviewer: 0.2,
    'reviewer-fix': 0.2,
    security: 0.1,
    'architecture-reviewer': 0.2,
    'project-memory-creator': 0.3,
  };
  return temps[agentName] ?? 0.3;
}

function getPermissionsForAgent(agentName: string): Record<string, string> {
  const readOnly: Record<string, string> = { edit: 'deny', bash: 'deny' };
  const writeAsk: Record<string, string> = { bash: 'ask', edit: 'allow' };
  const fullWrite: Record<string, string> = { bash: 'allow', edit: 'allow' };

  const perms: Record<string, Record<string, string>> = {
    orchestrator: fullWrite,
    // Debugger runs repro scripts and creates/deletes its own throwaway scratch files;
    // its instructions forbid touching production source.
    debugger: fullWrite,
    researcher: readOnly,
    planner: { edit: 'allow', bash: 'deny' },
    dev: writeAsk,
    qa: writeAsk,
    reviewer: readOnly,
    'reviewer-fix': writeAsk,
    security: readOnly,
    'architecture-reviewer': readOnly,
    'project-memory-creator': { edit: 'allow', bash: 'deny' },
  };

  return perms[agentName] ?? writeAsk;
}

// ─── Platform-Specific Path Map ─────────────────────────────────────────────

/** Lookup table for platform-specific plan/review/memory paths (eliminates repetitive switch statements) */
const PLATFORM_DIRS: Record<Platform, { plan: string; review: string; memory: string }> = {
  'opencode':           { plan: '.opencode/plans',  review: '.opencode/reviews',  memory: '.opencode/MEMORY.md' },
  'claude-code':        { plan: '.claude/plans',    review: '.claude/reviews',    memory: '.claude/MEMORY.md' },
  'github-copilot':     { plan: '.github/plans',    review: '.github/reviews',    memory: '.github/MEMORY.md' },
  'github-copilot-cli': { plan: '.github/plans',    review: '.github/reviews',    memory: '.github/MEMORY.md' },
  'codex':              { plan: '.codex/plans',     review: '.codex/reviews',     memory: '.codex/MEMORY.md' },
  'cursor':             { plan: '.cursor/plans',    review: '.cursor/reviews',    memory: '.cursor/MEMORY.md' },
  'continue':           { plan: '.continue/plans',  review: '.continue/reviews',  memory: '.continue/MEMORY.md' },
  'windsurf':           { plan: '.windsurf/plans',  review: '.windsurf/reviews',  memory: '.windsurf/MEMORY.md' },
  'gemini-cli':         { plan: '.gemini/plans',    review: '.gemini/reviews',    memory: '.gemini/MEMORY.md' },
};

function getPlanDir(platform: Platform): string {
  return PLATFORM_DIRS[platform]?.plan ?? '.ai/plans';
}

function getReviewDir(platform: Platform): string {
  return PLATFORM_DIRS[platform]?.review ?? '.ai/reviews';
}

function getMemoryFile(platform: Platform): string {
  return PLATFORM_DIRS[platform]?.memory ?? '.ai/MEMORY.md';
}

function frameworkLabel(f: string): string {
  const map: Record<string, string> = {
    dotnet8: '.NET 8',
    react: 'React',
    nextjs: 'Next.js',
    fastapi: 'FastAPI',
    angular: 'Angular',
    vue: 'Vue.js',
    mocha: 'Mocha',
  };
  return map[f] || f;
}

function languageLabel(l: string): string {
  const map: Record<string, string> = {
    csharp: 'C#',
    typescript: 'TypeScript',
    python: 'Python',
    javascript: 'JavaScript',
    rust: 'Rust',
    go: 'Go',
    java: 'Java',
  };
  return map[l] || l;
}
