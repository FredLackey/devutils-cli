#!/usr/bin/env node

/**
 * show-desktop-icons - Show all icons on the desktop
 *
 * Migrated from legacy dotfiles alias.
 * Original aliases:
 *   macOS:  alias show-desktop-icons="defaults write com.apple.finder CreateDesktop -bool true && killall Finder"
 *   Ubuntu: alias show-desktop-icons="gsettings set org.gnome.desktop.background show-desktop-icons true" (commented)
 *
 * This script shows all icons on the desktop. The method varies by platform:
 * - macOS: Modifies Finder preferences to enable the desktop and restarts Finder
 * - Linux (GNOME): Uses gsettings to show desktop icons
 * - Linux (Other DEs): Uses appropriate desktop environment settings
 * - Windows: Toggles desktop icons visibility through registry or COM objects
 *
 * Note: This is a desktop-specific operation that requires a graphical environment.
 * On headless servers, this command will display an informative message.
 *
 * @module scripts/show-desktop-icons
 */

const os = require('../utils/common/os');
const { execSync } = require('child_process');

/**
 * Helper function to check if a command exists on the system.
 * Used to detect which desktop tools are available.
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
 * Showing desktop icons requires OS-level integration that cannot be done in pure Node.js.
 * Each platform has its own mechanism for controlling desktop icon visibility:
 * - macOS uses the defaults command to modify Finder preferences
 * - Linux uses gsettings, dconf, or desktop environment-specific tools
 * - Windows uses registry edits or shell COM objects
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 * @throws {Error} Always throws - this function should not be called directly
 */
async function do_show_desktop_icons_nodejs(args) {
  // Desktop icon visibility is inherently platform-specific and cannot be
  // implemented in pure Node.js. Each platform function contains the
  // appropriate system calls.
  throw new Error(
    'do_show_desktop_icons_nodejs should not be called directly. ' +
    'Desktop icon control requires OS-specific commands.'
  );
}

