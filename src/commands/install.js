#!/usr/bin/env node

/**
 * @fileoverview Install command - Platform-agnostic installation of development tools.
 * Locates and executes install scripts from src/installs/.
 */

const { Command } = require('commander');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const INSTALLS_DIR = path.join(__dirname, '..', 'installs');

/**
 * Get list of available install scripts
 * @returns {string[]} Array of install script names
 */
function getAvailableInstalls() {
  try {
    if (!fs.existsSync(INSTALLS_DIR)) {
      return [];
    }
    return fs.readdirSync(INSTALLS_DIR)
      .filter(file => file.endsWith('.js'))
      .map(file => file.replace('.js', ''))
      .sort();
  } catch {
    return [];
  }
}

/**
 * Prompt user for confirmation
 * @param {string} question - Question to ask
 * @returns {Promise<boolean>}
 */
function confirm(question) {
  return new Promise(resolve => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    rl.question(`${question} (y/n): `, answer => {
      rl.close();
      resolve(answer.toLowerCase().startsWith('y'));
    });
  });
}

/**
 * List all available install scripts
 */
function listInstalls() {
  const installs = getAvailableInstalls();

  if (installs.length === 0) {
    console.log('\nNo install scripts available.');
    console.log(`Install scripts should be placed in: ${INSTALLS_DIR}\n`);
    return;
  }

  console.log('\nAvailable install scripts:');
  console.log('─'.repeat(40));

  for (const name of installs) {
    console.log(`  ${name}`);
  }

  console.log(`\nUsage: dev install <name>`);
  console.log('');
}

/**
 * Run an install script
 * @param {string} name - Name of the install script
 * @param {object} options - Command options
 */
async function runInstall(name, options) {
  if (!name) {
    console.error('\nError: No package specified.');
    console.log('Usage: dev install <name>');
    console.log('Run `dev install --list` to see available options.\n');
    process.exit(1);
  }

  const scriptPath = path.join(INSTALLS_DIR, `${name}.js`);

  // Check if install script exists
  if (!fs.existsSync(scriptPath)) {
    console.error(`\nError: Unknown package "${name}".`);
    console.log('Run `dev install --list` to see available options.\n');
    process.exit(1);
  }

  // Confirm installation (unless --force)
  if (!options.force) {
    console.log(`\nPreparing to install: ${name}`);

    if (options.dryRun) {
      console.log('[Dry run mode - no changes will be made]\n');
    }

    const shouldProceed = await confirm('Proceed with installation?');
    if (!shouldProceed) {
      console.log('Installation cancelled.');
      return;
    }
  }

  try {
    // Load the install script
    const installScript = require(scriptPath);

    // Check for install function
    if (typeof installScript.install !== 'function') {
      console.error(`\nError: Install script "${name}" does not export an install() function.`);
      process.exit(1);
    }

    console.log(`\nInstalling ${name}...`);
    if (options.verbose) {
      console.log(`Script: ${scriptPath}`);
    }

    // Pass options to the install function
    const installOptions = {
      dryRun: options.dryRun || false,
      verbose: options.verbose || false,
      force: options.force || false
    };

    // Run the install
    await installScript.install(installOptions);

    if (!options.dryRun) {
      console.log(`\n${name} installation complete.`);
    }

  } catch (err) {
    console.error(`\nError installing ${name}:`, err.message);
    if (options.verbose) {
      console.error(err.stack);
    }
    process.exit(1);
  }
}

/**
 * Handle the install command
 * @param {string} name - Package name to install
 * @param {object} options - Command options
 */
async function handleInstall(name, options) {
  if (options.list) {
    listInstalls();
    return;
  }

  await runInstall(name, options);
}

// Create and configure the command
const install = new Command('install')
  .description('Platform-agnostic installation of development tools')
  .argument('[name]', 'Name of the package to install')
  .option('--list', 'List all available install scripts')
  .option('--dry-run', 'Show what would be executed without running')
  .option('--force', 'Skip confirmation prompts')
  .option('--verbose', 'Show detailed output during installation')
  .action(handleInstall);

module.exports = install;
