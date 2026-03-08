#!/usr/bin/env node

/**
 * Operating System Detection Utilities
 *
 * Platform-agnostic utilities for detecting the current operating system,
 * architecture, and distribution. Uses Node.js APIs that work identically
 * on all platforms.
 */

const os = require('os');
const fs = require('fs');
const path = require('path');

/**
 * Detects the current operating system and returns platform details
 * @returns {{ type: string, packageManager: string|null, distro: string|null }}
 */
function detect() {
  const platform = process.platform;
  const result = {
    type: 'unknown',
    packageManager: null,
    distro: null
  };

  if (platform === 'darwin') {
    result.type = 'macos';
    result.packageManager = 'brew';
    result.distro = 'macos';
    return result;
  }

  if (platform === 'win32') {
    // Check for WSL
    if (process.env.WSL_DISTRO_NAME) {
      result.type = 'wsl';
      result.packageManager = 'apt';
      result.distro = process.env.WSL_DISTRO_NAME.toLowerCase();
      return result;
    }
    result.type = 'windows';
    result.packageManager = 'winget';
    result.distro = 'windows';
    return result;
  }

  if (platform === 'linux') {
    // Check for WSL first
    if (process.env.WSL_DISTRO_NAME) {
      result.type = 'wsl';
      result.packageManager = 'apt';
      result.distro = process.env.WSL_DISTRO_NAME.toLowerCase();
      return result;
    }

    // Try to detect Linux distribution
    const distro = getDistro();
    result.distro = distro;

    // Debian-based (Ubuntu, Debian, Raspberry Pi OS)
    if (fs.existsSync('/etc/debian_version')) {
      if (distro === 'raspbian' || distro === 'raspberry') {
        result.type = 'raspbian';
      } else if (distro === 'ubuntu') {
        result.type = 'ubuntu';
      } else {
        result.type = 'debian';
      }
      result.packageManager = 'apt';
      return result;
    }

    // RHEL-based (Amazon Linux, CentOS, Fedora, RHEL)
    // Check for /etc/redhat-release OR /etc/system-release (Amazon Linux 2023 uses system-release)
    if (fs.existsSync('/etc/redhat-release') || fs.existsSync('/etc/system-release')) {
      if (distro === 'amzn' || distro === 'amazon') {
        result.type = 'amazon_linux';
      } else if (distro === 'fedora') {
        result.type = 'fedora';
      } else {
        result.type = 'rhel';
      }
      // Use dnf if available, otherwise yum
      result.packageManager = fs.existsSync('/usr/bin/dnf') ? 'dnf' : 'yum';
      return result;
    }

    // Fallback for unknown Linux
    result.type = 'linux';
    return result;
  }

  return result;
}

/**
 * Checks if running on Windows (native, not WSL)
 * @returns {boolean}
 */
function isWindows() {
  return process.platform === 'win32' && !process.env.WSL_DISTRO_NAME;
}

/**
 * Checks if running on macOS
 * @returns {boolean}
 */
function isMacOS() {
  return process.platform === 'darwin';
}

/**
 * Checks if running on any Linux distribution
 * @returns {boolean}
 */
function isLinux() {
  return process.platform === 'linux';
}

/**
 * Checks if running inside Windows Subsystem for Linux
 * @returns {boolean}
 */
function isWSL() {
  return !!process.env.WSL_DISTRO_NAME;
}

/**
 * Returns the CPU architecture
 * @returns {string} - 'x64', 'arm64', 'ia32', etc.
 */
function getArch() {
  return process.arch;
}

/**
 * For Linux, returns the specific distribution name
 * @returns {string|null} - Distribution name (ubuntu, debian, fedora, etc.) or null
 */
