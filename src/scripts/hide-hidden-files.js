#!/usr/bin/env node

/**
 * hide-hidden-files - Hide dotfiles in file manager
 *
 * Migrated from legacy dotfiles alias.
 * Original: alias hide-hidden-files="defaults write com.apple.finder AppleShowAllFiles -bool false && killall Finder"
 *
 * This script configures the system's file manager to hide hidden files (dotfiles).
 * Hidden files are files that start with a dot (.) on Unix-like systems, or have
 * the "hidden" attribute on Windows.
 *
 * The behavior varies by platform:
 * - macOS: Modifies Finder preferences to hide files starting with "."
 * - Windows: Hidden files are hidden by default; this ensures they stay hidden
 * - Linux: Configures file manager (Nautilus, Dolphin, etc.) to hide dotfiles
 *
 * @module scripts/hide-hidden-files
 */

const os = require('../utils/common/os');
const { execSync } = require('child_process');

/**
 * Helper function to check if a command exists on the system.
 *
 * @param {string} cmd - The command name to check
 * @returns {boolean} True if the command exists, false otherwise
 */
function isCommandAvailable(cmd) {
  try {
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
 * Hiding hidden files in file managers requires OS-specific integration:
 * - macOS uses the `defaults` command to modify Finder preferences
 * - Windows uses registry or folder options
 * - Linux uses gsettings, dconf, or file manager-specific configuration
 *
 * There is no cross-platform way to accomplish this in pure Node.js because
 * each operating system's file manager stores its preferences differently.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 * @throws {Error} Always throws - this function should not be called directly
 */
async function do_hide_hidden_files_nodejs(args) {
  throw new Error(
    'do_hide_hidden_files_nodejs should not be called directly. ' +
    'Hiding hidden files in file managers requires OS-specific commands.'
  );
}

/**
 * Hide hidden files in macOS Finder.
 *
 * Uses the `defaults` command to modify Finder's preference for showing hidden files.
 * The AppleShowAllFiles key controls whether Finder displays files that start with
 * a dot (.) character.
 *
 * After changing the preference, Finder must be restarted for the change to take effect.
 * This is done by using `killall Finder`, which causes Finder to restart automatically.
 *
 * Original alias: defaults write com.apple.finder AppleShowAllFiles -bool false && killall Finder
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_hide_hidden_files_macos(args) {
  try {
    // Step 1: Check the current value to see if we even need to make a change
    // This makes the function idempotent - running it multiple times has no side effects
    let currentValue = 'false';
    try {
      currentValue = execSync('defaults read com.apple.finder AppleShowAllFiles', {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore']
      }).trim().toLowerCase();
    } catch {
      // If the key doesn't exist, the default is false (hidden files are hidden)
      currentValue = 'false';
    }

    // Normalize various boolean representations to check current state
    // defaults can return: true, false, 1, 0, YES, NO, yes, no
    const isCurrentlyShowing = ['true', '1', 'yes'].includes(currentValue.toLowerCase());

    if (!isCurrentlyShowing) {
      console.log('Hidden files are already hidden in Finder.');
      console.log('No changes needed.');
      return;
    }

    // Step 2: Write the preference to hide hidden files
    execSync('defaults write com.apple.finder AppleShowAllFiles -bool false', {
      stdio: 'inherit'
    });

    // Step 3: Restart Finder for the change to take effect
    // killall Finder causes Finder to quit and relaunch automatically
    execSync('killall Finder', { stdio: 'inherit' });

    console.log('Hidden files are now hidden in Finder.');
    console.log('Finder has been restarted to apply the change.');
  } catch (error) {
    console.error('Error: Could not configure Finder to hide hidden files.');
    console.error('Make sure you have the necessary permissions.');
    console.error(`Details: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Hide hidden files in Ubuntu file managers.
 *
 * Ubuntu typically uses Nautilus (GNOME Files) as the default file manager.
 * This function uses gsettings to modify the show-hidden preference.
 *
 * For other file managers (Dolphin, Thunar, etc.), the configuration method differs.
 * This function attempts to detect and configure the most common file managers.
 *
 * Note: Users can also toggle hidden files with Ctrl+H in most file managers.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_hide_hidden_files_ubuntu(args) {
  // Check if we have a desktop environment
  const hasDesktop = os.isDesktopAvailable();

  if (!hasDesktop) {
    console.log('No desktop environment detected.');
    console.log('This command configures graphical file managers.');
    console.log('');
    console.log('On a headless server, hidden files (dotfiles) are not shown');
    console.log('by default when using `ls`. Use `ls -a` to see them.');
    return;
  }

  // Try to configure Nautilus (GNOME Files) using gsettings
  if (isCommandAvailable('gsettings')) {
    try {
      // Check current value first for idempotency
      const currentValue = execSync(
        'gsettings get org.gtk.Settings.FileChooser show-hidden',
        { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
      ).trim();

      if (currentValue === 'false') {
        console.log('Hidden files are already hidden in file manager.');
        console.log('No changes needed.');
        return;
      }

      // Set the preference to hide hidden files in GTK file chooser dialogs
      execSync('gsettings set org.gtk.Settings.FileChooser show-hidden false', {
        stdio: 'inherit'
      });

      // Also try to set it for Nautilus specifically if the schema exists
      try {
        execSync('gsettings set org.gnome.nautilus.preferences show-hidden-files false', {
          stdio: ['pipe', 'pipe', 'ignore']
        });
      } catch {
        // This schema may not exist on all systems, which is fine
      }

      console.log('Hidden files are now hidden in file manager.');
      console.log('');
      console.log('Note: You can toggle hidden files with Ctrl+H in most file managers.');
      return;
    } catch (error) {
      // gsettings command failed, try other methods
    }
  }

  // Try dconf (alternative to gsettings)
  if (isCommandAvailable('dconf')) {
    try {
      execSync('dconf write /org/gtk/settings/file-chooser/show-hidden false', {
        stdio: 'inherit'
      });
      console.log('Hidden files are now hidden in file manager.');
      console.log('');
      console.log('Note: You can toggle hidden files with Ctrl+H in most file managers.');
      return;
    } catch {
      // dconf command failed, continue
    }
  }

  // Provide manual instructions if automatic configuration failed
  console.log('Could not automatically configure your file manager.');
  console.log('');
  console.log('To hide hidden files manually:');
  console.log('');
  console.log('  Nautilus (GNOME Files):');
  console.log('    Press Ctrl+H to toggle hidden files, or');
  console.log('    Open hamburger menu > Show Hidden Files (uncheck)');
  console.log('');
  console.log('  Dolphin (KDE):');
  console.log('    View menu > Show Hidden Files (uncheck), or');
  console.log('    Press Alt+. to toggle');
  console.log('');
  console.log('  Thunar (XFCE):');
  console.log('    View menu > Show Hidden Files (uncheck), or');
  console.log('    Press Ctrl+H to toggle');
}

/**
 * Hide hidden files on Raspberry Pi OS file managers.
 *
 * Raspberry Pi OS typically uses PCManFM (LXDE) or Nautilus (PIXEL) as file manager.
 * Configuration is similar to Ubuntu.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_hide_hidden_files_raspbian(args) {
  const hasDesktop = os.isDesktopAvailable();

  if (!hasDesktop) {
    console.log('No desktop environment detected.');
    console.log('This command configures graphical file managers.');
    console.log('');
    console.log('On a headless Raspberry Pi, hidden files are not shown');
    console.log('by default when using `ls`. Use `ls -a` to see them.');
    return;
  }

  // Try gsettings (works for PIXEL desktop which uses GTK apps)
  if (isCommandAvailable('gsettings')) {
    try {
      const currentValue = execSync(
        'gsettings get org.gtk.Settings.FileChooser show-hidden',
        { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
      ).trim();

      if (currentValue === 'false') {
        console.log('Hidden files are already hidden in file manager.');
        console.log('No changes needed.');
        return;
      }

      execSync('gsettings set org.gtk.Settings.FileChooser show-hidden false', {
        stdio: 'inherit'
      });

      console.log('Hidden files are now hidden in file manager.');
      console.log('');
      console.log('Note: You can toggle hidden files with Ctrl+H in most file managers.');
      return;
    } catch {
      // Continue to manual instructions
    }
  }

  // PCManFM (LXDE file manager) uses a config file
  // Check if PCManFM config exists and provide instructions
  console.log('To hide hidden files in PCManFM (LXDE file manager):');
  console.log('');
  console.log('  1. Open PCManFM');
  console.log('  2. Go to View menu');
  console.log('  3. Uncheck "Show Hidden Files"');
  console.log('  4. Or press Ctrl+H to toggle');
}

/**
 * Hide hidden files on Amazon Linux.
 *
 * Amazon Linux is typically used in server environments without a graphical desktop.
 * If a desktop is present, attempts to configure available file managers.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_hide_hidden_files_amazon_linux(args) {
  const hasDesktop = os.isDesktopAvailable();

  if (!hasDesktop) {
    console.log('No desktop environment detected.');
    console.log('Amazon Linux is typically used in server environments.');
    console.log('');
    console.log('On a headless server, hidden files (dotfiles) are not shown');
    console.log('by default when using `ls`. Use `ls -a` to see them.');
    return;
  }

  // Try gsettings if a desktop is available
  if (isCommandAvailable('gsettings')) {
    try {
      execSync('gsettings set org.gtk.Settings.FileChooser show-hidden false', {
        stdio: 'inherit'
      });
      console.log('Hidden files are now hidden in file manager.');
      return;
    } catch {
      // Continue to manual instructions
    }
  }

  console.log('Could not automatically configure your file manager.');
  console.log('');
  console.log('To hide hidden files, use Ctrl+H in most file managers.');
}

/**
 * Hide hidden files on Windows using Command Prompt.
 *
 * On Windows, files with the "hidden" attribute are hidden by default.
 * This function ensures that File Explorer is configured to not show hidden files
 * by modifying the registry.
 *
 * The relevant registry key is:
 * HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced\Hidden
 * - Value 1: Show hidden files
 * - Value 2: Do not show hidden files
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_hide_hidden_files_cmd(args) {
  try {
    // Check current value first for idempotency
    let currentValue = '2';
    try {
      const result = execSync(
        'reg query "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" /v Hidden',
        { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
      );
      // Parse the REG_DWORD value from output
      const match = result.match(/Hidden\s+REG_DWORD\s+0x(\d+)/);
      if (match) {
        currentValue = parseInt(match[1], 16).toString();
      }
    } catch {
      // If we can't read the value, assume we need to set it
    }

    if (currentValue === '2') {
      console.log('Hidden files are already hidden in File Explorer.');
      console.log('No changes needed.');
      return;
    }

    // Set the registry value to hide hidden files (2 = don't show)
    execSync(
      'reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" /v Hidden /t REG_DWORD /d 2 /f',
      { stdio: 'inherit' }
    );

    console.log('Hidden files are now hidden in File Explorer.');
    console.log('');
    console.log('You may need to refresh or restart File Explorer to see the change.');
    console.log('');
    console.log('Note: Windows hidden files have the "hidden" attribute set.');
    console.log('Unix-style dotfiles (like .gitignore) are NOT automatically hidden');
    console.log('on Windows unless you set the hidden attribute manually.');
  } catch (error) {
    console.error('Error: Could not configure File Explorer settings.');
    console.error(`Details: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Hide hidden files on Windows using PowerShell.
 *
 * Uses the same registry modification as CMD, but can also use PowerShell cmdlets
 * for a more native approach.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_hide_hidden_files_powershell(args) {
  try {
    // Use PowerShell to check and set the registry value
    const checkScript = `
      $path = 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced'
      $value = Get-ItemPropertyValue -Path $path -Name 'Hidden' -ErrorAction SilentlyContinue
      if ($value -eq $null) { $value = 2 }
      Write-Output $value
    `.replace(/\n\s*/g, ' ').trim();

    let currentValue = '2';
    try {
      currentValue = execSync(`powershell -Command "${checkScript}"`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore']
      }).trim();
    } catch {
      // Assume we need to set it
    }

    if (currentValue === '2') {
      console.log('Hidden files are already hidden in File Explorer.');
      console.log('No changes needed.');
      return;
    }

    // Set the registry value using PowerShell
    const setScript = `
      $path = 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced'
      Set-ItemProperty -Path $path -Name 'Hidden' -Value 2
    `.replace(/\n\s*/g, ' ').trim();

    execSync(`powershell -Command "${setScript}"`, { stdio: 'inherit' });

    console.log('Hidden files are now hidden in File Explorer.');
    console.log('');
    console.log('You may need to refresh or restart File Explorer to see the change.');
  } catch (error) {
    console.error('Error: Could not configure File Explorer settings.');
    console.error(`Details: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Hide hidden files from Git Bash on Windows.
 *
 * Git Bash runs on Windows, so this uses the Windows registry approach
 * to configure File Explorer settings.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_hide_hidden_files_gitbash(args) {
  try {
    // From Git Bash, we can use reg.exe to modify the registry
    let currentValue = '2';
    try {
      const result = execSync(
        'reg query "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" /v Hidden',
        { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
      );
      const match = result.match(/Hidden\s+REG_DWORD\s+0x(\d+)/);
      if (match) {
        currentValue = parseInt(match[1], 16).toString();
      }
    } catch {
      // If we can't read, assume we need to set
    }

    if (currentValue === '2') {
      console.log('Hidden files are already hidden in File Explorer.');
      console.log('No changes needed.');
      return;
    }

    execSync(
      'reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" /v Hidden /t REG_DWORD /d 2 /f',
      { stdio: 'inherit' }
    );

    console.log('Hidden files are now hidden in File Explorer.');
    console.log('');
    console.log('You may need to refresh or restart File Explorer to see the change.');
  } catch (error) {
    console.error('Error: Could not configure File Explorer settings.');
    console.error(`Details: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Main entry point - detects environment and executes appropriate implementation.
 *
 * Configures the system's file manager to hide hidden files (dotfiles).
 * This is useful for keeping your file browser clean and focused on
 * non-configuration files.
 *
 * Hidden files are:
 * - Unix/macOS: Files starting with a dot (e.g., .gitignore, .bashrc)
 * - Windows: Files with the "hidden" attribute set
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_hide_hidden_files(args) {
  const platform = os.detect();

  const handlers = {
    'macos': do_hide_hidden_files_macos,
    'ubuntu': do_hide_hidden_files_ubuntu,
    'debian': do_hide_hidden_files_ubuntu,
    'raspbian': do_hide_hidden_files_raspbian,
    'amazon_linux': do_hide_hidden_files_amazon_linux,
    'rhel': do_hide_hidden_files_amazon_linux,
    'fedora': do_hide_hidden_files_ubuntu,
    'linux': do_hide_hidden_files_ubuntu,
    'wsl': do_hide_hidden_files_ubuntu,
    'cmd': do_hide_hidden_files_cmd,
    'windows': do_hide_hidden_files_cmd,
    'powershell': do_hide_hidden_files_powershell,
    'gitbash': do_hide_hidden_files_gitbash
  };

  const handler = handlers[platform.type];
  if (!handler) {
    console.error(`Platform '${platform.type}' is not supported for this command.`);
    console.error('');
    console.error('Supported platforms:');
    console.error('  - macOS (Finder)');
    console.error('  - Ubuntu, Debian, and other Linux distributions');
    console.error('  - Raspberry Pi OS');
    console.error('  - Windows (File Explorer)');
    process.exit(1);
  }

  await handler(args);
}

module.exports = {
  main: do_hide_hidden_files,
  do_hide_hidden_files,
  do_hide_hidden_files_nodejs,
  do_hide_hidden_files_macos,
  do_hide_hidden_files_ubuntu,
  do_hide_hidden_files_raspbian,
  do_hide_hidden_files_amazon_linux,
  do_hide_hidden_files_cmd,
  do_hide_hidden_files_powershell,
  do_hide_hidden_files_gitbash
};

if (require.main === module) {
  do_hide_hidden_files(process.argv.slice(2));
}
