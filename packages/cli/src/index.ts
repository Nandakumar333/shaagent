#!/usr/bin/env node
/**
 * shaagent - Multi-Agent Orchestration Scaffold CLI
 * Entry point: sets up Commander.js program and registers commands.
 */

import { Command } from 'commander';
import { initCommand } from './init';
import { skillCommand } from './install-skill';
import { listCommand } from './list';
import path from 'path';
import fs from 'fs';

// Read version from package.json at build/runtime
const pkgPath = path.resolve(__dirname, '..', 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

const program = new Command();

program
  .name('shaagent')
  .description('Scaffold production-grade multi-agent AI systems into any repository')
  .version(pkg.version);

program.addCommand(initCommand());
program.addCommand(skillCommand());
program.addCommand(listCommand());

program.parse(process.argv);
