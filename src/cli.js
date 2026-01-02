#!/usr/bin/env node

/**
 * @fileoverview CLI setup using Commander.js
 * Registers all commands and handles program execution.
 */

const { program } = require('commander');
const pkg = require('../package.json');

const configureCommand = require('./commands/configure');
const statusCommand = require('./commands/status');
const identityCommand = require('./commands/identity');
const ignoreCommand = require('./commands/ignore');
const installCommand = require('./commands/install');
const { installCompletion, uninstallCompletion } = require('./completion');

/**
 * Run the CLI program
 */
function run() {
  program
    .name('dev')
    .description('CLI toolkit for bootstrapping development environments')
    .version(pkg.version, '-v, --version', 'Display version number');

  // Global options
  program
    .option('--verbose', 'Enable verbose output')
    .option('-q, --quiet', 'Suppress non-essential output')
    .option('--no-color', 'Disable colored output');

  // Add commands
  program.addCommand(configureCommand);
  program.addCommand(statusCommand);
  program.addCommand(identityCommand);
  program.addCommand(ignoreCommand);
  program.addCommand(installCommand);

  // Setup command - install essential tools
  const setupCommand = require('./commands/setup');
  program.addCommand(setupCommand);

  // Completion management
  const completion = program
    .command('completion')
    .description('Manage shell tab completion');

  completion
    .command('install')
    .description('Install tab completion for your shell')
    .action(installCompletion);

  completion
    .command('uninstall')
    .description('Remove tab completion')
    .action(uninstallCompletion);

  // Parse and execute
  program.parse(process.argv);

  // If no command specified, show help
  if (process.argv.length === 2) {
    program.help();
  }
}

module.exports = { run };
