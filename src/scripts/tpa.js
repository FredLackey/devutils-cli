#!/usr/bin/env node

/**
 * tpa - Terraform Apply from Plan
 *
 * Migrated from legacy dotfiles alias.
 * Original: alias tpa="terraform apply \"tfplan\""
 *
 * This script executes `terraform apply` using a previously saved plan file
 * named "tfplan" (typically created by the `tpo` command). The plan file
 * contains the exact changes that Terraform will make to your infrastructure,
 * ensuring that the apply matches what you reviewed during the plan phase.
 *
 * Usage:
 *   tpa                    # Apply the "tfplan" file in the current directory
 *   tpa -auto-approve      # Apply without confirmation prompt
 *   tpa -parallelism=10    # Apply with custom parallelism
 *
 * Prerequisites:
 *   - Terraform must be installed and available in PATH
 *   - A valid "tfplan" file must exist in the current directory
 *     (create one with: terraform plan -out="tfplan" or use the `tpo` command)
 *
 * @module scripts/tpa
 */

const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('../utils/common/os');

/**
 * Check if a command is available on the system.
 *
 * This function determines whether a given command exists in the system's PATH.
 * It uses 'which' on Unix-like systems and 'where' on Windows.
 *
 * @param {string} cmd - The command name to check for
 * @returns {boolean} True if the command is available, false otherwise
 */
