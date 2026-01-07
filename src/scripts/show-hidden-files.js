#!/usr/bin/env node

/**
 * show-hidden-files - Configure file manager to show hidden files (dotfiles)
 *
 * Migrated from legacy dotfiles alias.
 * Original: alias show-hidden-files="defaults write com.apple.finder AppleShowAllFiles -bool true && killall Finder"
 *
 * This script configures the system's file manager to display hidden files.
 * Hidden files are those that start with a dot (.) on Unix-like systems,
 * or have the "hidden" attribute set on Windows.
 *
 * The behavior varies by platform:
 * - macOS: Modifies Finder preferences and restarts Finder
 * - Linux (GNOME): Uses gsettings to configure Nautilus file manager
 * - Linux (other): Provides instructions for toggling hidden files
 * - Windows: Modifies Explorer settings via registry or PowerShell
 *
 * @module scripts/show-hidden-files
 */

const os = require('../utils/common/os');
const { execSync } = require('child_process');

/**
 * Helper function to check if a command exists on the system.
 * Used to detect which tools are available for configuration.
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
 * Pure Node.js implementation - NOT APPLICABLE for this script.
 *
 * Showing hidden files requires OS-level integration with the file manager:
 * - macOS uses the `defaults` command to modify Finder preferences
 * - Linux uses gsettings/dconf for GNOME or DE-specific configuration
 * - Windows uses registry modifications or PowerShell cmdlets
 *
 * There is no pure Node.js way to configure file manager preferences.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 * @throws {Error} Always throws - this function should not be called directly
 */
async function do_show_hidden_files_nodejs(args) {
  // Configuring file manager preferences is inherently platform-specific.
  // Each platform has its own settings system and file manager.
  throw new Error(
    'do_show_hidden_files_nodejs should not be called directly. ' +
    'File manager configuration requires OS-specific commands.'
  );
}

