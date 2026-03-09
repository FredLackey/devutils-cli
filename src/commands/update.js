'use strict';

const shell = require('../lib/shell');

const meta = {
  description: 'Self-update to the latest published version.',
  arguments: [],
  flags: [
    { name: 'check', description: 'Check for updates without installing' },
  ],
};

/**
 * Get the current installed version from package.json.
 * @returns {string}
 */
function getCurrentVersion() {
  const pkg = require('../../package.json');
  return pkg.version;
}

/**
 * Get the latest version from the npm registry.
 * @returns {Promise<string|null>}
 */
async function getLatestVersion() {
  const result = await shell.exec('npm view @fredlackey/devutils version');
  if (result.exitCode !== 0) return null;
  return result.stdout.trim() || null;
}

/**
 * Compare two semver strings. Returns true if latest is newer than current.
 * @param {string} latest
 * @param {string} current
 * @returns {boolean}
 */
function isNewer(latest, current) {
  const l = latest.split('.').map(Number);
  const c = current.split('.').map(Number);
  for (let i = 0; i < Math.max(l.length, c.length); i++) {
    const lv = l[i] || 0;
    const cv = c[i] || 0;
    if (lv > cv) return true;
    if (lv < cv) return false;
  }
  return false;
}

async function run(args, context) {
  if (!shell.commandExists('npm')) {
    context.errors.throwError(500, 'npm is not available on this system. Install Node.js and npm first.', 'update');
    return;
  }

  const current = getCurrentVersion();
  context.output.info(`Current version: ${current}`);
  context.output.info('Checking for updates...');

  const latest = await getLatestVersion();
  if (!latest) {
    context.errors.throwError(500, 'Could not reach the npm registry. Check your network connection.', 'update');
    return;
  }

  if (!isNewer(latest, current)) {
    const result = {
      current,
      latest,
      updateAvailable: false,
      message: `Already on the latest version (${current}).`,
    };
    context.output.out(result);
    return;
  }

  // Update available
  if (args.flags.check) {
    const result = {
      current,
      latest,
      updateAvailable: true,
      message: `Update available: ${current} -> ${latest}. Run "dev update" to install.`,
    };
    context.output.out(result);
    return;
  }

  // Perform the update
  context.output.info(`Updating from ${current} to ${latest}...`);

  const installResult = await shell.exec('npm install -g @fredlackey/devutils@latest');

  if (installResult.exitCode !== 0) {
    const msg = installResult.stderr || '';
    if (msg.includes('EACCES') || msg.includes('permission')) {
      context.errors.throwError(403, 'Permission denied. Try running with sudo: sudo dev update', 'update');
      return;
    }
    context.errors.throwError(500, `Update failed: ${msg}`, 'update');
    return;
  }

  const result = {
    previous: current,
    current: latest,
    updateAvailable: false,
    message: `Updated to ${latest}. Restart your terminal to use the new version.`,
  };
  context.output.out(result);
}

module.exports = { meta, run };
