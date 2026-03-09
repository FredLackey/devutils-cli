#!/usr/bin/env node
'use strict';

/**
 * Installer: homebrew
 *
 * Installs Homebrew on macOS. This is a macOS-only installer.
 * All other platforms get a clear error explaining what package manager to use instead.
 * See registry.json for platform support and dependencies.
 */

const path = require('path');
const os = require('os');
const fs = require('fs');

/**
 * Returns the path to the user's shell profile file.
 * Checks the SHELL environment variable to pick between .zshrc and .bashrc.
 * @returns {string} Absolute path to the shell profile.
 */
function getShellProfile() {
  const shell = process.env.SHELL || '';
  if (shell.includes('zsh')) {
    return path.join(os.homedir(), '.zshrc');
  }
  return path.join(os.homedir(), '.bashrc');
}

/**
 * Check if Homebrew is already installed.
 * @param {object} context - The CLI context object (has platform, shell, output, etc.)
 * @returns {Promise<boolean>} true if brew is available on the system
 */
async function isInstalled(context) {
  return context.shell.commandExists('brew');
}

/**
 * Get the installed Homebrew version.
 * @param {object} context - The CLI context object
 * @returns {Promise<string|null>} Version string like '4.2.5', or null if unavailable.
 */
async function getVersion(context) {
  try {
    const result = await context.shell.exec('brew --version');
    // Output looks like: "Homebrew 4.2.5"
    const match = result.stdout.trim().match(/Homebrew\s+(\d+\.\d+\.\d+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Install Homebrew on macOS.
 * Uses the official install script with NONINTERACTIVE=1 to avoid prompts.
 * Handles Apple Silicon PATH setup automatically.
 * @param {object} context - The CLI context object
 */
async function install_macos(context) {
  context.output.info('Installing Homebrew...');
  context.output.info('This may prompt for your password and take a few minutes.');

  // The official Homebrew install script.
  // NONINTERACTIVE=1 suppresses the "Press RETURN to continue" prompt.
  await context.shell.exec(
    'NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'
  );

  // On Apple Silicon Macs, brew installs to /opt/homebrew and the install script
  // tells the user to add it to their PATH. We do that here if needed.
  const platform = context.platform.detect();
  if (platform.arch === 'arm64') {
    if (!context.shell.commandExists('brew')) {
      context.output.info('Adding Homebrew to PATH for Apple Silicon...');
      const profilePath = getShellProfile();
      const brewInitLine = 'eval "$(/opt/homebrew/bin/brew shellenv)"';

      const existing = fs.existsSync(profilePath) ? fs.readFileSync(profilePath, 'utf8') : '';
      if (!existing.includes(brewInitLine)) {
        fs.appendFileSync(profilePath, `\n# Homebrew\n${brewInitLine}\n`);
        context.output.info(`Added Homebrew PATH to ${profilePath}`);
      }
    }
  }

  // Verify it worked
  if (!context.shell.commandExists('brew')) {
    // Try the known paths directly
    if (fs.existsSync('/opt/homebrew/bin/brew') || fs.existsSync('/usr/local/bin/brew')) {
      context.output.info(
        'Homebrew installed, but "brew" is not on your PATH yet. Open a new terminal or run: eval "$(/opt/homebrew/bin/brew shellenv)"'
      );
      return;
    }
    throw new Error('Homebrew installation failed. Check the output above for errors.');
  }

  context.output.info('Homebrew installed successfully.');
}

/**
 * Install on Ubuntu -- not supported. Throws a helpful error.
 * @param {object} context - The CLI context object
 */
async function install_ubuntu(context) {
  throw new Error(
    'Homebrew is only available on macOS. On Ubuntu, packages are managed with apt. ' +
    'DevUtils uses apt automatically for Ubuntu installations.'
  );
}

/**
 * Install on Raspberry Pi OS -- not supported. Throws a helpful error.
 * @param {object} context - The CLI context object
 */
async function install_raspbian(context) {
  throw new Error(
    'Homebrew is only available on macOS. On Raspberry Pi OS, packages are managed with apt. ' +
    'DevUtils uses apt automatically for Raspberry Pi installations.'
  );
}

/**
 * Install on Amazon Linux -- not supported. Throws a helpful error.
 * @param {object} context - The CLI context object
 */
async function install_amazon_linux(context) {
  throw new Error(
    'Homebrew is only available on macOS. On Amazon Linux, packages are managed with dnf/yum. ' +
    'DevUtils uses dnf/yum automatically for Amazon Linux installations.'
  );
}

/**
 * Install on Windows -- not supported. Throws a helpful error.
 * @param {object} context - The CLI context object
 */
async function install_windows(context) {
  throw new Error(
    'Homebrew is only available on macOS. On Windows, packages are managed with Chocolatey or winget. ' +
    'DevUtils uses those automatically for Windows installations.'
  );
}

/**
 * Install in Git Bash -- not supported. Throws a helpful error.
 * @param {object} context - The CLI context object
 */
async function install_gitbash(context) {
  throw new Error(
    'Homebrew is only available on macOS. In Git Bash, use the Windows package managers (Chocolatey or winget) instead.'
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
