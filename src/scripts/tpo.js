#!/usr/bin/env node

/**
 * tpo - Terraform Plan with Output file
 *
 * Migrated from legacy dotfiles alias.
 * Original: alias tpo="terraform plan -out=\"tfplan\""
 *
 * This script runs `terraform plan` and saves the execution plan to a file
 * named "tfplan" in the current directory. This plan file can then be applied
 * using `terraform apply "tfplan"` (or the companion `tpa` script) to ensure
 * the exact changes shown in the plan are applied.
 *
 * Why use a plan file?
 * - Guarantees what you reviewed is exactly what gets applied
 * - Prevents surprises from infrastructure changes between plan and apply
 * - Required for automation and CI/CD pipelines
 * - Allows plan review before committing to changes
 *
 * Usage:
 *   tpo                    # Run terraform plan, save to "tfplan"
 *   tpo -var="key=value"   # Pass additional arguments to terraform plan
 *   tpo -target=resource   # Plan only specific resources
 *
 * @module scripts/tpo
 */

const os = require('../utils/common/os');
const { execSync, spawnSync } = require('child_process');

/**
 * Helper function to check if a command exists on the system.
 * Uses platform-appropriate method to locate the command.
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
 * Core implementation that runs terraform plan with output file.
 *
 * This function contains the shared logic for all platforms since Terraform
 * is a cross-platform CLI tool that works identically on macOS, Linux, and Windows.
 * The command syntax is the same across all environments.
 *
 * @param {string[]} args - Additional arguments to pass to terraform plan
 * @returns {Promise<void>}
 */
async function do_tpo_nodejs(args) {
  // Terraform is a third-party tool that must be installed separately.
  // Check that it exists before attempting to run it.
  if (!isCommandAvailable('terraform')) {
    console.error('Error: terraform is required but not installed.');
    console.error('');
    console.error('Install Terraform:');
    console.error('  macOS:   brew install terraform');
    console.error('  Ubuntu:  sudo apt install terraform');
    console.error('           or: sudo snap install terraform');
    console.error('  Windows: choco install terraform');
    console.error('           or: winget install Hashicorp.Terraform');
    console.error('');
    console.error('For official installation instructions, visit:');
    console.error('  https://developer.hashicorp.com/terraform/downloads');
    process.exit(1);
  }

  // Build the command arguments array:
  // - "plan" is the terraform subcommand
  // - "-out=tfplan" saves the plan to a file named "tfplan"
  // - ...args passes through any additional user-provided arguments
  //   (like -var, -target, -var-file, etc.)
  const terraformArgs = ['plan', '-out=tfplan', ...args];

  // Use spawnSync instead of execSync for better argument handling.
  // spawnSync properly handles arguments with spaces, quotes, and special characters
  // without needing shell escaping.
  const result = spawnSync('terraform', terraformArgs, {
    // Inherit stdio so the user sees terraform's colored output and can interact
    // with any prompts (though plan typically doesn't prompt)
    stdio: 'inherit',
    // Use the current working directory where the terraform configuration lives
    cwd: process.cwd()
  });

  // If terraform exited with an error code, exit with the same code.
  // This preserves terraform's exit behavior for scripts that check exit codes.
  if (result.status !== 0) {
    // If there was a signal (like SIGINT from Ctrl+C), handle that too
    if (result.signal) {
      console.error(`\nTerraform was terminated by signal: ${result.signal}`);
      process.exit(1);
    }
    // Exit with terraform's exit code
    process.exit(result.status || 1);
  }

  // Success message - terraform already prints its own output, but we add
  // a helpful reminder about the next step
  console.log('');
  console.log('Plan saved to "tfplan". To apply this plan, run:');
  console.log('  terraform apply "tfplan"');
  console.log('  or: tpa');
}

/**
 * Run terraform plan on macOS.
 *
 * Terraform works identically on macOS as other platforms, so this
 * delegates to the shared Node.js implementation.
 *
 * @param {string[]} args - Additional arguments to pass to terraform plan
 * @returns {Promise<void>}
 */
async function do_tpo_macos(args) {
  return do_tpo_nodejs(args);
}

/**
 * Run terraform plan on Ubuntu.
 *
 * Terraform works identically on Ubuntu as other platforms, so this
 * delegates to the shared Node.js implementation.
 *
 * @param {string[]} args - Additional arguments to pass to terraform plan
 * @returns {Promise<void>}
 */
async function do_tpo_ubuntu(args) {
  return do_tpo_nodejs(args);
}

