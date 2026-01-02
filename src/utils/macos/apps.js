#!/usr/bin/env node

/**
 * macOS Application Detection Utilities
 *
 * macOS-specific utilities for detecting installed GUI applications.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const shell = require('../common/shell');

/**
 * Standard application directories on macOS
 */
const APP_DIRECTORIES = [
  '/Applications',
  path.join(os.homedir(), 'Applications')
];

/**
 * Checks if an app exists in /Applications or ~/Applications
 * @param {string} appName - The application name (with or without .app extension)
 * @returns {boolean}
 */
function isAppInstalled(appName) {
  const bundlePath = getAppBundlePath(appName);
  return bundlePath !== null;
}

/**
 * Returns the full path to an .app bundle
 * @param {string} appName - The application name (with or without .app extension)
 * @returns {string|null}
 */
function getAppBundlePath(appName) {
  // Normalize app name - add .app if not present
  const normalizedName = appName.endsWith('.app') ? appName : `${appName}.app`;

  // Also try common variations
  const variations = [
    normalizedName,
    // Handle cases like "Visual Studio Code" vs "Visual Studio Code.app"
    appName.replace(/\.app$/, '') + '.app'
  ];

  // Special case mappings for common apps
  const appMappings = {
    'vscode': 'Visual Studio Code.app',
    'code': 'Visual Studio Code.app',
    'visual-studio-code': 'Visual Studio Code.app',
    'chrome': 'Google Chrome.app',
    'google-chrome': 'Google Chrome.app',
    'firefox': 'Firefox.app',
    'slack': 'Slack.app',
    'spotify': 'Spotify.app',
    'iterm': 'iTerm.app',
    'iterm2': 'iTerm.app'
  };

  const lowercaseName = appName.toLowerCase().replace(/\.app$/, '');
  if (appMappings[lowercaseName]) {
    variations.push(appMappings[lowercaseName]);
  }

  for (const appDir of APP_DIRECTORIES) {
    for (const variant of variations) {
      const fullPath = path.join(appDir, variant);
      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
    }
  }

  return null;
}

/**
 * Reads version from an app's Info.plist
 * @param {string} appName - The application name
 * @returns {string|null}
 */
function getAppVersion(appName) {
  const bundlePath = getAppBundlePath(appName);
  if (!bundlePath) {
    return null;
  }

  const infoPlistPath = path.join(bundlePath, 'Contents', 'Info.plist');
  if (!fs.existsSync(infoPlistPath)) {
    return null;
  }

  try {
    // Use PlistBuddy to read the version (more reliable than parsing XML)
    const result = shell.execSync(
      `/usr/libexec/PlistBuddy -c "Print CFBundleShortVersionString" "${infoPlistPath}"`
    );
    if (result) {
      return result.trim();
    }

    // Fallback: try CFBundleVersion
    const bundleVersion = shell.execSync(
      `/usr/libexec/PlistBuddy -c "Print CFBundleVersion" "${infoPlistPath}"`
    );
    if (bundleVersion) {
      return bundleVersion.trim();
    }
  } catch {
    // Fallback: try to parse the plist directly
    try {
      const plistContent = fs.readFileSync(infoPlistPath, 'utf8');
      const versionMatch = plistContent.match(
        /<key>CFBundleShortVersionString<\/key>\s*<string>([^<]+)<\/string>/
      );
      if (versionMatch) {
        return versionMatch[1];
      }
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Returns a list of installed GUI applications
 * @returns {string[]}
 */
function listInstalledApps() {
  const apps = [];

  for (const appDir of APP_DIRECTORIES) {
    if (!fs.existsSync(appDir)) {
      continue;
    }

    try {
      const entries = fs.readdirSync(appDir);
      for (const entry of entries) {
        if (entry.endsWith('.app')) {
          apps.push(entry.replace(/\.app$/, ''));
        }
      }
    } catch {
      continue;
    }
  }

  return apps.sort();
}

/**
 * Gets the bundle identifier for an application
 * @param {string} appName - The application name
 * @returns {string|null}
 */
function getBundleIdentifier(appName) {
  const bundlePath = getAppBundlePath(appName);
  if (!bundlePath) {
    return null;
  }

  const infoPlistPath = path.join(bundlePath, 'Contents', 'Info.plist');
  if (!fs.existsSync(infoPlistPath)) {
    return null;
  }

  try {
    const result = shell.execSync(
      `/usr/libexec/PlistBuddy -c "Print CFBundleIdentifier" "${infoPlistPath}"`
    );
    return result ? result.trim() : null;
  } catch {
    return null;
  }
}

/**
 * Opens an application
 * @param {string} appName - The application name
 * @returns {Promise<boolean>}
 */
async function openApp(appName) {
  const bundlePath = getAppBundlePath(appName);
  if (!bundlePath) {
    return false;
  }

  const result = await shell.exec(`open "${bundlePath}"`);
  return result.code === 0;
}

/**
 * Checks if an application is currently running
 * @param {string} appName - The application name
 * @returns {Promise<boolean>}
 */
async function isAppRunning(appName) {
  const result = await shell.exec(`pgrep -x "${appName}"`);
  return result.code === 0;
}

/**
 * Quits an application gracefully
 * @param {string} appName - The application name
 * @returns {Promise<boolean>}
 */
async function quitApp(appName) {
  const result = await shell.exec(
    `osascript -e 'tell application "${appName}" to quit'`
  );
  return result.code === 0;
}

module.exports = {
  isAppInstalled,
  getAppBundlePath,
  getAppVersion,
  listInstalledApps,
  getBundleIdentifier,
  openApp,
  isAppRunning,
  quitApp
};
