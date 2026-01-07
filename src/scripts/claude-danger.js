#!/usr/bin/env node

/**
 * claude-danger - Launch Claude CLI with dangerous mode bypassing permission checks
 *
 * Migrated from legacy dotfiles function.
 * Original:
 *   claude-danger() {
 *       if command -v claude >/dev/null 2>&1; then
 *           echo "Launching Claude CLI in dangerous mode (skipping permission checks)..."
 *           claude --dangerously-skip-permissions "$@"
 *       else
 *           echo "Claude is not currently installed."
 *           echo "Please install Claude CLI to use this function."
 *           return 1
 *       fi
 *   }
 *
 * This script launches the Claude CLI with the --dangerously-skip-permissions flag,
 * which bypasses the normal permission prompts. This is useful for automation
 * scenarios or when you trust the commands being executed.
 *
 * WARNING: Use with caution! This mode skips safety prompts that normally
 * protect you from potentially harmful operations.
 *
 * @module scripts/claude-danger
 */

const os = require('../utils/common/os');
const { execSync, spawn } = require('child_process');

/**
 * Helper function to check if a command exists on the system.
 * Works cross-platform using 'which' on Unix-like systems and 'where' on Windows.
 *
 * @param {string} cmd - The command name to check
 * @returns {boolean} True if the command exists, false otherwise
 */
