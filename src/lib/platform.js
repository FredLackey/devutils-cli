'use strict';

const fs = require('fs');

/**
 * Cached detection result. Set on first call to detect().
 * The OS doesn't change while the process is running, so we only detect once.
 * @type {{ type: string, arch: string, packageManager: string|null }|null}
 */
let cached = null;

/**
 * Lazy-loading lookup for platform helper modules.
 * Each entry is a function that requires the platform file only when called.
 * Other modules should never import platform files directly -- always go
 * through platform.js using getHelper().
 */
const helpers = {
  'macos': () => require('./platforms/macos'),
  'ubuntu': () => require('./platforms/ubuntu'),
  'raspbian': () => require('./platforms/raspbian'),
  'amazon-linux': () => require('./platforms/amazon-linux'),
  'windows': () => require('./platforms/windows'),
  'gitbash': () => require('./platforms/gitbash'),
};

/**
 * Reads /etc/os-release and returns the value of the ID= line.
 * This tells us which Linux distro is running (e.g. 'ubuntu', 'raspbian', 'amzn').
 * @returns {string|null} The distro ID in lowercase, or null if it can't be determined.
 */
function getLinuxDistroId() {
  try {
    const content = fs.readFileSync('/etc/os-release', 'utf8');
    const match = content.match(/^ID=["']?([^"'\n]+)["']?/m);
    return match ? match[1].toLowerCase() : null;
  } catch {
    return null;
  }
}

/**
 * Detects the current platform and returns an object describing the OS type,
 * CPU architecture, and default package manager.
 *
 * Results are cached after the first call. Calling detect() multiple times
 * returns the same object reference.
 *
 * @returns {{ type: string, arch: string, packageManager: string|null }}
 *   - type: 'macos', 'ubuntu', 'raspbian', 'amazon-linux', 'windows', 'gitbash', or 'linux' (unknown)
 *   - arch: CPU architecture string from process.arch (e.g. 'x64', 'arm64')
 *   - packageManager: 'brew', 'apt', 'dnf', 'yum', 'choco', 'manual', or null
 */
function detect() {
  if (cached) {
    return cached;
  }

  const arch = process.arch;
  let type = 'linux';
  let packageManager = null;

  if (process.platform === 'darwin') {
    type = 'macos';
    packageManager = 'brew';
  } else if (process.platform === 'win32') {
    // Git Bash sets the MSYSTEM environment variable (e.g. 'MINGW64').
    // If it's set, we're running inside Git Bash. Otherwise, native Windows.
    if (process.env.MSYSTEM) {
      type = 'gitbash';
      packageManager = 'manual';
    } else {
      type = 'windows';
      packageManager = 'choco';
    }
  } else if (process.platform === 'linux') {
    const distroId = getLinuxDistroId();

    if (distroId === 'ubuntu') {
      type = 'ubuntu';
      packageManager = 'apt';
    } else if (distroId === 'raspbian') {
      type = 'raspbian';
      packageManager = 'apt';
    } else if (distroId === 'amzn') {
      type = 'amazon-linux';
      // Use dnf if available (AL2023+), otherwise fall back to yum
      packageManager = fs.existsSync('/usr/bin/dnf') ? 'dnf' : 'yum';
    } else {
      // Unknown Linux distro -- don't crash, just report what we know
      type = 'linux';
      packageManager = null;
    }
  }

  cached = { type, arch, packageManager };
  return cached;
}

/**
 * Returns the platform-specific helper module for the detected platform.
 * The helper module exports functions like isInstalled(), getAppPaths(), etc.
 *
 * @returns {object|null} The helper module, or null if the platform has no helper.
 */
function getHelper() {
  const { type } = detect();
  const loader = helpers[type];
  return loader ? loader() : null;
}

module.exports = { detect, getHelper };
