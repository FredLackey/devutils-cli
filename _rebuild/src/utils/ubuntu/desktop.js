#!/usr/bin/env node

/**
 * Desktop Environment Detection Utilities
 *
 * Linux-specific utilities for detecting desktop environments and display servers.
 * These functions address a Linux-specific concern: Linux has multiple display
 * servers (X11, Wayland) and desktop environments (GNOME, KDE, XFCE, etc.).
 * macOS always uses Aqua/Quartz, and Windows always uses the Windows Desktop.
 */

const fs = require('fs');
const shell = require('../common/shell');

/**
 * Checks if a desktop environment is installed and running
 * @returns {boolean}
 */
function hasDesktop() {
  // Check if any display server is available
  if (isX11() || isWayland()) {
    return true;
  }

  // Check for common desktop environment indicators
  if (process.env.XDG_CURRENT_DESKTOP) {
    return true;
  }

  if (process.env.DESKTOP_SESSION) {
    return true;
  }

  // Check if any desktop environment package is installed
  const desktopPackages = [
    'ubuntu-desktop',
    'kubuntu-desktop',
    'xubuntu-desktop',
    'lubuntu-desktop',
    'gnome-shell',
    'plasma-desktop',
    'xfce4',
    'lxde',
    'mate-desktop'
  ];

  for (const pkg of desktopPackages) {
    const result = shell.execSync(`dpkg -l ${pkg} 2>/dev/null | grep -q "^ii"`);
    if (result !== '') {
      return true;
    }
  }

  return false;
}

/**
 * Returns the desktop environment name
 * @returns {string|null} - Desktop name (gnome, kde, xfce, etc.) or null
 */
function getDesktopEnvironment() {
  // XDG_CURRENT_DESKTOP is the most reliable indicator
  if (process.env.XDG_CURRENT_DESKTOP) {
    const desktop = process.env.XDG_CURRENT_DESKTOP.toLowerCase();

    // Normalize common values
    if (desktop.includes('gnome')) return 'gnome';
    if (desktop.includes('kde') || desktop.includes('plasma')) return 'kde';
    if (desktop.includes('xfce')) return 'xfce';
    if (desktop.includes('lxde')) return 'lxde';
    if (desktop.includes('lxqt')) return 'lxqt';
    if (desktop.includes('mate')) return 'mate';
    if (desktop.includes('cinnamon')) return 'cinnamon';
    if (desktop.includes('unity')) return 'unity';
    if (desktop.includes('budgie')) return 'budgie';
    if (desktop.includes('pantheon')) return 'pantheon';

    return desktop.split(':')[0]; // Take first if multiple (e.g., "ubuntu:GNOME")
  }

  // Check DESKTOP_SESSION as fallback
  if (process.env.DESKTOP_SESSION) {
    const session = process.env.DESKTOP_SESSION.toLowerCase();

    if (session.includes('gnome')) return 'gnome';
    if (session.includes('kde') || session.includes('plasma')) return 'kde';
    if (session.includes('xfce')) return 'xfce';
    if (session.includes('lxde')) return 'lxde';
    if (session.includes('mate')) return 'mate';

    return session;
  }

  // Check GNOME_DESKTOP_SESSION_ID (older GNOME)
  if (process.env.GNOME_DESKTOP_SESSION_ID) {
    return 'gnome';
  }

  // Check KDE_FULL_SESSION
  if (process.env.KDE_FULL_SESSION) {
    return 'kde';
  }

  return null;
}

/**
 * Returns the display server type
 * @returns {'x11'|'wayland'|null}
 */
function getDisplayServer() {
  if (isWayland()) {
    return 'wayland';
  }
  if (isX11()) {
    return 'x11';
  }
  return null;
}

/**
 * Checks if running under X11
 * @returns {boolean}
 */