/**
 * Show hidden files in macOS Finder.
 *
 * Uses the original dotfiles approach:
 * 1. Set AppleShowAllFiles preference to true using `defaults` command
 * 2. Restart Finder with `killall` to apply changes immediately
 *
 * The setting persists across reboots. To hide hidden files again,
 * use the companion `hide-hidden-files` command.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_show_hidden_files_macos(args) {
  try {
    console.log('Configuring Finder to show hidden files...');

    // Step 1: Write the preference to show all files
    // This sets AppleShowAllFiles to true in Finder's preferences
    execSync('defaults write com.apple.finder AppleShowAllFiles -bool true', {
      stdio: 'pipe'
    });

    // Step 2: Restart Finder to apply the change immediately
    // Without this, users would need to log out or restart Finder manually
    execSync('killall Finder', { stdio: 'pipe' });

    console.log('Done! Hidden files are now visible in Finder.');
    console.log('');
    console.log('To hide them again, run: hide-hidden-files');
  } catch (error) {
    console.error('Error: Could not configure Finder preferences.');
    console.error('Make sure you have the necessary permissions.');
    if (error.message) {
      console.error(`Details: ${error.message}`);
    }
    process.exit(1);
  }
}

/**
 * Show hidden files in Ubuntu file managers.
 *
 * Ubuntu typically uses Nautilus (GNOME Files) as the default file manager.
 * This function uses gsettings to enable the "show-hidden" preference.
 *
 * For other file managers (Thunar, Dolphin, etc.), users can typically
 * press Ctrl+H to toggle hidden file visibility.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_show_hidden_files_ubuntu(args) {
  // Check if we have a desktop environment available
  const hasDesktop = os.isDesktopAvailable();

  if (!hasDesktop) {
    console.log('No desktop environment detected.');
    console.log('');
    console.log('On a headless server, hidden files are always visible in the terminal.');
    console.log('Use "ls -a" to list all files including hidden ones.');
    return;
  }

  // Try gsettings for GNOME/Nautilus first (most common on Ubuntu)
  if (isCommandAvailable('gsettings')) {
    try {
      console.log('Configuring file manager to show hidden files...');

      // This setting tells Nautilus (GNOME Files) to show hidden files
      execSync('gsettings set org.gnome.nautilus.preferences show-hidden-files true', {
        stdio: 'pipe'
      });

      console.log('Done! Hidden files are now visible in the file manager.');
      console.log('');
      console.log('To hide them again, run: hide-hidden-files');
      console.log('Or press Ctrl+H in the file manager to toggle visibility.');
      return;
    } catch {
      // gsettings command failed, maybe not using GNOME
    }
  }

  // Try dconf for GNOME (alternative method)
  if (isCommandAvailable('dconf')) {
    try {
      execSync('dconf write /org/gnome/nautilus/preferences/show-hidden-files true', {
        stdio: 'pipe'
      });

      console.log('Done! Hidden files are now visible in Nautilus.');
      console.log('');
      console.log('To hide them again, run: hide-hidden-files');
      return;
    } catch {
      // dconf command failed
    }
  }

  // Provide generic instructions for other desktop environments
  console.log('Could not automatically configure the file manager.');
  console.log('');
  console.log('To show hidden files manually:');
  console.log('  - Press Ctrl+H in most file managers to toggle visibility');
  console.log('  - In Nautilus: View menu > Show Hidden Files');
  console.log('  - In Thunar: View menu > Show Hidden Files');
  console.log('  - In Dolphin: View menu > Hidden Files (or press Alt+.)');
  console.log('');
  console.log('In the terminal, use "ls -a" to list all files.');
}

/**
 * Show hidden files on Raspberry Pi OS.
 *
 * Raspberry Pi OS typically uses PCManFM (LXDE) or Thunar (XFCE) as the
 * default file manager. This function attempts to configure the appropriate
 * file manager or provides manual instructions.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_show_hidden_files_raspbian(args) {
  // Check if we have a desktop environment available
  const hasDesktop = os.isDesktopAvailable();

  if (!hasDesktop) {
    console.log('No desktop environment detected.');
    console.log('');
    console.log('On a headless Raspberry Pi, hidden files are always visible in the terminal.');
    console.log('Use "ls -a" to list all files including hidden ones.');
    return;
  }

  // Try gsettings for GNOME/Nautilus (if using GNOME desktop on Pi)
  if (isCommandAvailable('gsettings')) {
    try {
      execSync('gsettings set org.gnome.nautilus.preferences show-hidden-files true', {
        stdio: 'pipe'
      });

      console.log('Done! Hidden files are now visible in the file manager.');
      console.log('');
      console.log('To hide them again, run: hide-hidden-files');
      return;
    } catch {
      // gsettings failed, try other methods
    }
  }

  // Provide instructions for PCManFM (common on Raspberry Pi OS with LXDE)
  console.log('Raspberry Pi OS file manager configuration:');
  console.log('');
  console.log('For PCManFM (default on LXDE desktop):');
  console.log('  1. Open the File Manager');
  console.log('  2. Go to Edit menu > Preferences');
  console.log('  3. Check "Show hidden files"');
  console.log('  Or press Ctrl+H to toggle visibility');
  console.log('');
  console.log('For other file managers:');
  console.log('  - Press Ctrl+H to toggle hidden files');
  console.log('');
  console.log('In the terminal, use "ls -a" to list all files.');
}

/**
 * Show hidden files on Amazon Linux.
 *
 * Amazon Linux is typically used in server environments without a desktop.
 * If a desktop is present, it attempts to configure the file manager.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_show_hidden_files_amazon_linux(args) {
  // Check if we have a desktop environment available
  const hasDesktop = os.isDesktopAvailable();

  if (!hasDesktop) {
    console.log('No desktop environment detected.');
    console.log('Amazon Linux is typically used in server environments.');
    console.log('');
    console.log('Hidden files are always visible in the terminal.');
    console.log('Use "ls -a" to list all files including hidden ones.');
    return;
  }

  // Try gsettings for GNOME
  if (isCommandAvailable('gsettings')) {
    try {
      execSync('gsettings set org.gnome.nautilus.preferences show-hidden-files true', {
        stdio: 'pipe'
      });

      console.log('Done! Hidden files are now visible in the file manager.');
      console.log('');
      console.log('To hide them again, run: hide-hidden-files');
      return;
    } catch {
      // gsettings failed
    }
  }

  console.log('Could not automatically configure the file manager.');
  console.log('Press Ctrl+H in most file managers to toggle hidden files.');
  console.log('');
  console.log('In the terminal, use "ls -a" to list all files.');
}

/**
 * Show hidden files in Windows File Explorer using Command Prompt.
 *
 * Windows hidden files are controlled by two settings in the registry:
 * 1. Hidden - Controls visibility of files with the "hidden" attribute
 * 2. ShowSuperHidden - Controls visibility of system files
 *
 * This function modifies the Explorer settings via the registry.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_show_hidden_files_cmd(args) {
  try {
    console.log('Configuring File Explorer to show hidden files...');

    // Set Hidden to 1 (show hidden files)
    // The "Hidden" key controls whether files with the hidden attribute are displayed
    // Value 1 = show, Value 2 = don't show
    execSync(
      'reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" /v Hidden /t REG_DWORD /d 1 /f',
      { stdio: 'pipe' }
    );

    // Optionally show super hidden (system) files as well
    // Value 1 = show, Value 0 = don't show
    execSync(
      'reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" /v ShowSuperHidden /t REG_DWORD /d 1 /f',
      { stdio: 'pipe' }
    );

    console.log('Done! Registry has been updated to show hidden files.');
    console.log('');
    console.log('Note: You may need to:');
    console.log('  1. Open a new File Explorer window, or');
    console.log('  2. Press F5 to refresh the current window');
    console.log('');
    console.log('To hide them again, run: hide-hidden-files');
  } catch (error) {
    console.error('Error: Could not modify registry settings.');
    console.error('Make sure you have the necessary permissions.');
    if (error.message) {
      console.error(`Details: ${error.message}`);
    }
    process.exit(1);
  }
}

/**
 * Show hidden files in Windows File Explorer using PowerShell.
 *
 * Uses PowerShell's Set-ItemProperty cmdlet to modify Explorer settings.
 * This is a cleaner approach than using the reg command directly.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_show_hidden_files_powershell(args) {
  try {
    console.log('Configuring File Explorer to show hidden files...');

    // PowerShell command to set the Hidden property
    // Using Set-ItemProperty for cleaner registry access
    const regPath = 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced';

    // Show hidden files (Hidden = 1)
    execSync(
      `powershell -Command "Set-ItemProperty -Path '${regPath}' -Name 'Hidden' -Value 1"`,
      { stdio: 'pipe' }
    );

    // Show super hidden (system) files (ShowSuperHidden = 1)
    execSync(
      `powershell -Command "Set-ItemProperty -Path '${regPath}' -Name 'ShowSuperHidden' -Value 1"`,
      { stdio: 'pipe' }
    );

    console.log('Done! Registry has been updated to show hidden files.');
    console.log('');
    console.log('Note: You may need to:');
    console.log('  1. Open a new File Explorer window, or');
    console.log('  2. Press F5 to refresh the current window');
    console.log('');
    console.log('To hide them again, run: hide-hidden-files');
  } catch (error) {
    console.error('Error: Could not modify registry settings.');
    console.error('Make sure you have the necessary permissions.');
    if (error.message) {
      console.error(`Details: ${error.message}`);
    }
    process.exit(1);
  }
}

/**
 * Show hidden files in Windows File Explorer from Git Bash.
 *
 * Git Bash runs on Windows, so we use the Windows registry commands.
 * The reg.exe command is available in Git Bash's PATH.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_show_hidden_files_gitbash(args) {
  try {
    console.log('Configuring File Explorer to show hidden files...');

    // Use reg.exe (available in Git Bash on Windows)
    // Note: In Git Bash, we need to use forward slashes or escape backslashes
    execSync(
      'reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" /v Hidden /t REG_DWORD /d 1 /f',
      { stdio: 'pipe' }
    );

    execSync(
      'reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" /v ShowSuperHidden /t REG_DWORD /d 1 /f',
      { stdio: 'pipe' }
    );

    console.log('Done! Registry has been updated to show hidden files.');
    console.log('');
    console.log('Note: You may need to:');
    console.log('  1. Open a new File Explorer window, or');
    console.log('  2. Press F5 to refresh the current window');
    console.log('');
    console.log('To hide them again, run: hide-hidden-files');
  } catch (error) {
    console.error('Error: Could not modify registry settings.');
    console.error('Make sure you have the necessary permissions.');
    if (error.message) {
      console.error(`Details: ${error.message}`);
    }
    process.exit(1);
  }
}

/**
 * Main entry point - detects environment and executes appropriate implementation.
 *
 * The "show-hidden-files" command configures the system's file manager to
 * display hidden files (dotfiles on Unix, hidden attribute files on Windows).
 *
 * This is useful for developers who frequently need to access configuration
 * files like .gitignore, .env, .bashrc, etc.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_show_hidden_files(args) {
  const platform = os.detect();

  const handlers = {
    'macos': do_show_hidden_files_macos,
    'ubuntu': do_show_hidden_files_ubuntu,
    'debian': do_show_hidden_files_ubuntu,
    'raspbian': do_show_hidden_files_raspbian,
    'amazon_linux': do_show_hidden_files_amazon_linux,
    'rhel': do_show_hidden_files_amazon_linux,
    'fedora': do_show_hidden_files_ubuntu,
    'linux': do_show_hidden_files_ubuntu,
    'wsl': do_show_hidden_files_ubuntu,
    'cmd': do_show_hidden_files_cmd,
    'windows': do_show_hidden_files_cmd,
    'powershell': do_show_hidden_files_powershell,
    'gitbash': do_show_hidden_files_gitbash
  };

  const handler = handlers[platform.type];
  if (!handler) {
    console.error(`Platform '${platform.type}' is not supported for this command.`);
    console.error('');
    console.error('Supported platforms:');
    console.error('  - macOS');
    console.error('  - Ubuntu, Debian, and other Linux distributions');
    console.error('  - Raspberry Pi OS');
    console.error('  - Windows (CMD, PowerShell, Git Bash)');
    process.exit(1);
  }

  await handler(args);
}

module.exports = {
  main: do_show_hidden_files,
  do_show_hidden_files,
  do_show_hidden_files_nodejs,
  do_show_hidden_files_macos,
  do_show_hidden_files_ubuntu,
  do_show_hidden_files_raspbian,
  do_show_hidden_files_amazon_linux,
  do_show_hidden_files_cmd,
  do_show_hidden_files_powershell,
  do_show_hidden_files_gitbash
};

if (require.main === module) {
  do_show_hidden_files(process.argv.slice(2));
}