function isCommandAvailable(cmd) {
  try {
    // Use 'which' on Unix-like systems, 'where' on Windows
    const checkCmd = process.platform === 'win32' ? `where ${cmd}` : `which ${cmd}`;
    execSync(checkCmd, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Pure Node.js implementation that works on any platform.
 *
 * This function checks for the Claude CLI and launches it with the
 * --dangerously-skip-permissions flag. Since the Claude CLI is a cross-platform
 * Node.js application itself, the core logic is identical across all platforms.
 *
 * The only difference is how we check for command availability (which vs where),
 * which is handled by the isCommandAvailable helper.
 *
 * @param {string[]} args - Command line arguments to pass to Claude CLI
 * @returns {Promise<void>}
 */
async function do_claude_danger_nodejs(args) {
  // Check if the claude command is available
  if (!isCommandAvailable('claude')) {
    console.error('Error: Claude CLI is not currently installed.');
    console.error('');
    console.error('To install Claude CLI, visit:');
    console.error('  https://claude.ai/code');
    console.error('');
    console.error('Or install via npm:');
    console.error('  npm install -g @anthropic-ai/claude-code');
    process.exit(1);
  }

  // Inform the user that we are launching in dangerous mode
  console.log('Launching Claude CLI in dangerous mode (skipping permission checks)...');
  console.log('');

  // Build the command arguments
  // The --dangerously-skip-permissions flag comes first, then any user-provided args
  const claudeArgs = ['--dangerously-skip-permissions', ...args];

  // Use spawn instead of execSync to properly inherit stdio and allow interactive use
  // spawn is better here because Claude CLI is an interactive application
  const child = spawn('claude', claudeArgs, {
    stdio: 'inherit',
    shell: true
  });

  // Handle the process exit
  return new Promise((resolve, reject) => {
    child.on('close', (code) => {
      if (code !== 0 && code !== null) {
        process.exit(code);
      }
      resolve();
    });

    child.on('error', (error) => {
      console.error('Error: Failed to launch Claude CLI.');
      console.error(error.message);
      process.exit(1);
    });
  });
}

/**
 * Launch Claude CLI in dangerous mode on macOS.
 *
 * macOS uses the same cross-platform Node.js implementation since the Claude CLI
 * is a Node.js application that works identically across platforms.
 *
 * @param {string[]} args - Command line arguments to pass to Claude CLI
 * @returns {Promise<void>}
 */
async function do_claude_danger_macos(args) {
  return do_claude_danger_nodejs(args);
}

/**
 * Launch Claude CLI in dangerous mode on Ubuntu.
 *
 * Ubuntu uses the same cross-platform Node.js implementation since the Claude CLI
 * is a Node.js application that works identically across platforms.
 *
 * @param {string[]} args - Command line arguments to pass to Claude CLI
 * @returns {Promise<void>}
 */
async function do_claude_danger_ubuntu(args) {
  return do_claude_danger_nodejs(args);
}

/**
 * Launch Claude CLI in dangerous mode on Raspberry Pi OS.
 *
 * Raspberry Pi OS uses the same cross-platform Node.js implementation since the
 * Claude CLI is a Node.js application that works identically across platforms.
 *
 * @param {string[]} args - Command line arguments to pass to Claude CLI
 * @returns {Promise<void>}
 */
async function do_claude_danger_raspbian(args) {
  return do_claude_danger_nodejs(args);
}

/**
 * Launch Claude CLI in dangerous mode on Amazon Linux.
 *
 * Amazon Linux uses the same cross-platform Node.js implementation since the
 * Claude CLI is a Node.js application that works identically across platforms.
 *
 * @param {string[]} args - Command line arguments to pass to Claude CLI
 * @returns {Promise<void>}
 */
async function do_claude_danger_amazon_linux(args) {
  return do_claude_danger_nodejs(args);
}

/**
 * Launch Claude CLI in dangerous mode on Windows Command Prompt.
 *
 * Windows uses the same cross-platform Node.js implementation since the Claude CLI
 * is a Node.js application that works identically across platforms.
 *
 * @param {string[]} args - Command line arguments to pass to Claude CLI
 * @returns {Promise<void>}
 */
async function do_claude_danger_cmd(args) {
  return do_claude_danger_nodejs(args);
}

/**
 * Launch Claude CLI in dangerous mode on Windows PowerShell.
 *
 * Windows PowerShell uses the same cross-platform Node.js implementation since the
 * Claude CLI is a Node.js application that works identically across platforms.
 *
 * @param {string[]} args - Command line arguments to pass to Claude CLI
 * @returns {Promise<void>}
 */
async function do_claude_danger_powershell(args) {
  return do_claude_danger_nodejs(args);
}

/**
 * Launch Claude CLI in dangerous mode in Git Bash.
 *
 * Git Bash uses the same cross-platform Node.js implementation since the Claude CLI
 * is a Node.js application that works identically across platforms.
 *
 * @param {string[]} args - Command line arguments to pass to Claude CLI
 * @returns {Promise<void>}
 */
async function do_claude_danger_gitbash(args) {
  return do_claude_danger_nodejs(args);
}

/**
 * Main entry point - detects environment and executes appropriate implementation.
 *
 * The "claude-danger" command launches the Claude CLI with the
 * --dangerously-skip-permissions flag, which bypasses the normal permission
 * prompts that Claude shows before executing certain operations.
 *
 * This is useful when:
 * - Running Claude in automated/CI environments
 * - You trust the operations being performed
 * - You want faster iteration without confirmation prompts
 *
 * WARNING: Use with caution! The permission prompts exist to protect you
 * from unintended file modifications, command execution, and other
 * potentially harmful operations.
 *
 * @param {string[]} args - Command line arguments to pass to Claude CLI
 * @returns {Promise<void>}
 */
async function do_claude_danger(args) {
  const platform = os.detect();

  const handlers = {
    'macos': do_claude_danger_macos,
    'ubuntu': do_claude_danger_ubuntu,
    'debian': do_claude_danger_ubuntu,
    'raspbian': do_claude_danger_raspbian,
    'amazon_linux': do_claude_danger_amazon_linux,
    'rhel': do_claude_danger_amazon_linux,
    'fedora': do_claude_danger_ubuntu,
    'linux': do_claude_danger_ubuntu,
    'wsl': do_claude_danger_ubuntu,
    'cmd': do_claude_danger_cmd,
    'windows': do_claude_danger_cmd,
    'powershell': do_claude_danger_powershell,
    'gitbash': do_claude_danger_gitbash
  };

  const handler = handlers[platform.type];
  if (!handler) {
    console.error(`Platform '${platform.type}' is not supported for this command.`);
    console.error('');
    console.error('Supported platforms:');
    console.error('  - macOS');
    console.error('  - Ubuntu, Debian, and other Linux distributions');
    console.error('  - Raspberry Pi OS');
    console.error('  - Amazon Linux');
    console.error('  - Windows (CMD, PowerShell, Git Bash)');
    process.exit(1);
  }

  await handler(args);
}

module.exports = {
  main: do_claude_danger,
  do_claude_danger,
  do_claude_danger_nodejs,
  do_claude_danger_macos,
  do_claude_danger_ubuntu,
  do_claude_danger_raspbian,
  do_claude_danger_amazon_linux,
  do_claude_danger_cmd,
  do_claude_danger_powershell,
  do_claude_danger_gitbash
};

if (require.main === module) {
  do_claude_danger(process.argv.slice(2));
}