function isX11() {
  // Check XDG_SESSION_TYPE first (most reliable on modern systems)
  if (process.env.XDG_SESSION_TYPE === 'x11') {
    return true;
  }

  // Check DISPLAY environment variable
  if (process.env.DISPLAY) {
    // Make sure we're not in Wayland with XWayland
    if (process.env.WAYLAND_DISPLAY) {
      return false; // We're in Wayland, DISPLAY is for XWayland compatibility
    }
    return true;
  }

  return false;
}

/**
 * Checks if running under Wayland
 * @returns {boolean}
 */
function isWayland() {
  // Check XDG_SESSION_TYPE first
  if (process.env.XDG_SESSION_TYPE === 'wayland') {
    return true;
  }

  // Check WAYLAND_DISPLAY
  if (process.env.WAYLAND_DISPLAY) {
    return true;
  }

  return false;
}

/**
 * Returns the DISPLAY or WAYLAND_DISPLAY environment value
 * @returns {string|null}
 */
function getDisplayVariable() {
  if (process.env.WAYLAND_DISPLAY) {
    return process.env.WAYLAND_DISPLAY;
  }
  if (process.env.DISPLAY) {
    return process.env.DISPLAY;
  }
  return null;
}

/**
 * Gets the XDG session type
 * @returns {string|null}
 */
function getSessionType() {
  return process.env.XDG_SESSION_TYPE || null;
}

/**
 * Gets the current session ID
 * @returns {string|null}
 */
function getSessionId() {
  return process.env.XDG_SESSION_ID || null;
}

/**
 * Checks if running in a virtual terminal (TTY) without GUI
 * @returns {boolean}
 */
function isTTY() {
  // XDG_SESSION_TYPE is 'tty' for virtual terminals
  if (process.env.XDG_SESSION_TYPE === 'tty') {
    return true;
  }

  // Check if TERM indicates a TTY
  const term = process.env.TERM || '';
  if (term === 'linux' || term.startsWith('vt')) {
    return true;
  }

  return false;
}

/**
 * Gets the screen resolution (requires xrandr or similar)
 * @returns {Promise<{ width: number, height: number }|null>}
 */
async function getScreenResolution() {
  if (isX11()) {
    const result = await shell.exec('xrandr 2>/dev/null | grep "\\*" | head -1');
    if (result.code === 0 && result.stdout) {
      const match = result.stdout.match(/(\d+)x(\d+)/);
      if (match) {
        return {
          width: parseInt(match[1], 10),
          height: parseInt(match[2], 10)
        };
      }
    }
  }

  if (isWayland()) {
    // Try wlr-randr for wlroots-based compositors
    const result = await shell.exec('wlr-randr 2>/dev/null | grep "current" | head -1');
    if (result.code === 0 && result.stdout) {
      const match = result.stdout.match(/(\d+)x(\d+)/);
      if (match) {
        return {
          width: parseInt(match[1], 10),
          height: parseInt(match[2], 10)
        };
      }
    }
  }

  return null;
}

/**
 * Gets the GNOME Shell version (if running GNOME)
 * @returns {Promise<string|null>}
 */
async function getGnomeVersion() {
  if (getDesktopEnvironment() !== 'gnome') {
    return null;
  }

  const result = await shell.exec('gnome-shell --version 2>/dev/null');
  if (result.code === 0) {
    const match = result.stdout.match(/GNOME Shell (\d+\.\d+\.?\d*)/);
    return match ? match[1] : null;
  }
  return null;
}

/**
 * Gets the KDE Plasma version (if running KDE)
 * @returns {Promise<string|null>}
 */
async function getKdeVersion() {
  if (getDesktopEnvironment() !== 'kde') {
    return null;
  }

  const result = await shell.exec('plasmashell --version 2>/dev/null');
  if (result.code === 0) {
    const match = result.stdout.match(/plasmashell (\d+\.\d+\.?\d*)/);
    return match ? match[1] : null;
  }
  return null;
}

module.exports = {
  hasDesktop,
  getDesktopEnvironment,
  getDisplayServer,
  isX11,
  isWayland,
  getDisplayVariable,
  getSessionType,
  getSessionId,
  isTTY,
  getScreenResolution,
  getGnomeVersion,
  getKdeVersion
};
