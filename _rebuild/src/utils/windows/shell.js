#!/usr/bin/env node

/**
 * Windows Shell Environment Detection Utilities
 *
 * Windows-specific utilities for detecting the shell environment.
 * These functions address a Windows-specific concern: CMD and PowerShell have
 * fundamentally different syntax and capabilities. Unix shells (bash, zsh, sh)
 * are interchangeable for command execution purposes.
 */

const shell = require('../common/shell');

/**
 * Checks if running inside PowerShell
 * @returns {boolean}
 */
function isPowerShell() {
  // Check for PowerShell-specific environment variables
  if (process.env.PSModulePath) {
    return true;
  }

  // Check if the parent process is PowerShell
  if (process.env.SHELL && process.env.SHELL.includes('pwsh')) {
    return true;
  }

  // Check ComSpec for PowerShell
  const comspec = process.env.ComSpec || '';
  if (comspec.toLowerCase().includes('powershell')) {
    return true;
  }

  return false;
}

/**
 * Checks if running inside CMD
 * @returns {boolean}
 */
function isCmd() {
  // If we're in PowerShell, we're not in CMD
  if (isPowerShell()) {
    return false;
  }

  // Check ComSpec for cmd.exe
  const comspec = process.env.ComSpec || '';
  if (comspec.toLowerCase().includes('cmd.exe')) {
    return true;
  }

  // Check PROMPT environment variable (CMD-specific)
  if (process.env.PROMPT) {
    return true;
  }

  return false;
}

/**
 * Checks if running inside Windows Terminal
 * @returns {boolean}
 */
function isWindowsTerminal() {
  // Windows Terminal sets WT_SESSION
  return !!process.env.WT_SESSION;
}

/**
 * Returns PowerShell version (5.x for Windows PowerShell, 7.x for PowerShell Core)
 * @returns {Promise<string|null>}
 */
async function getPowerShellVersion() {
  // Try pwsh first (PowerShell Core / 7.x)
  if (shell.commandExists('pwsh')) {
    const result = await shell.exec('pwsh -NoProfile -Command "$PSVersionTable.PSVersion.ToString()"');
    if (result.code === 0 && result.stdout.trim()) {
      return result.stdout.trim();
    }
  }

  // Try powershell (Windows PowerShell / 5.x)
  if (shell.commandExists('powershell')) {
    const result = await shell.exec('powershell -NoProfile -Command "$PSVersionTable.PSVersion.ToString()"');
    if (result.code === 0 && result.stdout.trim()) {
      return result.stdout.trim();
    }
  }

  return null;
}

/**
 * Returns the current shell name
 * @returns {'powershell'|'pwsh'|'cmd'|'unknown'}
 */
function getShellName() {
  if (shell.commandExists('pwsh') && isPowerShell()) {
    // Check if it's specifically pwsh (Core) vs powershell (Windows)
    const psModulePath = process.env.PSModulePath || '';
    if (psModulePath.includes('PowerShell\\7') || psModulePath.includes('powershell/7')) {
      return 'pwsh';
    }
    return 'powershell';
  }

  if (isPowerShell()) {
    return 'powershell';
  }

  if (isCmd()) {
    return 'cmd';
  }

  return 'unknown';
}

/**
 * Checks if PowerShell Core (pwsh 7.x) is available
 * @returns {boolean}
 */
function hasPowerShellCore() {
  return shell.commandExists('pwsh');
}

/**
 * Checks if Windows PowerShell (5.x) is available
 * @returns {boolean}
 */
function hasWindowsPowerShell() {
  return shell.commandExists('powershell');
}

/**
 * Gets the path to the preferred PowerShell executable
 * @returns {string|null}
 */
function getPowerShellPath() {
  // Prefer PowerShell Core if available
  const pwshPath = shell.which('pwsh');
  if (pwshPath) {
    return pwshPath;
  }

  // Fall back to Windows PowerShell
  const powershellPath = shell.which('powershell');
  return powershellPath;
}

/**
 * Executes a PowerShell command
 * @param {string} command - The PowerShell command to execute
 * @param {Object} [options] - Execution options
 * @param {boolean} [options.noProfile=true] - Don't load the PowerShell profile
 * @param {boolean} [options.usePwsh=true] - Prefer pwsh over powershell
 * @returns {Promise<{ success: boolean, stdout: string, stderr: string }>}
 */
async function execPowerShell(command, options = {}) {
  const noProfile = options.noProfile !== false ? '-NoProfile' : '';
  const usePwsh = options.usePwsh !== false && hasPowerShellCore();

  const ps = usePwsh ? 'pwsh' : 'powershell';

  // Escape double quotes in the command
  const escapedCommand = command.replace(/"/g, '\\"');

  const result = await shell.exec(`${ps} ${noProfile} -Command "${escapedCommand}"`);
  return {
    success: result.code === 0,
    stdout: result.stdout,
    stderr: result.stderr
  };
}

/**
 * Gets the Windows build number
 * @returns {Promise<number|null>}
 */
async function getWindowsBuild() {
  const result = await shell.exec('powershell -NoProfile -Command "[System.Environment]::OSVersion.Version.Build"');
  if (result.code === 0 && result.stdout.trim()) {
    const build = parseInt(result.stdout.trim(), 10);
    return isNaN(build) ? null : build;
  }
  return null;
}

/**
 * Gets the Windows version name (e.g., "Windows 11", "Windows 10")
 * @returns {Promise<string|null>}
 */
async function getWindowsVersion() {
  const result = await shell.exec('powershell -NoProfile -Command "(Get-WmiObject Win32_OperatingSystem).Caption"');
  if (result.code === 0 && result.stdout.trim()) {
    return result.stdout.trim();
  }
  return null;
}

/**
 * Checks if the current console supports ANSI colors
 * @returns {boolean}
 */
function supportsAnsiColors() {
  // Windows Terminal always supports ANSI
  if (isWindowsTerminal()) {
    return true;
  }

  // Check for ANSICON (adds ANSI support to CMD)
  if (process.env.ANSICON) {
    return true;
  }

  // Check for ConEmu
  if (process.env.ConEmuANSI === 'ON') {
    return true;
  }

  // Modern Windows 10+ CMD supports ANSI if virtual terminal processing is enabled
  // This is hard to detect without trying, so we assume modern Windows supports it
  return true;
}

module.exports = {
  isPowerShell,
  isCmd,
  isWindowsTerminal,
  getPowerShellVersion,
  getShellName,
  hasPowerShellCore,
  hasWindowsPowerShell,
  getPowerShellPath,
  execPowerShell,
  getWindowsBuild,
  getWindowsVersion,
  supportsAnsiColors
};
