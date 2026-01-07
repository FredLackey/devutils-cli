#!/usr/bin/env node

/**
 * y - Shortcut for yarn commands
 *
 * Migrated from legacy dotfiles alias.
 * Original: alias y="yarn"
 *
 * This script provides a single-character shortcut for the Yarn package manager,
 * passing all arguments through to the `yarn` command. Yarn is a popular
 * JavaScript package manager that is an alternative to npm.
 *
 * Examples:
 *   y                  -> yarn (runs default yarn command, typically install)
 *   y add lodash       -> yarn add lodash
 *   y remove lodash    -> yarn remove lodash
 *   y dev              -> yarn dev (runs the "dev" script)
 *   y build            -> yarn build (runs the "build" script)
 *   y --version        -> yarn --version
 *
 * @module scripts/y
 */

const os = require('../utils/common/os');
const { spawn } = require('child_process');
const { commandExists } = require('../utils/common/shell');

/**
 * Pure Node.js implementation that works on any platform.
 *
 * This function spawns the `yarn` command with all provided arguments.
 * It uses spawn with stdio: 'inherit' to:
 * 1. Pass through all arguments exactly as provided
 * 2. Preserve colored output from yarn
 * 3. Allow interactive prompts if yarn needs user input
 * 4. Properly forward stdin, stdout, and stderr
 *
 * The exit code from yarn is preserved and passed to the parent process,
 * ensuring that CI/CD pipelines and scripts can detect yarn failures.
 *
 * @param {string[]} args - Command line arguments to pass to yarn
 * @returns {Promise<void>}
 */
async function do_y_nodejs(args) {
  // First, check if yarn is installed
  if (!commandExists('yarn')) {
    console.error('Error: yarn is not installed or not in PATH.');
    console.error('');
    console.error('To install yarn, you can use one of the following methods:');
    console.error('');
    console.error('  Using npm (recommended if you have Node.js):');
    console.error('    npm install -g yarn');
    console.error('');
    console.error('  Using Corepack (Node.js 16.10+):');
    console.error('    corepack enable');
    console.error('');
    console.error('  Using Homebrew (macOS):');
    console.error('    brew install yarn');
    console.error('');
    console.error('  Using apt (Ubuntu/Debian):');
    console.error('    sudo apt install yarn');
    console.error('');
    console.error('For more information, visit: https://yarnpkg.com/getting-started/install');
    process.exit(1);
  }

  // Spawn yarn with all arguments, inheriting stdio for full interactivity
  // This preserves:
  // - Colored output (yarn uses colors extensively)
  // - Interactive prompts (e.g., yarn init questions)
  // - Progress indicators and spinners
  // - Proper terminal width detection
  return new Promise((resolve, reject) => {
    const child = spawn('yarn', args, {
      stdio: 'inherit',  // Pass through stdin, stdout, stderr
      shell: false       // Run yarn directly, not through a shell (more efficient)
    });

    child.on('close', (code) => {
      // Preserve yarn's exit code so CI/CD can detect failures
      // Exit code 0 = success, non-zero = failure
      if (code !== 0) {
        process.exit(code);
      }
      resolve();
    });

    child.on('error', (err) => {
      // This typically happens if yarn is not found (though we check above)
      // or if there's a permission issue
      console.error(`Error executing yarn: ${err.message}`);
      process.exit(1);
    });
  });
}

/**
 * Execute yarn on macOS.
 *
 * Uses the pure Node.js implementation since yarn behaves identically
 * on all platforms - it's a cross-platform tool by design.
 *
 * On macOS, yarn is typically installed via:
 * - npm install -g yarn
 * - brew install yarn
 * - Corepack (corepack enable)
 *
 * @param {string[]} args - Command line arguments to pass to yarn
 * @returns {Promise<void>}
 */
async function do_y_macos(args) {
  return do_y_nodejs(args);
}

/**
 * Execute yarn on Ubuntu.
 *
 * Uses the pure Node.js implementation since yarn behaves identically
 * on all platforms - it's a cross-platform tool by design.
 *
 * On Ubuntu, yarn is typically installed via:
 * - npm install -g yarn
 * - sudo apt install yarn (from official yarn repository)
 * - Corepack (corepack enable)
 *
 * @param {string[]} args - Command line arguments to pass to yarn
 * @returns {Promise<void>}
 */
async function do_y_ubuntu(args) {
  return do_y_nodejs(args);
}