/**
 * Show desktop icons on macOS by modifying Finder preferences.
 *
 * Uses the original dotfiles approach:
 * 1. Write 'CreateDesktop' preference to true in com.apple.finder
 * 2. Restart Finder to apply the change
 *
 * The CreateDesktop preference controls whether Finder draws icons on the desktop.
 * When set to true, all items in ~/Desktop are rendered as icons on the desktop surface.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_show_desktop_icons_macos(args) {
  try {
    // Step 1: Write the preference to enable desktop icons
    // This tells Finder to render icons for files in ~/Desktop on the desktop surface
    execSync('defaults write com.apple.finder CreateDesktop -bool true', {
      stdio: 'inherit'
    });

    // Step 2: Restart Finder to apply the changes
    // Finder must be restarted for the preference change to take effect
    execSync('killall Finder', { stdio: 'inherit' });

    console.log('Desktop icons are now visible.');
    console.log('To hide them again, run: hide-desktop-icons');
  } catch (error) {
    console.error('Error: Could not show desktop icons.');
    console.error('Make sure you have the necessary permissions.');
    process.exit(1);
  }
}

/**
 * Show desktop icons on Ubuntu using gsettings or dconf.
 *
 * Ubuntu with GNOME has changed how desktop icons work over the versions:
 * - Ubuntu 18.04 and earlier: org.gnome.desktop.background show-desktop-icons
 * - Ubuntu 20.04+: Desktop icons handled by GNOME Shell extension
 * - Modern GNOME: org.gnome.shell.extensions.desktop-icons or ding extension
 *
 * This function tries multiple approaches in order of preference.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_show_desktop_icons_ubuntu(args) {
  // Check if we have a desktop environment available
  const hasDesktop = os.isDesktopAvailable();

  if (!hasDesktop) {
    console.log('No desktop environment detected.');
    console.log('This command is designed for graphical environments.');
    console.log('');
    console.log('Desktop icons can only be shown on systems with a GUI.');
    return;
  }

  // Check if gsettings is available
  if (!isCommandAvailable('gsettings')) {
    console.error('Error: gsettings command not found.');
    console.error('This command requires GNOME desktop environment tools.');
    console.error('');
    console.error('Install with: sudo apt install libglib2.0-bin');
    process.exit(1);
  }

  // Try different approaches for different GNOME versions
  const showCommands = [
    // Modern GNOME with desktop-icons-ng (ding) extension (Ubuntu 20.04+)
    {
      cmd: 'gsettings set org.gnome.shell.extensions.ding show-home true && gsettings set org.gnome.shell.extensions.ding show-trash true && gsettings set org.gnome.shell.extensions.ding show-volumes true',
      description: 'GNOME desktop-icons-ng extension'
    },
    // Older GNOME with desktop-icons extension
    {
      cmd: 'gsettings set org.gnome.shell.extensions.desktop-icons show-home true && gsettings set org.gnome.shell.extensions.desktop-icons show-trash true',
      description: 'GNOME desktop-icons extension'
    },
    // Legacy GNOME (Ubuntu 18.04 and earlier)
    {
      cmd: 'gsettings set org.gnome.desktop.background show-desktop-icons true',
      description: 'Legacy GNOME desktop icons'
    },
    // Nautilus desktop (some configurations)
    {
      cmd: 'gsettings set org.gnome.nautilus.desktop volumes-visible true && gsettings set org.gnome.nautilus.desktop home-icon-visible true && gsettings set org.gnome.nautilus.desktop trash-icon-visible true',
      description: 'Nautilus desktop'
    }
  ];

  let success = false;

  for (const approach of showCommands) {
    try {
      execSync(approach.cmd, { stdio: 'pipe', encoding: 'utf8' });
      console.log(`Desktop icons shown using ${approach.description}.`);
      console.log('To hide them again, run: hide-desktop-icons');
      success = true;
      break;
    } catch {
      // This approach didn't work, try the next one
      continue;
    }
  }

  if (!success) {
    console.error('Error: Could not show desktop icons.');
    console.error('');
    console.error('Your desktop environment may not support this operation,');
    console.error('or you may be using a non-standard configuration.');
    console.error('');
    console.error('Tried approaches:');
    for (const approach of showCommands) {
      console.error(`  - ${approach.description}`);
    }
    process.exit(1);
  }
}

/**
 * Show desktop icons on Raspberry Pi OS.
 *
 * Raspberry Pi OS typically uses LXDE/LXQT (Raspberry Pi OS Lite) or PIXEL desktop.
 * Desktop icon settings are managed through pcmanfm configuration.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_show_desktop_icons_raspbian(args) {
  // Check if we have a desktop environment available
  const hasDesktop = os.isDesktopAvailable();

  if (!hasDesktop) {
    console.log('No desktop environment detected.');
    console.log('This command is designed for graphical environments.');
    console.log('');
    console.log('Desktop icons can only be shown on Raspberry Pi OS with desktop.');
    return;
  }

  // For Raspberry Pi OS with PIXEL/LXDE, the desktop is managed by PCManFM
  // PCManFM stores settings in ~/.config/pcmanfm/LXDE-pi/desktop-items-0.conf
  const fs = require('fs');
  const path = require('path');
  const homeDir = os.getHomeDir();

  // Common pcmanfm config locations
  const configPaths = [
    path.join(homeDir, '.config/pcmanfm/LXDE-pi/desktop-items-0.conf'),
    path.join(homeDir, '.config/pcmanfm/default/desktop-items-0.conf'),
    path.join(homeDir, '.config/pcmanfm/LXDE/desktop-items-0.conf')
  ];

  for (const configPath of configPaths) {
    if (fs.existsSync(configPath)) {
      try {
        let config = fs.readFileSync(configPath, 'utf8');

        // Modify the show_documents, show_trash, and show_mounts settings
        config = config.replace(/show_documents=0/g, 'show_documents=1');
        config = config.replace(/show_trash=0/g, 'show_trash=1');
        config = config.replace(/show_mounts=0/g, 'show_mounts=1');

        fs.writeFileSync(configPath, config);
        console.log('Desktop icons shown via PCManFM configuration.');
        console.log('You may need to restart the desktop or log out and back in.');
        console.log('To hide them again, run: hide-desktop-icons');
        return;
      } catch (err) {
        // Continue to try other methods
      }
    }
  }

  // Fallback: try gsettings if available
  if (isCommandAvailable('gsettings')) {
    try {
      execSync('gsettings set org.gnome.desktop.background show-desktop-icons true', {
        stdio: 'pipe'
      });
      console.log('Desktop icons shown.');
      console.log('To hide them again, run: hide-desktop-icons');
      return;
    } catch {
      // gsettings approach didn't work
    }
  }

  console.error('Error: Could not show desktop icons.');
  console.error('');
  console.error('On Raspberry Pi OS, desktop icons are managed by PCManFM.');
  console.error('You can manually show them by right-clicking the desktop,');
  console.error('selecting "Desktop Preferences", and checking the icon options.');
  process.exit(1);
}

/**
 * Show desktop icons on Amazon Linux.
 *
 * Amazon Linux is typically used in server environments without a desktop.
 * If a desktop is present (rare), it attempts to use GNOME settings.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_show_desktop_icons_amazon_linux(args) {
  // Check if we have a desktop environment available
  const hasDesktop = os.isDesktopAvailable();

  if (!hasDesktop) {
    console.log('No desktop environment detected.');
    console.log('Amazon Linux is typically used in server environments.');
    console.log('');
    console.log('Desktop icons can only be shown on systems with a GUI.');
    return;
  }

  // Try gsettings if available
  if (isCommandAvailable('gsettings')) {
    try {
      execSync('gsettings set org.gnome.desktop.background show-desktop-icons true', {
        stdio: 'inherit'
      });
      console.log('Desktop icons shown.');
      console.log('To hide them again, run: hide-desktop-icons');
      return;
    } catch {
      // gsettings approach didn't work
    }
  }

  console.error('Error: Could not show desktop icons.');
  console.error('This feature requires a desktop environment with GNOME settings.');
  process.exit(1);
}

/**
 * Show desktop icons on Windows using Command Prompt.
 *
 * Windows desktop icons can be shown through:
 * 1. Right-click desktop > View > Show desktop icons (manual)
 * 2. Registry modification
 * 3. Shell COM object manipulation
 *
 * This implementation modifies the registry to show desktop icons
 * and restarts Explorer to apply the change.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_show_desktop_icons_cmd(args) {
  try {
    // Modify registry to show icons by setting HideIcons to 0
    const registryCommand = `
      reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" /v HideIcons /t REG_DWORD /d 0 /f
    `;

    execSync(`cmd /c ${registryCommand.trim().replace(/\n/g, ' ')}`, { stdio: 'inherit' });

    // Restart Explorer to apply the changes
    execSync('taskkill /f /im explorer.exe && start explorer.exe', {
      stdio: 'inherit',
      shell: true
    });

    console.log('Desktop icons are now visible.');
    console.log('To hide them again, run: hide-desktop-icons');
  } catch (error) {
    console.error('Error: Could not show desktop icons.');
    console.error('');
    console.error('You can manually show desktop icons by:');
    console.error('1. Right-click on the desktop');
    console.error('2. Select "View"');
    console.error('3. Check "Show desktop icons"');
    process.exit(1);
  }
}

/**
 * Show desktop icons on Windows using PowerShell.
 *
 * Uses the same registry approach as CMD but with native PowerShell commands.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_show_desktop_icons_powershell(args) {
  try {
    // Modify registry to show icons by setting HideIcons to 0
    const commands = [
      'Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Name "HideIcons" -Value 0 -Type DWord',
      'Stop-Process -Name explorer -Force; Start-Process explorer'
    ];

    for (const cmd of commands) {
      execSync(`powershell -Command "${cmd}"`, { stdio: 'inherit' });
    }

    console.log('Desktop icons are now visible.');
    console.log('To hide them again, run: hide-desktop-icons');
  } catch (error) {
    console.error('Error: Could not show desktop icons.');
    console.error('');
    console.error('You can manually show desktop icons by:');
    console.error('1. Right-click on the desktop');
    console.error('2. Select "View"');
    console.error('3. Check "Show desktop icons"');
    process.exit(1);
  }
}

/**
 * Show desktop icons from Git Bash on Windows.
 *
 * Git Bash runs in Windows, so we use the Windows approach via PowerShell.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_show_desktop_icons_gitbash(args) {
  try {
    // Use PowerShell from Git Bash to modify registry
    const psCommand = 'Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Name "HideIcons" -Value 0 -Type DWord; Stop-Process -Name explorer -Force; Start-Process explorer';

    execSync(`powershell.exe -Command "${psCommand}"`, { stdio: 'inherit' });

    console.log('Desktop icons are now visible.');
    console.log('To hide them again, run: hide-desktop-icons');
  } catch (error) {
    console.error('Error: Could not show desktop icons.');
    console.error('');
    console.error('You can manually show desktop icons by:');
    console.error('1. Right-click on the desktop');
    console.error('2. Select "View"');
    console.error('3. Check "Show desktop icons"');
    process.exit(1);
  }
}

/**
 * Main entry point - detects environment and executes appropriate implementation.
 *
 * The "show-desktop-icons" command shows all icons on the desktop surface.
 * This is the counterpart to "hide-desktop-icons" and restores normal desktop
 * icon visibility after they have been hidden.
 *
 * Use cases:
 * - Restoring desktop icons after hiding them for a presentation
 * - Re-enabling icons after a clean desktop screenshot
 * - Returning to normal desktop appearance
 *
 * The desktop files themselves are always present in ~/Desktop - this command
 * only controls whether they are visually rendered on the desktop surface.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_show_desktop_icons(args) {
  const platform = os.detect();

  const handlers = {
    'macos': do_show_desktop_icons_macos,
    'ubuntu': do_show_desktop_icons_ubuntu,
    'debian': do_show_desktop_icons_ubuntu,
    'raspbian': do_show_desktop_icons_raspbian,
    'amazon_linux': do_show_desktop_icons_amazon_linux,
    'rhel': do_show_desktop_icons_amazon_linux,
    'fedora': do_show_desktop_icons_ubuntu,
    'linux': do_show_desktop_icons_ubuntu,
    'wsl': do_show_desktop_icons_ubuntu,
    'cmd': do_show_desktop_icons_cmd,
    'windows': do_show_desktop_icons_cmd,
    'powershell': do_show_desktop_icons_powershell,
    'gitbash': do_show_desktop_icons_gitbash
  };

  const handler = handlers[platform.type];
  if (!handler) {
    console.error(`Platform '${platform.type}' is not supported for this command.`);
    console.error('');
    console.error('Supported platforms:');
    console.error('  - macOS');
    console.error('  - Ubuntu, Debian, and other Linux distributions with GNOME');
    console.error('  - Raspberry Pi OS');
    console.error('  - Windows (CMD, PowerShell, Git Bash)');
    process.exit(1);
  }

  await handler(args);
}

module.exports = {
  main: do_show_desktop_icons,
  do_show_desktop_icons,
  do_show_desktop_icons_nodejs,
  do_show_desktop_icons_macos,
  do_show_desktop_icons_ubuntu,
  do_show_desktop_icons_raspbian,
  do_show_desktop_icons_amazon_linux,
  do_show_desktop_icons_cmd,
  do_show_desktop_icons_powershell,
  do_show_desktop_icons_gitbash
};

if (require.main === module) {
  do_show_desktop_icons(process.argv.slice(2));
}
