#!/usr/bin/env node

/**
 * p - Navigate to the projects directory
 *
 * Migrated from legacy dotfiles alias.
 * Original: alias p="cd ~/projects"
 *
 * This script outputs the path to the user's projects folder, which can be used
 * with shell integration (e.g., `cd $(p)`). The projects folder location varies
 * by operating system:
 * - macOS: ~/projects
 * - Linux: ~/projects
 * - Windows: %USERPROFILE%\projects
 *
 * Note: Since Node.js scripts run in a subprocess, they cannot directly change
 * the parent shell's working directory. Instead, this script outputs the path
 * so the shell can use it: `cd $(p)`
 *
 * @module scripts/p
 */

const os = require('../utils/common/os');
const path = require('path');
const fs = require('fs');

/**
 * Pure Node.js implementation that works on any platform.
 *
 * This function determines the projects folder path using Node.js APIs.
 * The projects folder is expected to be in the user's home directory.
 * We check for the folder's existence and provide helpful feedback if
 * it doesn't exist.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_p_nodejs(args) {
  // Get the user's home directory using Node.js built-in os module
  const homeDir = os.getHomeDir();

  // Construct the path to the projects folder
  // By convention, developer projects are stored in ~/projects
  const projectsPath = path.join(homeDir, 'projects');

  // Check if the projects folder exists
  if (!fs.existsSync(projectsPath)) {
    // The projects folder doesn't exist - offer to explain how to create it
    console.error(`Error: Projects folder not found at ${projectsPath}`);
    console.error('');
    console.error('This folder is typically used to store your development projects.');
    console.error('');
    console.error(`You can create it with: mkdir -p "${projectsPath}"`);
    console.error('');
    console.error('Alternatively, you could use a different folder name like:');
    console.error(`  mkdir -p "${path.join(homeDir, 'Projects')}"`);
    console.error(`  mkdir -p "${path.join(homeDir, 'src')}"`);
    console.error(`  mkdir -p "${path.join(homeDir, 'code')}"`);
    process.exit(1);
  }

  // Output the path so it can be used with shell integration
  // Example usage: cd $(p)
  console.log(projectsPath);
}

/**
 * Navigate to the projects folder on macOS.
 *
 * On macOS, the projects folder is conventionally at ~/projects.
 * This function delegates to the pure Node.js implementation since
 * the logic is identical across platforms.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_p_macos(args) {
  return do_p_nodejs(args);
}

/**
 * Navigate to the projects folder on Ubuntu.
 *
 * On Ubuntu and other Linux distributions, the projects folder is
 * typically at ~/projects (following common developer conventions).
 * This function delegates to the pure Node.js implementation.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_p_ubuntu(args) {
  return do_p_nodejs(args);
}

/**
 * Navigate to the projects folder on Raspberry Pi OS.
 *
 * Raspberry Pi OS follows the same convention as other Linux distributions.
 * The projects folder is at ~/projects.
 * This function delegates to the pure Node.js implementation.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_p_raspbian(args) {
  return do_p_nodejs(args);
}

/**
 * Navigate to the projects folder on Amazon Linux.
 *
 * On Amazon Linux (commonly used in AWS environments), a projects folder
 * at ~/projects can be used for storing source code. This function
 * delegates to the pure Node.js implementation.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_p_amazon_linux(args) {
  return do_p_nodejs(args);
}

/**
 * Navigate to the projects folder on Windows Command Prompt.
 *
 * On Windows, the projects folder is at %USERPROFILE%\projects.
 * Node.js's os.homedir() correctly returns the USERPROFILE path on Windows,
 * so the pure Node.js implementation works correctly.
 * This function delegates to the pure Node.js implementation.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_p_cmd(args) {
  return do_p_nodejs(args);
}

/**
 * Navigate to the projects folder on Windows PowerShell.
 *
 * On Windows, the projects folder is at %USERPROFILE%\projects.
 * This function delegates to the pure Node.js implementation.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_p_powershell(args) {
  return do_p_nodejs(args);
}

/**
 * Navigate to the projects folder on Git Bash (Windows).
 *
 * Git Bash runs on Windows, so the projects folder is at %USERPROFILE%\projects.
 * This function delegates to the pure Node.js implementation.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_p_gitbash(args) {
  return do_p_nodejs(args);
}

/**
 * Main entry point - detects environment and executes appropriate implementation.
 *
 * The "p" command outputs the path to the user's projects folder.
 * This is designed to be used with shell integration:
 *
 *   cd $(p)        # Change to projects folder
 *   ls $(p)        # List projects
 *   code $(p)      # Open projects folder in VS Code
 *
 * The original alias "cd ~/projects" directly changed directories, but since
 * Node.js scripts run in a subprocess, they cannot change the parent shell's
 * working directory. Instead, this script outputs the path for the shell to use.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_p(args) {
  const platform = os.detect();

  const handlers = {
    'macos': do_p_macos,
    'ubuntu': do_p_ubuntu,
    'debian': do_p_ubuntu,
    'raspbian': do_p_raspbian,
    'amazon_linux': do_p_amazon_linux,
    'rhel': do_p_amazon_linux,
    'fedora': do_p_ubuntu,
    'linux': do_p_ubuntu,
    'wsl': do_p_ubuntu,
    'cmd': do_p_cmd,
    'windows': do_p_cmd,
    'powershell': do_p_powershell,
    'gitbash': do_p_gitbash
  };

  const handler = handlers[platform.type];
  if (!handler) {
    console.error(`Platform '${platform.type}' is not supported for this command.`);
    process.exit(1);
  }

  await handler(args);
}

module.exports = {
  main: do_p,
  do_p,
  do_p_nodejs,
  do_p_macos,
  do_p_ubuntu,
  do_p_raspbian,
  do_p_amazon_linux,
  do_p_cmd,
  do_p_powershell,
  do_p_gitbash
};

if (require.main === module) {
  do_p(process.argv.slice(2));
}
