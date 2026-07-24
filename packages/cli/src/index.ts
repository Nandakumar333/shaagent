#!/usr/bin/env node
/**
 * shaagent - Multi-Agent Orchestration Scaffold CLI
 * Entry point: sets up Commander.js program and registers commands.
 */

import { Command } from 'commander';
import { initCommand } from './init';
import { skillCommand } from './install-skill';
import { listCommand } from './list';

const program = new Command();

program
  .name('shaagent')
  .description('Scaffold production-grade multi-agent AI systems into any repository')
  .version('0.1.0');

program.addCommand(initCommand());
program.addCommand(skillCommand());
program.addCommand(listCommand());

program.parse(process.argv);
