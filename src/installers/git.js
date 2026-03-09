#!/usr/bin/env node
'use strict';

/**
 * Installer: git
 *
 * Installs git on all supported platforms.
 * See registry.json for platform support and dependencies.
 */

/**
 * Check if git is already installed.
 * @param {object} context - The CLI context object (has platform, shell, output, etc.)
 * @returns {Promise<boolean>} true if git is available on the system
 */
async function isInstalled(context) {
  return context.shell.commandExists('git');
}

/**
 * Get the installed git version.
 * @param {object} context - The CLI context object
 * @returns {Promise<string|null>} Version string like '2.43.0', or null if unavailable.
 */
async function getVersion(context) {
  try {
    const result = await context.shell.exec('git --version');
    // Output looks like: "git version 2.43.0" or "git version 2.43.0.windows.1"
    const match = result.stdout.trim().match(/(\d+\.\d+\.\d+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Install git on macOS using Homebrew.
 * @param {object} context - The CLI context object
 */
async function install_macos(context) {
  if (!context.shell.commandExists('brew')) {
    throw new Error(
      'Homebrew is not installed. Run "dev tools install homebrew" first, or install git manually.'
    );
  }
  await context.shell.exec('brew install git');
}

/**
 * Install git on Ubuntu using apt.
 * @param {object} context - The CLI context object
 */
async function install_ubuntu(context) {
  await context.shell.exec('sudo apt-get update');
  await context.shell.exec('sudo apt-get install -y git');
}

/**
 * Install git on Raspberry Pi OS using apt.
 * @param {object} context - The CLI context object
 */
async function install_raspbian(context) {
  await context.shell.exec('sudo apt-get update');
  await context.shell.exec('sudo apt-get install -y git');
}

/**
 * Install git on Amazon Linux using dnf or yum.
 * @param {object} context - The CLI context object
 */
async function install_amazon_linux(context) {
  const hasDnf = context.shell.commandExists('dnf');
  if (hasDnf) {
    await context.shell.exec('sudo dnf install -y git');
  } else {
    await context.shell.exec('sudo yum install -y git');
  }
}

/**
 * Install git on Windows using Chocolatey or winget.
 * @param {object} context - The CLI context object
 */
async function install_windows(context) {
  const hasChoco = context.shell.commandExists('choco');
  const hasWinget = context.shell.commandExists('winget');

  if (hasChoco) {
    await context.shell.exec('choco install git -y');
  } else if (hasWinget) {
    await context.shell.exec(
      'winget install --id Git.Git --accept-package-agreements --accept-source-agreements'
    );
  } else {
    throw new Error(
      'Neither Chocolatey nor winget is available. Install one of them first, or download git from https://git-scm.com'
    );
  }
}

/**
 * Install git in Git Bash. Git Bash ships with git, so this is a no-op.
 * @param {object} context - The CLI context object
 */
async function install_gitbash(context) {
  if (await isInstalled(context)) {
    context.output.info('Git is already available in Git Bash.');
    return;
  }
  // This shouldn't happen -- Git Bash IS git. But just in case:
  throw new Error(
    'Git not found in Git Bash environment. This is unexpected. Reinstall Git for Windows from https://git-scm.com'
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