/**
 * Execute yarn on Raspberry Pi OS.
 *
 * Uses the pure Node.js implementation since yarn behaves identically
 * on all platforms - it's a cross-platform tool by design.
 *
 * On Raspberry Pi OS, yarn is typically installed via:
 * - npm install -g yarn
 * - Corepack (corepack enable)
 *
 * @param {string[]} args - Command line arguments to pass to yarn
 * @returns {Promise<void>}
 */
async function do_y_raspbian(args) {
  return do_y_nodejs(args);
}

/**
 * Execute yarn on Amazon Linux.
 *
 * Uses the pure Node.js implementation since yarn behaves identically
 * on all platforms - it's a cross-platform tool by design.
 *
 * On Amazon Linux, yarn is typically installed via:
 * - npm install -g yarn
 * - Corepack (corepack enable)
 *
 * @param {string[]} args - Command line arguments to pass to yarn
 * @returns {Promise<void>}
 */
async function do_y_amazon_linux(args) {
  return do_y_nodejs(args);
}

/**
 * Execute yarn in Windows Command Prompt.
 *
 * Uses the pure Node.js implementation since yarn behaves identically
 * on all platforms - it's a cross-platform tool by design.
 *
 * On Windows, yarn is typically installed via:
 * - npm install -g yarn
 * - choco install yarn (Chocolatey)
 * - winget install Yarn.Yarn
 * - Corepack (corepack enable)
 *
 * Note: On Windows, yarn is typically installed as yarn.cmd or yarn.ps1,
 * but spawn will find it correctly through the PATH.
 *
 * @param {string[]} args - Command line arguments to pass to yarn
 * @returns {Promise<void>}
 */
async function do_y_cmd(args) {
  return do_y_nodejs(args);
}

/**
 * Execute yarn in Windows PowerShell.
 *
 * Uses the pure Node.js implementation since yarn behaves identically
 * on all platforms - it's a cross-platform tool by design.
 *
 * @param {string[]} args - Command line arguments to pass to yarn
 * @returns {Promise<void>}
 */
async function do_y_powershell(args) {
  return do_y_nodejs(args);
}

/**
 * Execute yarn in Git Bash on Windows.
 *
 * Uses the pure Node.js implementation since yarn behaves identically
 * on all platforms - it's a cross-platform tool by design.
 *
 * Git Bash can access Windows-installed yarn through the PATH.
 *
 * @param {string[]} args - Command line arguments to pass to yarn
 * @returns {Promise<void>}
 */
async function do_y_gitbash(args) {
  return do_y_nodejs(args);
}

/**
 * Main entry point - detects environment and executes appropriate implementation.
 *
 * The "y" command is a shortcut for yarn, the JavaScript package manager.
 * All arguments are passed through to yarn unchanged.
 *
 * This script is idempotent by nature - running yarn commands multiple times
 * will produce consistent results (yarn itself handles idempotency for
 * operations like install).
 *
 * Common usage patterns:
 *   y                  - Install dependencies (equivalent to yarn install)
 *   y add <package>    - Add a new dependency
 *   y remove <package> - Remove a dependency
 *   y <script>         - Run a script from package.json
 *   y upgrade          - Upgrade dependencies
 *   y --help           - Show yarn help
 *
 * @param {string[]} args - Command line arguments to pass to yarn
 * @returns {Promise<void>}
 */
async function do_y(args) {
  const platform = os.detect();

  const handlers = {
    'macos': do_y_macos,
    'ubuntu': do_y_ubuntu,
    'debian': do_y_ubuntu,
    'raspbian': do_y_raspbian,
    'amazon_linux': do_y_amazon_linux,
    'rhel': do_y_amazon_linux,
    'fedora': do_y_ubuntu,
    'linux': do_y_ubuntu,
    'wsl': do_y_ubuntu,
    'cmd': do_y_cmd,
    'windows': do_y_cmd,
    'powershell': do_y_powershell,
    'gitbash': do_y_gitbash
  };

  const handler = handlers[platform.type];
  if (!handler) {
    // Yarn is cross-platform, so try the Node.js implementation anyway
    console.error(`Note: Platform '${platform.type}' not explicitly supported, attempting to run yarn...`);
    await do_y_nodejs(args);
    return;
  }

  await handler(args);
}

module.exports = {
  main: do_y,
  do_y,
  do_y_nodejs,
  do_y_macos,
  do_y_ubuntu,
  do_y_raspbian,
  do_y_amazon_linux,
  do_y_cmd,
  do_y_powershell,
  do_y_gitbash
};

if (require.main === module) {
  do_y(process.argv.slice(2));
}
