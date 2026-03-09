#!/usr/bin/env node
'use strict';

/**
 * Installer: node
 *
 * Installs Node.js on all supported platforms.
 * On Unix-like systems, installs via nvm (Node Version Manager).
 * On Windows, installs directly via Chocolatey or winget.
 * See registry.json for platform support and dependencies.
 */

const path = require('path');
const fs = require('fs');
const os = require('os');

/**
 * Returns the nvm directory path.
 * Checks the NVM_DIR environment variable first, falls back to ~/.nvm.
 * @returns {string} The nvm directory path.
 */
function getNvmDir() {
  return process.env.NVM_DIR || path.join(os.homedir(), '.nvm');
}

/**
 * Checks if nvm is installed by looking for the nvm.sh script.
 * nvm is a shell function, not a binary, so `which nvm` won't find it.
 * @returns {boolean} true if nvm is installed.
 */
function isNvmInstalled() {
  const nvmDir = getNvmDir();
  return fs.existsSync(path.join(nvmDir, 'nvm.sh'));
}

/**
 * Installs nvm using the official install script.
 * The script clones the nvm repo (which is why git is a dependency).
 * @param {object} context - The CLI context object
 */
async function installNvm(context) {
  await context.shell.exec(
    'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash'
  );
}

/**
 * Wraps a command so that nvm is sourced in the subshell before it runs.
 * Since nvm is a shell function (not a binary), we need to source it
 * in the same subshell that will call nvm commands.
 * @param {string} command - The nvm command to run (e.g. 'nvm install --lts').
 * @returns {string} A bash command string that sources nvm first.
 */
function buildNvmCommand(command) {
  const nvmDir = getNvmDir();
  return `export NVM_DIR="${nvmDir}" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" && ${command}`;
}

/**
 * Shared Unix install logic: installs nvm (if missing) then Node LTS via nvm.
 * Used by macOS, Ubuntu, Raspbian, and Amazon Linux installers.
 * @param {object} context - The CLI context object
 */
async function installViaUnixNvm(context) {
  if (!isNvmInstalled()) {
    context.output.info('Installing nvm...');
    await installNvm(context);
  }

  context.output.info('Installing Node.js LTS via nvm...');
  await context.shell.exec(buildNvmCommand('nvm install --lts'));
  await context.shell.exec(buildNvmCommand('nvm alias default lts/*'));
}

/**
 * Check if Node.js is already installed.
 * @param {object} context - The CLI context object (has platform, shell, output, etc.)
 * @returns {Promise<boolean>} true if node is available on the system
 */
async function isInstalled(context) {
  return context.shell.commandExists('node');
}

/**
 * Get the installed Node.js version.
 * @param {object} context - The CLI context object
 * @returns {Promise<string|null>} Version string like '20.11.0', or null if unavailable.
 */
async function getVersion(context) {
  try {
    const result = await context.shell.exec('node --version');
    // Output looks like: "v20.11.0"
    const match = result.stdout.trim().match(/v?(\d+\.\d+\.\d+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Install Node.js on macOS via nvm.
 * @param {object} context - The CLI context object
 */
async function install_macos(context) {
  await installViaUnixNvm(context);
}

/**
 * Install Node.js on Ubuntu via nvm.
 * Ensures curl is available first (needed to download the nvm install script).
 * @param {object} context - The CLI context object
 */
async function install_ubuntu(context) {
  if (!context.shell.commandExists('curl')) {
    context.output.info('Installing curl...');
    await context.shell.exec('sudo apt-get update && sudo apt-get install -y curl');
  }
  await installViaUnixNvm(context);
}

/**
 * Install Node.js on Raspberry Pi OS via nvm.
 * Ensures curl is available first.
 * @param {object} context - The CLI context object
 */
async function install_raspbian(context) {
  if (!context.shell.commandExists('curl')) {
    context.output.info('Installing curl...');
    await context.shell.exec('sudo apt-get update && sudo apt-get install -y curl');
  }
  await installViaUnixNvm(context);
}

/**
 * Install Node.js on Amazon Linux via nvm.
 * Ensures curl is available first, using dnf or yum.
 * @param {object} context - The CLI context object
 */
async function install_amazon_linux(context) {
  if (!context.shell.commandExists('curl')) {
    const hasDnf = context.shell.commandExists('dnf');
    if (hasDnf) {
      await context.shell.exec('sudo dnf install -y curl');
    } else {
      await context.shell.exec('sudo yum install -y curl');
    }
  }
  await installViaUnixNvm(context);
}

/**
 * Install Node.js on Windows using Chocolatey or winget.
 * Installs Node directly (not via nvm-windows) for simplicity.
 * @param {object} context - The CLI context object
 */
async function install_windows(context) {
  const hasChoco = context.shell.commandExists('choco');
  const hasWinget = context.shell.commandExists('winget');

  if (hasChoco) {
    await context.shell.exec('choco install nodejs-lts -y');
  } else if (hasWinget) {
    await context.shell.exec(
      'winget install --id OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements'
    );
  } else {
    throw new Error(
      'Neither Chocolatey nor winget is available. Install one of them first, or download Node.js from https://nodejs.org'
    );
  }
}

/**
 * Install Node.js in Git Bash.
 * Git Bash runs on Windows, so Node must be installed on the Windows host.
 * @param {object} context - The CLI context object
 */
async function install_gitbash(context) {
  if (await isInstalled(context)) {
    context.output.info('Node.js is already available in Git Bash.');
    return;
  }

  throw new Error(
    'Node.js must be installed on the Windows host. Download from https://nodejs.org or run the installer from a Windows shell.'
  );
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
  getVersion,
  install_macos,
  install_ubuntu,
  install_raspbian,
  install_amazon_linux,
  install_windows,
  install_gitbash,
};