function isCommandAvailable(cmd) {
  try {
    // Use 'which' on Unix-like systems (macOS, Linux), 'where' on Windows
    const checkCmd = process.platform === 'win32' ? `where ${cmd}` : `which ${cmd}`;
    execSync(checkCmd, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Pure Node.js implementation for applying a Terraform plan.
 *
 * Terraform is a cross-platform tool that works identically on all operating systems.
 * This function contains the core logic that all platform-specific functions delegate to:
 * 1. Verify that terraform is installed
 * 2. Verify that the tfplan file exists
 * 3. Execute terraform apply with the plan file
 * 4. Pass through any additional arguments from the user
 *
 * @param {string[]} args - Additional arguments to pass to terraform apply
 * @returns {Promise<void>}
 */
async function do_tpa_nodejs(args) {
  // Step 1: Check if terraform is installed
  // This prevents confusing error messages if terraform is not in PATH
  if (!isCommandAvailable('terraform')) {
    console.error('Error: terraform is not installed or not in PATH.');
    console.error('');
    console.error('Install Terraform from: https://developer.hashicorp.com/terraform/downloads');
    console.error('');
    console.error('Or use your package manager:');
    console.error('  macOS:   brew install terraform');
    console.error('  Ubuntu:  sudo apt install terraform');
    console.error('  Windows: choco install terraform');
    process.exit(1);
  }

  // Step 2: Check if the tfplan file exists in the current directory
  // The plan file must exist for terraform apply to work
  const planFile = 'tfplan';
  const planFilePath = path.join(process.cwd(), planFile);

  if (!fs.existsSync(planFilePath)) {
    console.error(`Error: Plan file "${planFile}" not found in current directory.`);
    console.error('');
    console.error('Create a plan file first using one of these commands:');
    console.error('  tpo                           # Uses the tpo alias');
    console.error('  terraform plan -out="tfplan"  # Direct terraform command');
    console.error('');
    console.error(`Current directory: ${process.cwd()}`);
    process.exit(1);
  }

  // Step 3: Build the terraform apply command
  // The command is: terraform apply "tfplan" [additional-args]
  // We use the plan file as the first argument, then append any user-provided args
  const terraformArgs = ['apply', planFile, ...args];

  // Step 4: Execute terraform apply
  // We use spawnSync instead of execSync because:
  // - It properly handles interactive output (colors, prompts)
  // - It allows the user to respond to the "Do you want to apply?" prompt
  // - It preserves the exit code from terraform
  console.log(`Applying Terraform plan from "${planFile}"...`);
  console.log('');

  const result = spawnSync('terraform', terraformArgs, {
    stdio: 'inherit',  // Connect stdin/stdout/stderr directly to the terminal
    cwd: process.cwd() // Run in the current working directory
  });

  // Propagate terraform's exit code
  // This ensures that CI/CD pipelines and scripts can detect failures
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

/**
 * Apply Terraform plan on macOS.
 *
 * Terraform behaves identically on macOS, so this delegates to the pure Node.js
 * implementation. Terraform is typically installed via Homebrew on macOS.
 *
 * @param {string[]} args - Additional arguments to pass to terraform apply
 * @returns {Promise<void>}
 */
async function do_tpa_macos(args) {
  return do_tpa_nodejs(args);
}

/**
 * Apply Terraform plan on Ubuntu.
 *
 * Terraform behaves identically on Ubuntu, so this delegates to the pure Node.js
 * implementation. Terraform can be installed via apt or by downloading the binary.
 *
 * @param {string[]} args - Additional arguments to pass to terraform apply
 * @returns {Promise<void>}
 */
async function do_tpa_ubuntu(args) {
  return do_tpa_nodejs(args);
}

/**
 * Apply Terraform plan on Raspberry Pi OS.
 *
 * Terraform behaves identically on Raspberry Pi OS (ARM architecture is supported),
 * so this delegates to the pure Node.js implementation.
 *
 * @param {string[]} args - Additional arguments to pass to terraform apply
 * @returns {Promise<void>}
 */
async function do_tpa_raspbian(args) {
  return do_tpa_nodejs(args);
}

/**
 * Apply Terraform plan on Amazon Linux.
 *
 * Terraform behaves identically on Amazon Linux, so this delegates to the pure
 * Node.js implementation. This is commonly used in AWS environments.
 *
 * @param {string[]} args - Additional arguments to pass to terraform apply
 * @returns {Promise<void>}
 */
async function do_tpa_amazon_linux(args) {
  return do_tpa_nodejs(args);
}

/**
 * Apply Terraform plan on Windows Command Prompt.
 *
 * Terraform behaves identically on Windows, so this delegates to the pure Node.js
 * implementation. Terraform can be installed via Chocolatey or winget on Windows.
 *
 * @param {string[]} args - Additional arguments to pass to terraform apply
 * @returns {Promise<void>}
 */
async function do_tpa_cmd(args) {
  return do_tpa_nodejs(args);
}

/**
 * Apply Terraform plan on Windows PowerShell.
 *
 * Terraform behaves identically on Windows, so this delegates to the pure Node.js
 * implementation. PowerShell users may have installed Terraform via Chocolatey,
 * winget, or direct download.
 *
 * @param {string[]} args - Additional arguments to pass to terraform apply
 * @returns {Promise<void>}
 */
async function do_tpa_powershell(args) {
  return do_tpa_nodejs(args);
}

/**
 * Apply Terraform plan on Git Bash (Windows).
 *
 * Terraform behaves identically on Windows even when called from Git Bash,
 * so this delegates to the pure Node.js implementation.
 *
 * @param {string[]} args - Additional arguments to pass to terraform apply
 * @returns {Promise<void>}
 */
async function do_tpa_gitbash(args) {
  return do_tpa_nodejs(args);
}

/**
 * Main entry point - detects environment and executes appropriate implementation.
 *
 * The "tpa" (Terraform Plan Apply) command applies a saved Terraform plan file
 * to your infrastructure. This is the second step in the two-step Terraform
 * workflow:
 *
 *   1. tpo (terraform plan -out="tfplan")  - Review what will change
 *   2. tpa (terraform apply "tfplan")      - Apply the reviewed changes
 *
 * This two-step workflow ensures you never accidentally apply changes you
 * haven't reviewed. The plan file captures the exact changes at a point in
 * time, preventing surprises from configuration drift.
 *
 * @param {string[]} args - Additional arguments to pass to terraform apply
 * @returns {Promise<void>}
 */
async function do_tpa(args) {
  const platform = os.detect();

  const handlers = {
    'macos': do_tpa_macos,
    'ubuntu': do_tpa_ubuntu,
    'debian': do_tpa_ubuntu,
    'raspbian': do_tpa_raspbian,
    'amazon_linux': do_tpa_amazon_linux,
    'rhel': do_tpa_amazon_linux,
    'fedora': do_tpa_ubuntu,
    'linux': do_tpa_ubuntu,
    'wsl': do_tpa_ubuntu,
    'cmd': do_tpa_cmd,
    'windows': do_tpa_cmd,
    'powershell': do_tpa_powershell,
    'gitbash': do_tpa_gitbash
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
  main: do_tpa,
  do_tpa,
  do_tpa_nodejs,
  do_tpa_macos,
  do_tpa_ubuntu,
  do_tpa_raspbian,
  do_tpa_amazon_linux,
  do_tpa_cmd,
  do_tpa_powershell,
  do_tpa_gitbash
};

if (require.main === module) {
  do_tpa(process.argv.slice(2));
}
