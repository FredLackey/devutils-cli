'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const DEVUTILS_DIR = path.join(os.homedir(), '.devutils');
const CONFIG_FILE = path.join(DEVUTILS_DIR, 'config.json');

const meta = {
  description: 'Push the current config profile to the remote backup (repo or gist), or export to a local file.',
  arguments: [],
  flags: [
    { name: 'file', type: 'string', description: 'Export to a local file instead of remote backup' },
    { name: 'profile', type: 'string', description: 'Export a specific profile (defaults to the active profile)' }
  ]
};

/**
 * The list of config files that are included in an export.
 * Auth tokens are NOT included -- they are sensitive and should be
 * re-created on new machines via "dev auth login".
 */
const FILES_TO_EXPORT = ['config.json', 'aliases.json', 'ai.json', 'plugins.json'];

/**
 * Read a config file from ~/.devutils/ if it exists.
 * Returns the parsed content, or null if the file is missing or invalid JSON.
 *
 * @param {string} filename - The filename to read (e.g., 'config.json').
 * @returns {object|null} The parsed JSON content, or null.
 */
function readConfigFile(filename) {
  const filePath = path.join(DEVUTILS_DIR, filename);
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

/**
 * Write the sync timestamp after a successful export.
 * This is used by future sync-check features to know when the last
 * export or import happened.
 *
 * @param {string} profileName - The profile that was exported.
 */
function writeSyncTimestamp(profileName) {
  const syncPath = path.join(DEVUTILS_DIR, 'sync.json');
  const syncData = {
    lastSync: new Date().toISOString(),
    direction: 'export',
    profile: profileName
  };
  fs.writeFileSync(syncPath, JSON.stringify(syncData, null, 2) + '\n');
}

/**
 * Run the config export command.
 * Supports two modes:
 * - File mode (--file): Bundles all config files into a single JSON file on disk.
 * - Remote mode (default): Pushes config to a GitHub repo or gist based on backup settings.
 *
 * @param {object} args - Parsed CLI arguments (positional, flags).
 * @param {object} context - CLI context (output, prompt, errors).
 */
async function run(args, context) {
  const github = require('../../lib/github');

  // Read current config to get profile and backup settings
  const config = readConfigFile('config.json');
  const profileName = args.flags.profile || (config && config.profile) || 'default';

  // --- File export mode ---
  if (args.flags.file) {
    const bundle = {
      exportedAt: new Date().toISOString(),
      profile: profileName,
      config: readConfigFile('config.json'),
      aliases: readConfigFile('aliases.json'),
      ai: readConfigFile('ai.json'),
      plugins: readConfigFile('plugins.json')
    };

    const outputPath = path.resolve(args.flags.file);
    fs.writeFileSync(outputPath, JSON.stringify(bundle, null, 2) + '\n');
    context.output.info(`Config exported to ${outputPath}`);

    writeSyncTimestamp(profileName);
    return;
  }

  // --- Remote export mode ---
  if (!config || !config.backup) {
    context.output.info('No backup storage configured.');
    context.output.info('Run "dev config init" to set up backup storage.');
    return;
  }

  const backend = config.backup.backend;
  const location = config.backup.location;

  if (backend === 'repo') {
    // Check gh authentication
    const isAuth = await github.isAuthenticated();
    if (!isAuth) {
      context.output.info('Not authenticated with GitHub. Run: gh auth login');
      return;
    }

    const cacheDir = path.join(DEVUTILS_DIR, 'cache');
    const repoDir = path.join(cacheDir, 'config-backup');
    fs.mkdirSync(cacheDir, { recursive: true });

    // Clone or pull the repo
    if (fs.existsSync(path.join(repoDir, '.git'))) {
      // Already cloned -- pull latest
      const pullResult = await github.pullRepo(repoDir);
      if (!pullResult.success) {
        context.output.error('Failed to pull latest config: ' + pullResult.error);
        return;
      }
    } else {
      // First time -- need repo location
      if (!location) {
        context.output.info('No backup repository configured.');
        context.output.info('Run "dev config init --force" to set up a backup repository.');
        return;
      }

      const cloneResult = await github.cloneRepo(location, repoDir);
      if (!cloneResult.success) {
        context.output.error('Failed to clone backup repo: ' + cloneResult.error);
        return;
      }
    }

    // Copy config files into the profile directory
    const profileDir = path.join(repoDir, 'profiles', profileName);
    fs.mkdirSync(profileDir, { recursive: true });

    for (const filename of FILES_TO_EXPORT) {
      const sourcePath = path.join(DEVUTILS_DIR, filename);
      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, path.join(profileDir, filename));
      }
    }

    // Push
    const pushResult = await github.pushRepo(
      repoDir,
      `Update profile "${profileName}" - ${new Date().toISOString()}`
    );

    if (!pushResult.success) {
      context.output.error('Failed to push config: ' + pushResult.error);
      return;
    }

    context.output.info(`Config exported to repo (profile: ${profileName}).`);
    writeSyncTimestamp(profileName);

  } else if (backend === 'gist') {
    // Check gh authentication
    const isAuth = await github.isAuthenticated();
    if (!isAuth) {
      context.output.info('Not authenticated with GitHub. Run: gh auth login');
      return;
    }

    // Bundle config files into a single JSON for the gist
    const bundle = {
      config: readConfigFile('config.json'),
      aliases: readConfigFile('aliases.json'),
      ai: readConfigFile('ai.json'),
      plugins: readConfigFile('plugins.json')
    };

    const filename = `${profileName}.json`;
    const content = JSON.stringify(bundle, null, 2);

    if (location) {
      // Update existing gist
      const result = await github.updateGist(location, { [filename]: content });
      if (!result.success) {
        context.output.error('Failed to update gist: ' + result.error);
        return;
      }
      context.output.info(`Config exported to gist (profile: ${profileName}).`);
    } else {
      // Create new gist
      const result = await github.createGist(
        { [filename]: content },
        'DevUtils CLI configuration backup',
        true
      );

      if (!result.success) {
        context.output.error('Failed to create gist: ' + result.error);
        return;
      }

      // Save the gist ID back to config so future exports update the same gist
      config.backup.location = result.id;
      fs.writeFileSync(
        CONFIG_FILE,
        JSON.stringify(config, null, 2) + '\n'
      );

      context.output.info(`Config exported to new gist (profile: ${profileName}).`);
      context.output.info(`Gist URL: ${result.url}`);
    }

    writeSyncTimestamp(profileName);

  } else {
    context.output.info(`Unknown backup backend: ${backend}`);
    context.output.info('Run "dev config init --force" to reconfigure backup storage.');
  }
}

module.exports = { meta, run };
