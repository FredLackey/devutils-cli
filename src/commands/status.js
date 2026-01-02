#!/usr/bin/env node

/**
 * @fileoverview Status command - Display current configuration and environment health.
 */

const { Command } = require('commander');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CONFIG_FILE = path.join(process.env.HOME || process.env.USERPROFILE, '.devutils');

/**
 * Load existing configuration
 * @returns {object|null}
 */
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const content = fs.readFileSync(CONFIG_FILE, 'utf8');
      return JSON.parse(content);
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Check if current directory is inside a git repository
 * @returns {string|null} Path to git root or null
 */
function getGitRoot() {
  try {
    const result = execSync('git rev-parse --show-toplevel', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    return result.trim();
  } catch {
    return null;
  }
}

/**
 * Get current git branch
 * @returns {string|null}
 */
function getGitBranch() {
  try {
    const result = execSync('git branch --show-current', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    return result.trim();
  } catch {
    return null;
  }
}

/**
 * Get Node.js version
 * @returns {string|null}
 */
function getNodeVersion() {
  try {
    return process.version;
  } catch {
    return null;
  }
}

/**
 * Get npm version
 * @returns {string|null}
 */
function getNpmVersion() {
  try {
    return execSync('npm --version', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim();
  } catch {
    return null;
  }
}

/**
 * Detect operating system
 * @returns {string}
 */
function getOS() {
  switch (process.platform) {
    case 'darwin':
      return 'macOS';
    case 'win32':
      return 'Windows';
    case 'linux':
      return 'Linux';
    default:
      return process.platform;
  }
}

/**
 * Check if a command exists
 * @param {string} cmd - Command to check
 * @returns {boolean}
 */
function commandExists(cmd) {
  try {
    const checkCmd = process.platform === 'win32' ? `where ${cmd}` : `which ${cmd}`;
    execSync(checkCmd, { stdio: ['pipe', 'pipe', 'pipe'] });
    return true;
  } catch {
    return false;
  }
}

/**
 * Display status information
 * @param {object} options - Command options
 */
function runStatus(options) {
  const config = loadConfig();
  const warnings = [];

  console.log('\n=== DevUtils CLI Status ===\n');

  // Configuration Status
  console.log('Configuration:');
  console.log('─'.repeat(40));

  if (config) {
    console.log(`  File:    ${CONFIG_FILE}`);
    console.log('  Status:  Valid');

    if (config.user) {
      console.log(`  User:    ${config.user.name} <${config.user.email}>`);
    }

    if (config.updated) {
      console.log(`  Updated: ${new Date(config.updated).toLocaleString()}`);
    }

    // Check for issues
    if (!config.user?.name || !config.user?.email) {
      warnings.push('User name or email not configured');
    }
  } else {
    console.log(`  File:   ${CONFIG_FILE}`);
    console.log('  Status: Not found');
    warnings.push(`Configuration file not found. Run 'dev configure' to create it.`);
  }

  // Environment
  console.log('\nEnvironment:');
  console.log('─'.repeat(40));
  console.log(`  OS:      ${getOS()}`);
  console.log(`  Node:    ${getNodeVersion() || 'Not found'}`);
  console.log(`  npm:     ${getNpmVersion() || 'Not found'}`);
  console.log(`  CWD:     ${process.cwd()}`);

  // Git Repository
  const gitRoot = getGitRoot();
  console.log('\nGit Repository:');
  console.log('─'.repeat(40));

  if (gitRoot) {
    console.log(`  Root:    ${gitRoot}`);
    console.log(`  Branch:  ${getGitBranch() || 'Unknown'}`);
  } else {
    console.log('  Status:  Not in a git repository');
  }

  // Available Tools
  console.log('\nAvailable Tools:');
  console.log('─'.repeat(40));

  const tools = [
    { name: 'git', label: 'Git' },
    { name: 'docker', label: 'Docker' },
    { name: 'code', label: 'VS Code' },
    { name: 'brew', label: 'Homebrew' },
    { name: 'choco', label: 'Chocolatey' },
    { name: 'winget', label: 'winget' }
  ];

  for (const tool of tools) {
    const exists = commandExists(tool.name);
    const status = exists ? 'Installed' : 'Not found';
    console.log(`  ${tool.label.padEnd(12)} ${status}`);
  }

  // Identities
  if (config?.identities && Object.keys(config.identities).length > 0) {
    console.log('\nIdentities:');
    console.log('─'.repeat(40));
    for (const [name, identity] of Object.entries(config.identities)) {
      console.log(`  ${name}: ${identity.email || identity.name || '(incomplete)'}`);
    }
  }

  // Warnings
  if (warnings.length > 0) {
    console.log('\nWarnings:');
    console.log('─'.repeat(40));
    for (const warning of warnings) {
      console.log(`  ! ${warning}`);
    }
  }

  console.log('');
}

// Create and configure the command
const status = new Command('status')
  .description('Display current configuration and environment health')
  .option('--verbose', 'Show detailed information')
  .action(runStatus);

module.exports = status;