/**
 * Run terraform plan on Raspberry Pi OS.
 *
 * Terraform works identically on Raspberry Pi OS as other platforms, so this
 * delegates to the shared Node.js implementation.
 *
 * Note: Terraform for ARM (aarch64) is available and works on Raspberry Pi 4
 * and newer models with 64-bit Raspberry Pi OS.
 *
 * @param {string[]} args - Additional arguments to pass to terraform plan
 * @returns {Promise<void>}
 */
async function do_tpo_raspbian(args) {
  return do_tpo_nodejs(args);
}

/**
 * Run terraform plan on Amazon Linux.
 *
 * Terraform works identically on Amazon Linux as other platforms, so this
 * delegates to the shared Node.js implementation. This is particularly
 * common since Terraform is often used to manage AWS infrastructure
 * from EC2 instances.
 *
 * @param {string[]} args - Additional arguments to pass to terraform plan
 * @returns {Promise<void>}
 */
async function do_tpo_amazon_linux(args) {
  return do_tpo_nodejs(args);
}

/**
 * Run terraform plan on Windows Command Prompt.
 *
 * Terraform works identically on Windows as other platforms, so this
 * delegates to the shared Node.js implementation.
 *
 * @param {string[]} args - Additional arguments to pass to terraform plan
 * @returns {Promise<void>}
 */
async function do_tpo_cmd(args) {
  return do_tpo_nodejs(args);
}

/**
 * Run terraform plan on Windows PowerShell.
 *
 * Terraform works identically on Windows as other platforms, so this
 * delegates to the shared Node.js implementation.
 *
 * @param {string[]} args - Additional arguments to pass to terraform plan
 * @returns {Promise<void>}
 */
async function do_tpo_powershell(args) {
  return do_tpo_nodejs(args);
}

/**
 * Run terraform plan from Git Bash on Windows.
 *
 * Terraform works identically in Git Bash as other environments, so this
 * delegates to the shared Node.js implementation.
 *
 * @param {string[]} args - Additional arguments to pass to terraform plan
 * @returns {Promise<void>}
 */
async function do_tpo_gitbash(args) {
  return do_tpo_nodejs(args);
}

/**
 * Main entry point - detects environment and executes appropriate implementation.
 *
 * The "tpo" (Terraform Plan with Output) command is a convenience wrapper around
 * `terraform plan -out="tfplan"`. It saves the execution plan to a file so that
 * the exact changes can be reviewed and then applied with confidence.
 *
 * This is a best practice for Terraform workflows:
 * 1. Run `tpo` to create a plan and review the changes
 * 2. Run `tpa` (or `terraform apply "tfplan"`) to apply exactly those changes
 *
 * All additional arguments are passed through to terraform plan, so you can use:
 * - tpo -var="instance_type=t3.micro"
 * - tpo -target=aws_instance.web
 * - tpo -var-file=production.tfvars
 *
 * @param {string[]} args - Command line arguments to pass to terraform plan
 * @returns {Promise<void>}
 */
async function do_tpo(args) {
  const platform = os.detect();

  const handlers = {
    'macos': do_tpo_macos,
    'ubuntu': do_tpo_ubuntu,
    'debian': do_tpo_ubuntu,
    'raspbian': do_tpo_raspbian,
    'amazon_linux': do_tpo_amazon_linux,
    'rhel': do_tpo_amazon_linux,
    'fedora': do_tpo_ubuntu,
    'linux': do_tpo_ubuntu,
    'wsl': do_tpo_ubuntu,
    'cmd': do_tpo_cmd,
    'windows': do_tpo_cmd,
    'powershell': do_tpo_powershell,
    'gitbash': do_tpo_gitbash
  };

  const handler = handlers[platform.type];
  if (!handler) {
    console.error(`Platform '${platform.type}' is not supported for this command.`);
    console.error('');
    console.error('Supported platforms:');
    console.error('  - macOS');
    console.error('  - Ubuntu, Debian, and other Linux distributions');
    console.error('  - Raspberry Pi OS');
    console.error('  - Amazon Linux, RHEL, Fedora');
    console.error('  - Windows (CMD, PowerShell, Git Bash)');
    process.exit(1);
  }

  await handler(args);
}

module.exports = {
  main: do_tpo,
  do_tpo,
  do_tpo_nodejs,
  do_tpo_macos,
  do_tpo_ubuntu,
  do_tpo_raspbian,
  do_tpo_amazon_linux,
  do_tpo_cmd,
  do_tpo_powershell,
  do_tpo_gitbash
};

if (require.main === module) {
  do_tpo(process.argv.slice(2));
}
