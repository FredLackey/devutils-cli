#!/usr/bin/env node

/**
 * hide-desktop-icons - Hide all icons on the desktop
 *
 * Migrated from legacy dotfiles alias.
 * Original aliases:
 *   macOS:  alias hide-desktop-icons="defaults write com.apple.finder CreateDesktop -bool false && killall Finder"
 *   Ubuntu: alias hide-desktop-icons="gsettings set org.gnome.desktop.background show-desktop-icons false" (commented)
 *
 * This script hides all icons on the desktop. The method varies by platform:
 * - macOS: Modifies Finder preferences to disable the desktop and restarts Finder
 * - Linux (GNOME): Uses gsettings to hide desktop icons
 * - Linux (Other DEs): Uses appropriate desktop environment settings
 * - Windows: Toggles desktop icons visibility through registry or COM objects
 *
 * Note: This is a desktop-specific operation that requires a graphical environment.
 * On headless servers, this command will display an informative message.
 *
 * @module scripts/hide-desktop-icons
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
 * Hiding desktop icons requires OS-level integration that cannot be done in pure Node.js.
 * Each platform has its own mechanism for controlling desktop icon visibility:
 * - macOS uses the defaults command to modify Finder preferences
 * - Linux uses gsettings, dconf, or desktop environment-specific tools
 * - Windows uses registry edits or shell COM objects
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 * @throws {Error} Always throws - this function should not be called directly
 */
async function do_hide_desktop_icons_nodejs(args) {
  // Desktop icon visibility is inherently platform-specific and cannot be
  // implemented in pure Node.js. Each platform function contains the
  // appropriate system calls.
  throw new Error(
    'do_hide_desktop_icons_nodejs should not be called directly. ' +
    'Desktop icon control requires OS-specific commands.'
  );
}

