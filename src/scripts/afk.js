#!/usr/bin/env node

/**
 * afk - Lock screen or put system to sleep (Away From Keyboard)
 *
 * Migrated from legacy dotfiles alias.
 * Original aliases:
 *   macOS:  alias afk="osascript -e 'tell application \"System Events\" to sleep'"
 *   Ubuntu: alias afk="gnome-screensaver-command --lock"
 *   Raspbian: alias afk="gnome-screensaver-command --lock"
 *
 * This script locks the screen or activates the screensaver, allowing the user
 * to walk away from their computer securely. The exact behavior varies by platform:
 * - macOS: Puts the display to sleep (which triggers screen lock if configured)
 * - Linux with GNOME: Locks the screen using gnome-screensaver
 * - Linux with other DEs: Uses loginctl or other available lock commands
 * - Windows: Locks the workstation
 *
 * @module scripts/afk
 */

const os = require('../utils/common/os');
const { execSync } = require('child_process');

/**
 * Helper function to check if a command exists on the system.
 * Used to detect which screen-locking tool is available.
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
 * Screen locking requires OS-level integration that cannot be done in pure Node.js.
 * Each platform has its own mechanism for locking the screen:
 * - macOS uses AppleScript to communicate with System Events
 * - Linux uses desktop environment-specific commands (gnome-screensaver, loginctl, etc.)
 * - Windows uses the LockWorkStation API via rundll32
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 * @throws {Error} Always throws - this function should not be called directly
 */
async function do_afk_nodejs(args) {
  // Screen locking is inherently platform-specific and cannot be implemented
  // in pure Node.js. Each platform function contains the appropriate system call.
  throw new Error(
    'do_afk_nodejs should not be called directly. ' +
    'Screen locking requires OS-specific commands.'
  );
}

