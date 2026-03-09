'use strict';

const os = require('os');
const path = require('path');
const fs = require('fs');

/**
 * The path to the DevUtils configuration directory.
 * All user data, preferences, and plugin data live here.
 * @type {string}
 */
const CONFIG_DIR = path.join(os.homedir(), '.devutils');

/**
 * Creates the ~/.devutils/ directory if it doesn't exist.
 * Idempotent: calling it multiple times has the same effect as calling it once.
 *
 * @returns {string} The config directory path.
 */
function ensureDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  return CONFIG_DIR;
}

/**
 * Returns the full path to a file inside ~/.devutils/.
 * Does not check if the file exists.
 *
 * @param {string} filename - The filename (e.g. 'config.json').
 * @returns {string} The full file path.
 */
function getPath(filename) {
  return path.join(CONFIG_DIR, filename);
}

/**
 * Checks if a file exists in ~/.devutils/.
 *
 * @param {string} filename - The filename to check.
 * @returns {boolean}
 */
function exists(filename) {
  return fs.existsSync(getPath(filename));
}

/**
 * Reads a JSON file from ~/.devutils/ and returns the parsed object.
 * Returns null if the file doesn't exist or can't be parsed.
 *
 * @param {string} filename - The filename to read.
 * @returns {object|null} The parsed JSON object, or null.
 */
function read(filename) {
  const filePath = getPath(filename);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/**
 * Writes a JavaScript object to a JSON file in ~/.devutils/.
 * Creates the directory if it doesn't exist. Uses 2-space indentation
 * and a trailing newline for human-readability.
 *
 * @param {string} filename - The filename to write.
 * @param {object} data - The data to write.
 * @returns {string} The full file path that was written.
 */
function write(filename, data) {
  ensureDir();
  const filePath = getPath(filename);
  const content = JSON.stringify(data, null, 2) + '\n';
  fs.writeFileSync(filePath, content, 'utf8');
  return filePath;
}

/**
 * Deletes a file from ~/.devutils/.
 * Idempotent: does not throw if the file doesn't exist.
 *
 * @param {string} filename - The filename to delete.
 * @returns {string} The full file path (whether it existed or not).
 */
function remove(filename) {
  const filePath = getPath(filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
  return filePath;
}

/**
 * Lists all files (not directories) in ~/.devutils/.
 * Returns an empty array if the directory doesn't exist.
 *
 * @returns {string[]} Array of filenames.
 */
function list() {
  if (!fs.existsSync(CONFIG_DIR)) {
    return [];
  }
  return fs.readdirSync(CONFIG_DIR).filter(entry => {
    const fullPath = path.join(CONFIG_DIR, entry);
    return fs.statSync(fullPath).isFile();
  });
}

module.exports = {
  CONFIG_DIR,
  ensureDir,
  getPath,
  exists,
  read,
  write,
  remove,
  list,
};