/**
 * Hide desktop icons on macOS by modifying Finder preferences.
 *
 * Uses the original dotfiles approach:
 * 1. Write 'CreateDesktop' preference to false in com.apple.finder
 * 2. Restart Finder to apply the change
 *
 * The CreateDesktop preference controls whether Finder draws icons on the desktop.
 * When set to false, the desktop appears clean with no icons, though the files
 * still exist in ~/Desktop.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_hide_desktop_icons_macos(args) {
  try {
    // Step 1: Write the preference to disable desktop icons
    // This tells Finder not to render any icons on the desktop surface
    execSync('defaults write com.apple.finder CreateDesktop -bool false', {
      stdio: 'inherit'
    });

    // Step 2: Restart Finder to apply the changes
    // Finder must be restarted for the preference change to take effect
    execSync('killall Finder', { stdio: 'inherit' });

    console.log('Desktop icons are now hidden.');
    console.log('To show them again, run: show-desktop-icons');
  } catch (error) {
    console.error('Error: Could not hide desktop icons.');
    console.error('Make sure you have the necessary permissions.');
    process.exit(1);
  }
}

/**
 * Hide desktop icons on Ubuntu using gsettings or dconf.
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
async function do_hide_desktop_icons_ubuntu(args) {
  // Check if we have a desktop environment available
  const hasDesktop = os.isDesktopAvailable();

  if (!hasDesktop) {
    console.log('No desktop environment detected.');
    console.log('This command is designed for graphical environments.');
    console.log('');
    console.log('Desktop icons can only be hidden on systems with a GUI.');
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
  const hideCommands = [
    // Modern GNOME with desktop-icons-ng (ding) extension (Ubuntu 20.04+)
    {
      cmd: 'gsettings set org.gnome.shell.extensions.ding show-home false && gsettings set org.gnome.shell.extensions.ding show-trash false && gsettings set org.gnome.shell.extensions.ding show-volumes false',
      description: 'GNOME desktop-icons-ng extension'
    },
    // Older GNOME with desktop-icons extension
    {
      cmd: 'gsettings set org.gnome.shell.extensions.desktop-icons show-home false && gsettings set org.gnome.shell.extensions.desktop-icons show-trash false',
      description: 'GNOME desktop-icons extension'
    },
    // Legacy GNOME (Ubuntu 18.04 and earlier)
    {
      cmd: 'gsettings set org.gnome.desktop.background show-desktop-icons false',
      description: 'Legacy GNOME desktop icons'
    },
    // Nautilus desktop (some configurations)
    {
      cmd: 'gsettings set org.gnome.nautilus.desktop volumes-visible false && gsettings set org.gnome.nautilus.desktop home-icon-visible false && gsettings set org.gnome.nautilus.desktop trash-icon-visible false',
      description: 'Nautilus desktop'
    }
  ];

  let success = false;

  for (const approach of hideCommands) {
    try {
      execSync(approach.cmd, { stdio: 'pipe', encoding: 'utf8' });
      console.log(`Desktop icons hidden using ${approach.description}.`);
      console.log('To show them again, run: show-desktop-icons');
      success = true;
      break;
    } catch {
      // This approach didn't work, try the next one
      continue;
    }
  }

  if (!success) {
    console.error('Error: Could not hide desktop icons.');
    console.error('');
    console.error('Your desktop environment may not support this operation,');
    console.error('or you may be using a non-standard configuration.');
    console.error('');
    console.error('Tried approaches:');
    for (const approach of hideCommands) {
      console.error(`  - ${approach.description}`);
    }
    process.exit(1);
  }
}

/**
 * Hide desktop icons on Raspberry Pi OS.
 *
 * Raspberry Pi OS typically uses LXDE/LXQT (Raspberry Pi OS Lite) or PIXEL desktop.
 * Desktop icon settings are managed through pcmanfm configuration.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_hide_desktop_icons_raspbian(args) {
  // Check if we have a desktop environment available
  const hasDesktop = os.isDesktopAvailable();

  if (!hasDesktop) {
    console.log('No desktop environment detected.');
    console.log('This command is designed for graphical environments.');
    console.log('');
    console.log('Desktop icons can only be hidden on Raspberry Pi OS with desktop.');
    return;
  }

  // Try different approaches for Raspberry Pi OS
  const hideCommands = [
    // PIXEL desktop uses pcmanfm
    {
      cmd: 'pcmanfm --desktop-pref && echo "Please uncheck show desktop icons in the preferences dialog"',
      description: 'PCManFM desktop preferences',
      interactive: true
    },
    // LXDE desktop
    {
      cmd: 'gsettings set org.gnome.desktop.background show-desktop-icons false',
      description: 'GNOME-compatible settings'
    }
  ];

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
        config = config.replace(/show_documents=1/g, 'show_documents=0');
        config = config.replace(/show_trash=1/g, 'show_trash=0');
        config = config.replace(/show_mounts=1/g, 'show_mounts=0');

        fs.writeFileSync(configPath, config);
        console.log('Desktop icons hidden via PCManFM configuration.');
        console.log('You may need to restart the desktop or log out and back in.');
        console.log('To show them again, run: show-desktop-icons');
        return;
      } catch (err) {
        // Continue to try other methods
      }
    }
  }

  // Fallback: try gsettings if available
  if (isCommandAvailable('gsettings')) {
    try {
      execSync('gsettings set org.gnome.desktop.background show-desktop-icons false', {
        stdio: 'pipe'
      });
      console.log('Desktop icons hidden.');
      console.log('To show them again, run: show-desktop-icons');
      return;
    } catch {
      // gsettings approach didn't work
    }
  }

  console.error('Error: Could not hide desktop icons.');
  console.error('');
  console.error('On Raspberry Pi OS, desktop icons are managed by PCManFM.');
  console.error('You can manually hide them by right-clicking the desktop,');
  console.error('selecting "Desktop Preferences", and unchecking the icon options.');
  process.exit(1);
}

/**
 * Hide desktop icons on Amazon Linux.
 *
 * Amazon Linux is typically used in server environments without a desktop.
 * If a desktop is present (rare), it attempts to use GNOME settings.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_hide_desktop_icons_amazon_linux(args) {
  // Check if we have a desktop environment available
  const hasDesktop = os.isDesktopAvailable();

  if (!hasDesktop) {
    console.log('No desktop environment detected.');
    console.log('Amazon Linux is typically used in server environments.');
    console.log('');
    console.log('Desktop icons can only be hidden on systems with a GUI.');
    return;
  }

  // Try gsettings if available
  if (isCommandAvailable('gsettings')) {
    try {
      execSync('gsettings set org.gnome.desktop.background show-desktop-icons false', {
        stdio: 'inherit'
      });
      console.log('Desktop icons hidden.');
      console.log('To show them again, run: show-desktop-icons');
      return;
    } catch {
      // gsettings approach didn't work
    }
  }

  console.error('Error: Could not hide desktop icons.');
  console.error('This feature requires a desktop environment with GNOME settings.');
  process.exit(1);
}

/**
 * Hide desktop icons on Windows using Command Prompt.
 *
 * Windows desktop icons can be hidden through:
 * 1. Right-click desktop > View > Show desktop icons (manual)
 * 2. Registry modification
 * 3. Shell COM object manipulation
 *
 * This implementation uses a PowerShell command that toggles the desktop icons
 * visibility through the Shell.Application COM object.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_hide_desktop_icons_cmd(args) {
  try {
    // Use PowerShell to toggle desktop icons through COM object
    // This simulates the "Show desktop icons" toggle in the right-click menu
    const psCommand = `
      $shell = New-Object -ComObject Shell.Application
      $shell.ToggleDesktop()
      Start-Sleep -Milliseconds 100
      $shell.ToggleDesktop()
    `;

    // Alternative approach: modify registry to hide icons
    // This is more reliable but requires a restart of Explorer
    const registryCommand = `
      reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" /v HideIcons /t REG_DWORD /d 1 /f
    `;

    execSync(`cmd /c ${registryCommand.trim().replace(/\n/g, ' ')}`, { stdio: 'inherit' });

    // Restart Explorer to apply the changes
    execSync('taskkill /f /im explorer.exe && start explorer.exe', {
      stdio: 'inherit',
      shell: true
    });

    console.log('Desktop icons are now hidden.');
    console.log('To show them again, run: show-desktop-icons');
  } catch (error) {
    console.error('Error: Could not hide desktop icons.');
    console.error('');
    console.error('You can manually hide desktop icons by:');
    console.error('1. Right-click on the desktop');
    console.error('2. Select "View"');
    console.error('3. Uncheck "Show desktop icons"');
    process.exit(1);
  }
}

/**
 * Hide desktop icons on Windows using PowerShell.
 *
 * Uses the same registry approach as CMD but with native PowerShell commands.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_hide_desktop_icons_powershell(args) {
  try {
    // Modify registry to hide icons
    const commands = [
      'Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Name "HideIcons" -Value 1 -Type DWord',
      'Stop-Process -Name explorer -Force; Start-Process explorer'
    ];

    for (const cmd of commands) {
      execSync(`powershell -Command "${cmd}"`, { stdio: 'inherit' });
    }

    console.log('Desktop icons are now hidden.');
    console.log('To show them again, run: show-desktop-icons');
  } catch (error) {
    console.error('Error: Could not hide desktop icons.');
    console.error('');
    console.error('You can manually hide desktop icons by:');
    console.error('1. Right-click on the desktop');
    console.error('2. Select "View"');
    console.error('3. Uncheck "Show desktop icons"');
    process.exit(1);
  }
}

/**
 * Hide desktop icons from Git Bash on Windows.
 *
 * Git Bash runs in Windows, so we use the Windows approach via PowerShell.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_hide_desktop_icons_gitbash(args) {
  try {
    // Use PowerShell from Git Bash to modify registry
    const psCommand = 'Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Name "HideIcons" -Value 1 -Type DWord; Stop-Process -Name explorer -Force; Start-Process explorer';

    execSync(`powershell.exe -Command "${psCommand}"`, { stdio: 'inherit' });

    console.log('Desktop icons are now hidden.');
    console.log('To show them again, run: show-desktop-icons');
  } catch (error) {
    console.error('Error: Could not hide desktop icons.');
    console.error('');
    console.error('You can manually hide desktop icons by:');
    console.error('1. Right-click on the desktop');
    console.error('2. Select "View"');
    console.error('3. Uncheck "Show desktop icons"');
    process.exit(1);
  }
}

/**
 * Main entry point - detects environment and executes appropriate implementation.
 *
 * The "hide-desktop-icons" command hides all icons on the desktop surface.
 * This is useful for:
 * - Creating a clean desktop for screenshots or presentations
 * - Reducing visual clutter while keeping files accessible in ~/Desktop
 * - Personal preference for a minimalist workspace
 *
 * The desktop files themselves are NOT deleted - they remain in the Desktop
 * folder and can be accessed through the file manager. Only the visual
 * representation on the desktop surface is hidden.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_hide_desktop_icons(args) {
  const platform = os.detect();

  const handlers = {
    'macos': do_hide_desktop_icons_macos,
    'ubuntu': do_hide_desktop_icons_ubuntu,
    'debian': do_hide_desktop_icons_ubuntu,
    'raspbian': do_hide_desktop_icons_raspbian,
    'amazon_linux': do_hide_desktop_icons_amazon_linux,
    'rhel': do_hide_desktop_icons_amazon_linux,
    'fedora': do_hide_desktop_icons_ubuntu,
    'linux': do_hide_desktop_icons_ubuntu,
    'wsl': do_hide_desktop_icons_ubuntu,
    'cmd': do_hide_desktop_icons_cmd,
    'windows': do_hide_desktop_icons_cmd,
    'powershell': do_hide_desktop_icons_powershell,
    'gitbash': do_hide_desktop_icons_gitbash
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
  main: do_hide_desktop_icons,
  do_hide_desktop_icons,
  do_hide_desktop_icons_nodejs,
  do_hide_desktop_icons_macos,
  do_hide_desktop_icons_ubuntu,
  do_hide_desktop_icons_raspbian,
  do_hide_desktop_icons_amazon_linux,
  do_hide_desktop_icons_cmd,
  do_hide_desktop_icons_powershell,
  do_hide_desktop_icons_gitbash
};

if (require.main === module) {
  do_hide_desktop_icons(process.argv.slice(2));
}