/**
 * Lock screen on macOS using AppleScript.
 *
 * Uses the original dotfiles approach: telling System Events to sleep the display.
 * When the system wakes, it will require the password if "Require password after
 * sleep or screen saver begins" is enabled in System Preferences > Security & Privacy.
 *
 * Alternative approaches that could be used:
 * - pmset displaysleepnow: Puts display to sleep immediately
 * - /System/Library/CoreServices/Menu\ Extras/User.menu/Contents/Resources/CGSession -suspend: Locks screen
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_afk_macos(args) {
  try {
    // Original alias: osascript -e 'tell application "System Events" to sleep'
    // This tells the system to sleep the display, which locks it if password is required
    execSync('osascript -e \'tell application "System Events" to sleep\'', {
      stdio: 'inherit'
    });
  } catch (error) {
    // If the AppleScript approach fails, try the pmset approach
    console.error('AppleScript sleep command failed, trying pmset...');
    try {
      execSync('pmset displaysleepnow', { stdio: 'inherit' });
    } catch (pmsetError) {
      console.error('Error: Could not lock screen or put display to sleep.');
      console.error('Make sure you have the necessary permissions.');
      process.exit(1);
    }
  }
}

/**
 * Lock screen on Ubuntu using available screen lock utilities.
 *
 * Ubuntu may have different lock mechanisms depending on the desktop environment:
 * - GNOME: gnome-screensaver-command --lock (older) or loginctl lock-session
 * - KDE: loginctl lock-session or qdbus
 * - XFCE: xfce4-screensaver-command -l or xdg-screensaver lock
 * - No DE (server): loginctl lock-session
 *
 * This function tries multiple approaches in order of preference.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_afk_ubuntu(args) {
  // Check if we have a desktop environment available
  const hasDesktop = os.isDesktopAvailable();

  if (!hasDesktop) {
    console.log('No desktop environment detected.');
    console.log('This command is designed for graphical environments.');
    console.log('');
    console.log('On a headless server, consider using:');
    console.log('  - screen or tmux to detach your session');
    console.log('  - logout to end your session');
    return;
  }

  // Try various lock commands in order of preference
  const lockCommands = [
    // GNOME (original dotfiles approach)
    { cmd: 'gnome-screensaver-command', args: '--lock', check: 'gnome-screensaver-command' },
    // Modern GNOME/systemd
    { cmd: 'loginctl', args: 'lock-session', check: 'loginctl' },
    // Generic XDG screensaver
    { cmd: 'xdg-screensaver', args: 'lock', check: 'xdg-screensaver' },
    // XFCE
    { cmd: 'xfce4-screensaver-command', args: '-l', check: 'xfce4-screensaver-command' },
    // MATE
    { cmd: 'mate-screensaver-command', args: '--lock', check: 'mate-screensaver-command' },
    // Cinnamon
    { cmd: 'cinnamon-screensaver-command', args: '--lock', check: 'cinnamon-screensaver-command' },
    // i3lock (for i3 users)
    { cmd: 'i3lock', args: '', check: 'i3lock' },
    // KDE
    { cmd: 'qdbus', args: 'org.freedesktop.ScreenSaver /ScreenSaver Lock', check: 'qdbus' }
  ];

  for (const lockMethod of lockCommands) {
    if (isCommandAvailable(lockMethod.check)) {
      try {
        const fullCommand = lockMethod.args
          ? `${lockMethod.cmd} ${lockMethod.args}`
          : lockMethod.cmd;
        execSync(fullCommand, { stdio: 'inherit' });
        return; // Success, exit
      } catch {
        // This method failed, try the next one
        continue;
      }
    }
  }

  // No lock method worked
  console.error('Error: Could not find a screen lock command.');
  console.error('');
  console.error('Tried: gnome-screensaver-command, loginctl, xdg-screensaver,');
  console.error('       xfce4-screensaver-command, mate-screensaver-command,');
  console.error('       cinnamon-screensaver-command, i3lock, qdbus');
  console.error('');
  console.error('Install a screen locker for your desktop environment:');
  console.error('  GNOME: sudo apt install gnome-screensaver');
  console.error('  XFCE:  sudo apt install xfce4-screensaver');
  console.error('  i3:    sudo apt install i3lock');
  process.exit(1);
}

/**
 * Lock screen on Raspberry Pi OS.
 *
 * Raspberry Pi OS is based on Debian and typically uses LXDE or PIXEL desktop.
 * The lock behavior is similar to Ubuntu but with different default DE.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_afk_raspbian(args) {
  // Check if we have a desktop environment available
  const hasDesktop = os.isDesktopAvailable();

  if (!hasDesktop) {
    console.log('No desktop environment detected.');
    console.log('This command is designed for graphical environments.');
    console.log('');
    console.log('On a headless Raspberry Pi, consider using:');
    console.log('  - screen or tmux to detach your session');
    console.log('  - logout to end your session');
    return;
  }

  // Try various lock commands - Raspberry Pi OS may use different DEs
  const lockCommands = [
    // LXDE (common on Raspberry Pi)
    { cmd: 'lxlock', args: '', check: 'lxlock' },
    // XDG screensaver (generic)
    { cmd: 'xdg-screensaver', args: 'lock', check: 'xdg-screensaver' },
    // GNOME (if installed)
    { cmd: 'gnome-screensaver-command', args: '--lock', check: 'gnome-screensaver-command' },
    // Modern systemd
    { cmd: 'loginctl', args: 'lock-session', check: 'loginctl' },
    // i3lock
    { cmd: 'i3lock', args: '', check: 'i3lock' },
    // xscreensaver
    { cmd: 'xscreensaver-command', args: '-lock', check: 'xscreensaver-command' }
  ];

  for (const lockMethod of lockCommands) {
    if (isCommandAvailable(lockMethod.check)) {
      try {
        const fullCommand = lockMethod.args
          ? `${lockMethod.cmd} ${lockMethod.args}`
          : lockMethod.cmd;
        execSync(fullCommand, { stdio: 'inherit' });
        return; // Success, exit
      } catch {
        // This method failed, try the next one
        continue;
      }
    }
  }

  // No lock method worked
  console.error('Error: Could not find a screen lock command.');
  console.error('');
  console.error('Install a screen locker for Raspberry Pi OS:');
  console.error('  sudo apt install lxlock           # For LXDE');
  console.error('  sudo apt install xscreensaver     # XScreensaver');
  console.error('  sudo apt install i3lock           # Lightweight locker');
  process.exit(1);
}

/**
 * Lock screen on Amazon Linux.
 *
 * Amazon Linux is typically used in server environments without a desktop.
 * If a desktop is present, it attempts to use available lock mechanisms.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_afk_amazon_linux(args) {
  // Check if we have a desktop environment available
  const hasDesktop = os.isDesktopAvailable();

  if (!hasDesktop) {
    console.log('No desktop environment detected.');
    console.log('Amazon Linux is typically used in server environments.');
    console.log('');
    console.log('On a headless server, consider using:');
    console.log('  - screen or tmux to detach your session');
    console.log('  - logout to end your session');
    return;
  }

  // Try available lock commands
  const lockCommands = [
    { cmd: 'loginctl', args: 'lock-session', check: 'loginctl' },
    { cmd: 'gnome-screensaver-command', args: '--lock', check: 'gnome-screensaver-command' },
    { cmd: 'xdg-screensaver', args: 'lock', check: 'xdg-screensaver' }
  ];

  for (const lockMethod of lockCommands) {
    if (isCommandAvailable(lockMethod.check)) {
      try {
        const fullCommand = `${lockMethod.cmd} ${lockMethod.args}`;
        execSync(fullCommand, { stdio: 'inherit' });
        return;
      } catch {
        continue;
      }
    }
  }

  console.error('Error: Could not find a screen lock command.');
  console.error('This command requires a desktop environment.');
  process.exit(1);
}

/**
 * Lock workstation on Windows using Command Prompt.
 *
 * Uses rundll32 to call the LockWorkStation function, which is the standard
 * Windows API for locking the computer. This works on all Windows versions.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_afk_cmd(args) {
  try {
    // rundll32 user32.dll,LockWorkStation is the standard way to lock Windows
    execSync('rundll32.exe user32.dll,LockWorkStation', { stdio: 'inherit' });
  } catch (error) {
    console.error('Error: Could not lock the workstation.');
    console.error('Make sure you have the necessary permissions.');
    process.exit(1);
  }
}

/**
 * Lock workstation on Windows using PowerShell.
 *
 * Uses the same rundll32 approach as CMD, but called through PowerShell.
 * This ensures consistency regardless of which Windows shell is being used.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_afk_powershell(args) {
  try {
    // Using rundll32 directly works from PowerShell as well
    execSync('rundll32.exe user32.dll,LockWorkStation', { stdio: 'inherit' });
  } catch (error) {
    console.error('Error: Could not lock the workstation.');
    console.error('Make sure you have the necessary permissions.');
    process.exit(1);
  }
}

/**
 * Lock workstation from Git Bash on Windows.
 *
 * Git Bash runs in Windows, so we use the Windows lock mechanism.
 * The rundll32 command is available in Git Bash's PATH.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_afk_gitbash(args) {
  try {
    // rundll32 is available in Git Bash on Windows
    execSync('rundll32.exe user32.dll,LockWorkStation', { stdio: 'inherit' });
  } catch (error) {
    console.error('Error: Could not lock the workstation.');
    console.error('Make sure you have the necessary permissions.');
    process.exit(1);
  }
}

/**
 * Main entry point - detects environment and executes appropriate implementation.
 *
 * The "afk" (Away From Keyboard) command locks the screen or puts the display
 * to sleep, securing the computer when the user steps away. This is a common
 * developer workflow: lock your screen before leaving your desk.
 *
 * The behavior varies by platform:
 * - macOS: Puts the display to sleep (locks if password required on wake)
 * - Linux: Locks the screen using the desktop environment's lock mechanism
 * - Windows: Locks the workstation immediately
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_afk(args) {
  const platform = os.detect();

  const handlers = {
    'macos': do_afk_macos,
    'ubuntu': do_afk_ubuntu,
    'debian': do_afk_ubuntu,
    'raspbian': do_afk_raspbian,
    'amazon_linux': do_afk_amazon_linux,
    'rhel': do_afk_amazon_linux,
    'fedora': do_afk_ubuntu,
    'linux': do_afk_ubuntu,
    'wsl': do_afk_ubuntu,
    'cmd': do_afk_cmd,
    'windows': do_afk_cmd,
    'powershell': do_afk_powershell,
    'gitbash': do_afk_gitbash
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
  main: do_afk,
  do_afk,
  do_afk_nodejs,
  do_afk_macos,
  do_afk_ubuntu,
  do_afk_raspbian,
  do_afk_amazon_linux,
  do_afk_cmd,
  do_afk_powershell,
  do_afk_gitbash
};

if (require.main === module) {
  do_afk(process.argv.slice(2));
}
