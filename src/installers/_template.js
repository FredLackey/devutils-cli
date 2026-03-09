#!/usr/bin/env node
'use strict';

/**
 * Installer: <TOOL_NAME>
 *
 * Installs <TOOL_NAME> on supported platforms.
 * See registry.json for platform support and dependencies.
 */

/**
 * Check if <TOOL_NAME> is already installed.
 * @param {object} context - The CLI context object (has platform, shell, output, etc.)
 * @returns {Promise<boolean>} true if the tool is available on the system
 */
async function isInstalled(context) {
  // Use context.shell to check if the binary exists on the PATH.
  // Example: return context.shell.commandExists('<binary-name>');
  return false;
}

/**
 * Install on macOS using Homebrew.
 * @param {object} context - The CLI context object
 */
async function install_macos(context) {
  // Example: await context.shell.exec('brew install <tool>');
  throw new Error('install_macos not implemented');
}

/**
 * Install on Ubuntu using apt.
 * @param {object} context - The CLI context object
 */
async function install_ubuntu(context) {
  throw new Error('install_ubuntu not implemented');
}

/**
 * Install on Raspberry Pi OS using apt.
 * @param {object} context - The CLI context object
 */
async function install_raspbian(context) {
  throw new Error('install_raspbian not implemented');
}

/**
 * Install on Amazon Linux using dnf/yum.
 * @param {object} context - The CLI context object
 */
async function install_amazon_linux(context) {
  throw new Error('install_amazon_linux not implemented');
}

/**
 * Install on Windows using Chocolatey or winget.
 * @param {object} context - The CLI context object
 */
async function install_windows(context) {
  throw new Error('install_windows not implemented');
}

/**
 * Install in Git Bash (manual or portable install).
 * @param {object} context - The CLI context object
 */
async function install_gitbash(context) {
  throw new Error('install_gitbash not implemented');
}

/**
 * Main install dispatcher. Detects the platform and calls the right function.
 * The framework calls this -- you don't need to call it directly.
 * @param {object} context - The CLI context object
 */
async function install(context) {
  const platformType = context.platform.detect().type;
  const installers = {
    'macos': install_macos,
    'ubuntu': install_ubuntu,
    'raspbian': install_raspbian,
    'amazon-linux': install_amazon_linux,
    'windows': install_windows,
    'gitbash': install_gitbash,
  };

  const fn = installers[platformType];
  if (!fn) {
    throw new Error(`No installer for platform: ${platformType}`);
  }

  await fn(context);
}

module.exports = {
  isInstalled,
  install,
  install_macos,
  install_ubuntu,
  install_raspbian,
  install_amazon_linux,
  install_windows,
  install_gitbash,
};
