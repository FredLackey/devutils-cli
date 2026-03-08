#!/usr/bin/env node

/**
 * Display and GUI Detection Utilities
 *
 * Platform-agnostic utilities for detecting display server availability.
 * Used to determine if GUI applications can be installed/run.
 */

const fs = require('fs');

/**
 * Checks if a display server is available
 * On macOS: Always true (Aqua/Quartz is always present)
 * On Windows: Always true (Windows Desktop is always present)
 * On Linux: Checks for X11 or Wayland display
 * @returns {boolean}
 */
function hasDisplay() {
  const platform = process.platform;

  // macOS always has a display (Aqua/Quartz)
  if (platform === 'darwin') {
    return true;
  }

  // Windows always has a display (unless running as a service, which is rare)
  if (platform === 'win32') {
    return true;
  }

  // Linux: check for X11 or Wayland
  if (platform === 'linux') {
    return hasX11Display() || hasWaylandDisplay();
  }

  return false;
}

/**
 * Checks if running in a headless environment (no GUI)
 * @returns {boolean}
 */
function isHeadless() {
  return !hasDisplay();
}

/**
 * Checks if X11 display is available
 * @returns {boolean}
 */
function hasX11Display() {
  // Check DISPLAY environment variable
  if (process.env.DISPLAY) {
    return true;
  }

  // Check if X server socket exists
  const x11SocketPath = '/tmp/.X11-unix';
  if (fs.existsSync(x11SocketPath)) {
    try {
      const sockets = fs.readdirSync(x11SocketPath);
      return sockets.length > 0;
    } catch {
      return false;
    }
  }

  return false;
}

/**
 * Checks if Wayland display is available
 * @returns {boolean}
 */
function hasWaylandDisplay() {
  // Check WAYLAND_DISPLAY environment variable
  if (process.env.WAYLAND_DISPLAY) {
    return true;
  }

  // Check if Wayland socket exists in XDG_RUNTIME_DIR
  const runtimeDir = process.env.XDG_RUNTIME_DIR;
  if (runtimeDir) {
    const waylandSocketPath = `${runtimeDir}/wayland-0`;
    if (fs.existsSync(waylandSocketPath)) {
      return true;
    }
  }

  return false;
}

/**
 * Gets the type of display server in use
 * @returns {'aqua'|'windows'|'x11'|'wayland'|null}
 */
function getDisplayType() {
  const platform = process.platform;

  if (platform === 'darwin') {
    return 'aqua';
  }

  if (platform === 'win32') {
    return 'windows';
  }

  if (platform === 'linux') {
    if (hasWaylandDisplay()) {
      return 'wayland';
    }
    if (hasX11Display()) {
      return 'x11';
    }
  }

  return null;
}

/**
 * Gets the display variable value (DISPLAY or WAYLAND_DISPLAY)
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
 * Checks if SSH session has X11 forwarding enabled
 * @returns {boolean}
 */
function hasX11Forwarding() {
  // Check if we're in an SSH session with DISPLAY set
  if (process.env.SSH_CONNECTION && process.env.DISPLAY) {
    // DISPLAY typically looks like "localhost:10.0" for X11 forwarding
    const display = process.env.DISPLAY;
    return display.includes(':');
  }
  return false;
}

module.exports = {
  hasDisplay,
  isHeadless,
  hasX11Display,
  hasWaylandDisplay,
  getDisplayType,
  getDisplayVariable,
  hasX11Forwarding
};