function getDistro() {
  if (process.platform !== 'linux') {
    return null;
  }

  // Try /etc/os-release first (most modern Linux distros)
  const osReleasePath = '/etc/os-release';
  if (fs.existsSync(osReleasePath)) {
    try {
      const content = fs.readFileSync(osReleasePath, 'utf8');
      const idMatch = content.match(/^ID=["']?([^"'\n]+)["']?/m);
      if (idMatch) {
        return idMatch[1].toLowerCase();
      }
    } catch (err) {
      // Fall through to other methods
    }
  }

  // Try /etc/lsb-release (Ubuntu and some others)
  const lsbReleasePath = '/etc/lsb-release';
  if (fs.existsSync(lsbReleasePath)) {
    try {
      const content = fs.readFileSync(lsbReleasePath, 'utf8');
      const idMatch = content.match(/^DISTRIB_ID=["']?([^"'\n]+)["']?/m);
      if (idMatch) {
        return idMatch[1].toLowerCase();
      }
    } catch (err) {
      // Fall through
    }
  }

  return null;
}

/**
 * Returns the home directory path
 * @returns {string}
 */
function getHomeDir() {
  return os.homedir();
}

/**
 * Returns the temporary directory path
 * @returns {string}
 */
function getTempDir() {
  return os.tmpdir();
}

/**
 * Checks if a graphical desktop environment is available on the current system.
 *
 * This function determines whether GUI applications can be displayed:
 * - macOS: Always returns true (Aqua/Quartz desktop is always available)
 * - Windows (native): Always returns true (Windows Desktop is always available)
 * - Git Bash: Always returns true (runs on Windows which has a desktop)
 * - Linux: Checks for X11, Wayland, or installed desktop environment packages
 * - WSL: Checks for WSLg or X server availability via DISPLAY/WAYLAND_DISPLAY
 *
 * Use this function before installing GUI applications to ensure the system
 * can actually display them. Headless servers and containers typically
 * return false.
 *
 * @returns {boolean} True if a desktop environment is available, false otherwise
 *
 * @example
 * const os = require('../utils/common/os');
 * if (!os.isDesktopAvailable()) {
 *   console.log('This tool requires a desktop environment.');
 *   return;
 * }
 */
function isDesktopAvailable() {
  const platform = detect();

  // macOS always has a desktop environment (Aqua/Quartz)
  if (platform.type === 'macos') {
    return true;
  }

  // Windows (native) always has a desktop environment
  if (platform.type === 'windows') {
    return true;
  }

  // Git Bash runs on Windows, which has a desktop
  if (platform.type === 'gitbash') {
    return true;
  }

  // For Linux-based systems (including WSL), check for display availability
  // This covers ubuntu, debian, raspbian, amazon_linux, rhel, fedora, wsl
  if (platform.type === 'wsl' ||
      platform.type === 'ubuntu' ||
      platform.type === 'debian' ||
      platform.type === 'raspbian' ||
      platform.type === 'amazon_linux' ||
      platform.type === 'rhel' ||
      platform.type === 'fedora' ||
      platform.type === 'linux') {

    // Check for Wayland display (modern Linux desktops)
    if (process.env.WAYLAND_DISPLAY) {
      return true;
    }

    // Check for X11 display
    if (process.env.DISPLAY) {
      return true;
    }

    // Check XDG session type (set by display managers)
    const sessionType = process.env.XDG_SESSION_TYPE;
    if (sessionType === 'x11' || sessionType === 'wayland') {
      return true;
    }

    // Check for desktop environment indicators
    if (process.env.XDG_CURRENT_DESKTOP || process.env.DESKTOP_SESSION) {
      return true;
    }

    // For WSL specifically, check for WSLg availability
    // WSLg sets WAYLAND_DISPLAY or DISPLAY when available
    if (platform.type === 'wsl') {
      // WSLg creates /mnt/wslg directory when GUI support is available
      if (fs.existsSync('/mnt/wslg')) {
        return true;
      }
    }

    // No desktop environment detected
    return false;
  }

  // Unknown platform - assume no desktop available
  return false;
}

module.exports = {
  detect,
  isWindows,
  isMacOS,
  isLinux,
  isWSL,
  getArch,
  getDistro,
  getHomeDir,
  getTempDir,
  isDesktopAvailable
};
