'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Path to the aliases.json file in the user's .devutils directory.
 * This is the source of truth for all alias definitions.
 * @type {string}
 */
const ALIASES_FILE = path.join(os.homedir(), '.devutils', 'aliases.json');

/**
 * Path to the bin directory where wrapper scripts are generated.
 * This directory should be on the user's PATH.
 * @type {string}
 */
const BIN_DIR = path.join(os.homedir(), '.devutils', 'bin');

/**
 * Reads aliases.json and returns the parsed object.
 * Returns an empty object if the file does not exist or cannot be parsed.
 *
 * @returns {object} A flat object mapping alias names to command strings.
 */
function loadAliases() {
  if (!fs.existsSync(ALIASES_FILE)) {
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(ALIASES_FILE, 'utf8'));
  } catch {
    return {};
  }
}

/**
 * Writes the aliases object to aliases.json.
 * Creates the parent directory if it does not exist.
 *
 * @param {object} aliases - A flat object mapping alias names to command strings.
 */
function saveAliases(aliases) {
  const dir = path.dirname(ALIASES_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(ALIASES_FILE, JSON.stringify(aliases, null, 2) + '\n');
}

/**
 * Generates a wrapper script for an alias in the bin directory.
 * On Unix (macOS, Linux, Git Bash), writes a shell script with exec.
 * On Windows, writes a .cmd file.
 *
 * @param {string} name - The alias name (used as the filename).
 * @param {string} command - The full command the alias maps to.
 * @param {string} binDir - The directory to write the wrapper script into.
 * @param {string} platformType - The platform type from platform.detect().type.
 */
function generateWrapper(name, command, binDir, platformType) {
  if (!fs.existsSync(binDir)) {
    fs.mkdirSync(binDir, { recursive: true });
  }

  if (platformType === 'windows') {
    // Windows .cmd file
    const scriptPath = path.join(binDir, name + '.cmd');
    const content = `@${command} %*\r\n`;
    fs.writeFileSync(scriptPath, content);
  } else {
    // Unix shell script (macOS, Linux, Git Bash)
    const scriptPath = path.join(binDir, name);
    const content = `#!/bin/sh\nexec ${command} "$@"\n`;
    fs.writeFileSync(scriptPath, content, { mode: 0o755 });
  }
}

/**
 * Deletes wrapper scripts for an alias from the bin directory.
 * Removes both Unix (no extension) and Windows (.cmd) formats to handle
 * cross-platform scenarios.
 *
 * @param {string} name - The alias name to delete.
 * @param {string} binDir - The directory containing the wrapper scripts.
 */
function deleteWrapper(name, binDir) {
  const unixPath = path.join(binDir, name);
  const windowsPath = path.join(binDir, name + '.cmd');

  if (fs.existsSync(unixPath)) {
    fs.unlinkSync(unixPath);
  }
  if (fs.existsSync(windowsPath)) {
    fs.unlinkSync(windowsPath);
  }
}

module.exports = {
  ALIASES_FILE,
  BIN_DIR,
  loadAliases,
  saveAliases,
  generateWrapper,
  deleteWrapper,
};
