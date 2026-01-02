#!/usr/bin/env node

/**
 * @fileoverview Setup command - Install essential tools required for DevUtils CLI to function.
 * This includes git, ssh-keygen, gpg, and other core dependencies.
 */

const { Command } = require('commander');
const readline = require('readline');

const shell = require('../utils/common/shell');
const osUtils = require('../utils/common/os');

// Essential tools that DevUtils CLI requires
const ESSENTIAL_TOOLS = [
  {
    name: 'git',
    command: 'git',
    description: 'Version control system',
    install: 'git'
  },
  {
    name: 'ssh-keygen',
    command: 'ssh-keygen',
    description: 'SSH key generation',
    install: 'openssh'
  },
  {
    name: 'gpg',
    command: 'gpg',
    description: 'GPG encryption and signing',
    install: 'gpg'
  },
  {
    name: 'curl',
    command: 'curl',
    description: 'Data transfer tool',
    install: 'curl'
  }
];

/**
 * Create readline interface for prompts
 * @returns {readline.Interface}
 */
function createPrompt() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

/**
 * Prompt user for confirmation
 * @param {readline.Interface} rl - Readline interface
 * @param {string} question - Question to ask
 * @returns {Promise<boolean>}
 */
function confirm(rl, question) {
  return new Promise(resolve => {
    rl.question(`${question} (y/n): `, answer => {
      resolve(answer.toLowerCase().startsWith('y'));
    });
  });
}

/**
 * Check which essential tools are missing
 * @returns {Array<object>} Array of missing tools
 */
function checkMissingTools() {
  const missing = [];
  for (const tool of ESSENTIAL_TOOLS) {
    if (!shell.commandExists(tool.command)) {
      missing.push(tool);
    }
  }
  return missing;
}

/**
 * Get all tool statuses
 * @returns {Array<{ tool: object, installed: boolean }>}
 */
function getToolStatuses() {
  return ESSENTIAL_TOOLS.map(tool => ({
    tool,
    installed: shell.commandExists(tool.command)
  }));
}

/**
 * Install a tool using the appropriate installer
 * @param {object} tool - Tool definition
 * @returns {Promise<boolean>} True if installation succeeded
 */
async function installTool(tool) {
  try {
    const installer = require(`../installs/${tool.install}`);
    if (typeof installer.install === 'function') {
      return await installer.install();
    }
    console.error(`  No install function found for ${tool.name}`);
    return false;
  } catch (err) {
    console.error(`  Failed to install ${tool.name}: ${err.message}`);
    return false;
  }
}

/**
 * Display tool status table
 * @param {Array<{ tool: object, installed: boolean }>} statuses
 */
function displayToolStatus(statuses) {
  console.log('\nEssential Tools:');
  console.log('─'.repeat(50));

  for (const { tool, installed } of statuses) {
    const status = installed ? '✓ Installed' : '✗ Missing';
    const statusColor = installed ? status : status;
    console.log(`  ${tool.name.padEnd(15)} ${statusColor.padEnd(15)} ${tool.description}`);
  }
  console.log('');
}

/**
 * Run the setup command
 * @param {object} options - Command options
 */
async function runSetup(options) {
  const platform = osUtils.detect();

  console.log('\n=== DevUtils CLI Setup ===\n');
  console.log(`Platform: ${platform.type}`);
  console.log(`Package Manager: ${platform.packageManager || 'unknown'}`);

  // Check tool statuses
  const statuses = getToolStatuses();
  displayToolStatus(statuses);

  // Find missing tools
  const missing = statuses.filter(s => !s.installed).map(s => s.tool);

  if (missing.length === 0) {
    console.log('All essential tools are already installed.\n');
    return;
  }

  console.log(`Missing ${missing.length} tool(s): ${missing.map(t => t.name).join(', ')}\n`);

  // Confirm installation unless --force
  let shouldInstall = options.force;
  if (!shouldInstall) {
    const rl = createPrompt();
    shouldInstall = await confirm(rl, 'Install missing tools?');
    rl.close();
  }

  if (!shouldInstall) {
    console.log('Setup cancelled.\n');
    return;
  }

  // Install each missing tool
  console.log('\nInstalling missing tools...\n');

  let installed = 0;
  let failed = 0;

  for (const tool of missing) {
    console.log(`Installing ${tool.name}...`);
    const success = await installTool(tool);
    if (success) {
      installed++;
      console.log(`  ${tool.name} installed successfully.\n`);
    } else {
      failed++;
      console.log(`  ${tool.name} installation failed.\n`);
    }
  }

  // Show final status
  console.log('─'.repeat(50));
  console.log(`\nSetup complete: ${installed} installed, ${failed} failed.\n`);

  // Show updated status
  if (installed > 0) {
    const updatedStatuses = getToolStatuses();
    displayToolStatus(updatedStatuses);
  }
}

// Create and configure the command
const setup = new Command('setup')
  .description('Install essential tools required for DevUtils CLI')
  .option('--force', 'Install without prompting')
  .option('--check', 'Check tool status without installing')
  .action(async (options) => {
    if (options.check) {
      const statuses = getToolStatuses();
      displayToolStatus(statuses);
      const missing = statuses.filter(s => !s.installed);
      if (missing.length > 0) {
        console.log(`Run 'dev setup' to install missing tools.\n`);
      }
      return;
    }
    await runSetup(options);
  });

module.exports = setup;
