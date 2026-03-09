'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const DEVUTILS_DIR = path.join(os.homedir(), '.devutils');
const CONFIG_FILE = path.join(DEVUTILS_DIR, 'config.json');

const meta = {
  description: 'Pull config from remote backup and apply locally, or import from a local file.',
  arguments: [],
  flags: [
    { name: 'file', type: 'string', description: 'Import from a local file instead of remote backup' },
    { name: 'profile', type: 'string', description: 'Import a specific profile from the backup' }
  ]
};

/**
 * The config file keys and their mapping in the export bundle.
 * Each entry maps a local filename to the bundle property name.
 */
const FILES_TO_IMPORT = {
  'config.json': 'config',
  'aliases.json': 'aliases',
  'ai.json': 'ai',
  'plugins.json': 'plugins'
};

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
 * Write imported config data to ~/.devutils/.
 * Only writes files that have data (skips null entries).
 *
 * @param {object} bundle - The import bundle with config, aliases, ai, plugins keys.
 * @returns {number} The number of files written.
 */
function writeImportedFiles(bundle) {
  fs.mkdirSync(DEVUTILS_DIR, { recursive: true });

  let imported = 0;
  for (const [filename, key] of Object.entries(FILES_TO_IMPORT)) {
    const data = bundle[key];
    if (data) {
      fs.writeFileSync(
        path.join(DEVUTILS_DIR, filename),
        JSON.stringify(data, null, 2) + '\n'
      );
      imported++;
    }
  }

  return imported;
}

/**
 * Write the sync timestamp after a successful import.
 *
 * @param {string} profileName - The profile that was imported.
 */
function writeSyncTimestamp(profileName) {
  const syncPath = path.join(DEVUTILS_DIR, 'sync.json');
  const syncData = {
    lastSync: new Date().toISOString(),
    direction: 'import',
    profile: profileName
  };
  fs.writeFileSync(syncPath, JSON.stringify(syncData, null, 2) + '\n');
}

/**
 * Print the next-steps reminder after a successful import.
 *
 * @param {object} context - CLI context (output).
 */
function printNextSteps(context) {
  context.output.info('');
  context.output.info('Next steps:');
  context.output.info('  1. Run "dev alias sync" to rebuild alias wrapper scripts');
  context.output.info('  2. Run "dev status" to verify your configuration');
}

/**
 * Run the config import command.
 * Supports two modes:
 * - File mode (--file): Reads a JSON export file from disk and writes config locally.
 * - Remote mode (default): Pulls config from a GitHub repo or gist based on backup settings.
 *
 * @param {object} args - Parsed CLI arguments (positional, flags).
 * @param {object} context - CLI context (output, prompt, errors).
 */
async function run(args, context) {
  const github = require('../../lib/github');

  // --- File import mode ---
  if (args.flags.file) {
    const filePath = path.resolve(args.flags.file);
    if (!fs.existsSync(filePath)) {
      context.output.error(`File not found: ${filePath}`);
      return;
    }

    let bundle;
    try {
      bundle = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (err) {
      context.output.error('Invalid JSON file: ' + err.message);
      return;
    }

    // Validate the bundle has expected fields
    if (!bundle.config) {
      context.output.error('Invalid export file: missing config data.');
      return;
    }

    const imported = writeImportedFiles(bundle);
    const profileName = bundle.profile || 'default';

    context.output.info(`Config imported from ${filePath} (${imported} file(s)).`);
    writeSyncTimestamp(profileName);
    printNextSteps(context);
    return;
  }

  // --- Remote import mode ---
  // Read current config to get backup settings
  const config = readConfigFile('config.json');
  if (!config || !config.backup) {
    context.output.info('No backup storage configured.');
    context.output.info('Run "dev config init" to set up backup storage, or use --file to import from a local file.');
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
      const pullResult = await github.pullRepo(repoDir);
      if (!pullResult.success) {
        context.output.error('Failed to pull latest config: ' + pullResult.error);
        return;
      }
    } else {
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

    // List available profiles
    const profilesDir = path.join(repoDir, 'profiles');
    if (!fs.existsSync(profilesDir)) {
      context.output.info('No profiles found in backup repository.');
      return;
    }

    const profiles = fs.readdirSync(profilesDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);

    if (profiles.length === 0) {
      context.output.info('No profiles found in backup repository.');
      return;
    }

    // Select profile
    let profileName = args.flags.profile;
    if (!profileName) {
      if (profiles.length === 1) {
        profileName = profiles[0];
      } else {
        // Let the user pick
        profileName = await context.prompt.choose(
          'Which profile do you want to import?',
          profiles
        );
      }
    }

    const profileDir = path.join(profilesDir, profileName);
    if (!fs.existsSync(profileDir)) {
      context.output.info(`Profile "${profileName}" not found in backup.`);
      context.output.info(`Available profiles: ${profiles.join(', ')}`);
      return;
    }

    // Copy config files from the profile directory into ~/.devutils/
    const filesToCopy = ['config.json', 'aliases.json', 'ai.json', 'plugins.json'];
    let imported = 0;

    for (const filename of filesToCopy) {
      const sourcePath = path.join(profileDir, filename);
      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, path.join(DEVUTILS_DIR, filename));
        imported++;
      }
    }

    context.output.info(`Imported ${imported} config file(s) from profile "${profileName}".`);
    writeSyncTimestamp(profileName);
    printNextSteps(context);

  } else if (backend === 'gist') {
    if (!location) {
      context.output.info('No backup gist configured.');
      context.output.info('Run "dev config init --force" to set up a backup gist.');
      return;
    }

    // Check gh authentication
    const isAuth = await github.isAuthenticated();
    if (!isAuth) {
      context.output.info('Not authenticated with GitHub. Run: gh auth login');
      return;
    }

    const gistResult = await github.getGist(location);
    if (!gistResult.success) {
      context.output.error('Failed to read gist: ' + gistResult.error);
      return;
    }

    // List available profiles (each is a .json file in the gist)
    const profileFiles = Object.keys(gistResult.files).filter(f => f.endsWith('.json'));
    const profiles = profileFiles.map(f => f.replace('.json', ''));

    if (profiles.length === 0) {
      context.output.info('No profiles found in backup gist.');
      return;
    }

    let profileName = args.flags.profile;
    if (!profileName) {
      if (profiles.length === 1) {
        profileName = profiles[0];
      } else {
        profileName = await context.prompt.choose(
          'Which profile do you want to import?',
          profiles
        );
      }
    }

    const filename = profileName + '.json';
    const content = gistResult.files[filename];
    if (!content) {
      context.output.info(`Profile "${profileName}" not found in gist.`);
      context.output.info(`Available profiles: ${profiles.join(', ')}`);
      return;
    }

    let bundle;
    try {
      bundle = JSON.parse(content);
    } catch {
      context.output.error('Failed to parse profile data from gist.');
      return;
    }

    const imported = writeImportedFiles(bundle);
    context.output.info(`Imported ${imported} config file(s) from profile "${profileName}".`);
    writeSyncTimestamp(profileName);
    printNextSteps(context);

  } else {
    context.output.info(`Unknown backup backend: ${backend}`);
    context.output.info('Run "dev config init --force" to reconfigure backup storage.');
  }
}

module.exports = { meta, run };
