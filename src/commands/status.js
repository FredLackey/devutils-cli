'use strict';

/**
 * status command.
 * An overall health check that shows the current state of the DevUtils
 * installation in a single-screen dashboard. Checks config, machine
 * profile, auth services, aliases, API plugins, and sync status.
 *
 * This command is read-only and never modifies any files. It handles
 * missing files gracefully, showing helpful placeholder messages
 * instead of crashing.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const meta = {
  description: 'Overall health check',
  arguments: [],
  flags: []
};

/**
 * Checks the config.json status. Reports whether the file exists
 * and whether it contains valid JSON.
 *
 * @param {object} config - The context.config module.
 * @returns {{ exists: boolean, valid: boolean }}
 */
function checkConfig(config) {
  if (!config.exists('config.json')) {
    return { exists: false, valid: false };
  }
  const data = config.read('config.json');
  if (data === null) {
    return { exists: true, valid: false };
  }
  return { exists: true, valid: true };
}

/**
 * Checks the machine profile. Reads machines/current.json and pulls
 * out key fields like type, arch, hostname, and packageManager.
 *
 * @param {object} config - The context.config module.
 * @returns {{ detected: boolean, type?: string, arch?: string, hostname?: string, packageManager?: string }}
 */
function checkMachine(config) {
  const profile = config.read('machines/current.json');
  if (!profile) {
    return { detected: false };
  }

  return {
    detected: true,
    type: profile.os ? profile.os.type : (profile.type || 'unknown'),
    arch: profile.arch || 'unknown',
    hostname: profile.hostname || 'unknown',
    packageManager: profile.packageManagers
      ? profile.packageManagers[0] || null
      : (profile.packageManager || null),
  };
}

/**
 * Checks the auth directory for connected services.
 * Each JSON file (excluding subdirectories) represents a connected service.
 *
 * @param {object} config - The context.config module.
 * @returns {{ services: string[], count: number }}
 */
function checkAuth(config) {
  const authDir = config.getPath('auth');
  if (!fs.existsSync(authDir)) {
    return { services: [], count: 0 };
  }

  try {
    const entries = fs.readdirSync(authDir);
    const services = entries
      .filter(entry => {
        const fullPath = path.join(authDir, entry);
        return fs.statSync(fullPath).isFile() && entry.endsWith('.json');
      })
      .map(file => path.basename(file, '.json'));

    return { services, count: services.length };
  } catch {
    return { services: [], count: 0 };
  }
}

/**
 * Checks the aliases.json file for registered aliases.
 *
 * @param {object} config - The context.config module.
 * @returns {{ count: number }}
 */
function checkAliases(config) {
  const data = config.read('aliases.json');
  if (!data) {
    return { count: 0 };
  }

  // Handle both array and object formats
  if (Array.isArray(data)) {
    return { count: data.length };
  }
  return { count: Object.keys(data).length };
}

/**
 * Checks the plugins.json file for installed API plugins.
 *
 * @param {object} config - The context.config module.
 * @returns {{ count: number, plugins: string[] }}
 */
function checkPlugins(config) {
  const data = config.read('plugins.json');
  if (!data) {
    return { count: 0, plugins: [] };
  }

  // Handle both array and object formats
  if (Array.isArray(data)) {
    return { count: data.length, plugins: data };
  }
  const plugins = Object.keys(data);
  return { count: plugins.length, plugins };
}

/**
 * Checks the sync.json file for the last backup timestamp.
 *
 * @param {object} config - The context.config module.
 * @returns {{ lastBackup: string|null }}
 */
function checkSync(config) {
  const data = config.read('sync.json');
  if (!data || !data.lastBackup) {
    return { lastBackup: null };
  }
  return { lastBackup: data.lastBackup };
}

/**
 * Formats a human-readable summary line for the config section.
 *
 * @param {{ exists: boolean, valid: boolean }} configStatus - The config check result.
 * @returns {string}
 */
function formatConfig(configStatus) {
  if (!configStatus.exists) {
    return 'Not found. Run \'dev config init\' to get started.';
  }
  if (!configStatus.valid) {
    return 'Invalid JSON. Check ~/.devutils/config.json for syntax errors.';
  }
  return 'OK';
}

/**
 * Formats a human-readable summary line for the machine section.
 *
 * @param {{ detected: boolean, type?: string, arch?: string, packageManager?: string }} machineStatus - The machine check result.
 * @returns {string}
 */
function formatMachine(machineStatus) {
  if (!machineStatus.detected) {
    return 'Not detected. Run \'dev machine detect\' to set up.';
  }
  const pm = machineStatus.packageManager ? ` (${machineStatus.packageManager})` : '';
  return `${machineStatus.type} ${machineStatus.arch}${pm}`;
}

/**
 * Formats a human-readable summary line for the auth section.
 *
 * @param {{ services: string[], count: number }} authStatus - The auth check result.
 * @returns {string}
 */
function formatAuth(authStatus) {
  if (authStatus.count === 0) {
    return 'No services connected.';
  }
  return `${authStatus.count} services (${authStatus.services.join(', ')})`;
}

/**
 * Formats a human-readable summary line for the aliases section.
 *
 * @param {{ count: number }} aliasStatus - The alias check result.
 * @returns {string}
 */
function formatAliases(aliasStatus) {
  if (aliasStatus.count === 0) {
    return 'None registered.';
  }
  return `${aliasStatus.count} registered`;
}

/**
 * Formats a human-readable summary line for the plugins section.
 *
 * @param {{ count: number, plugins: string[] }} pluginStatus - The plugin check result.
 * @returns {string}
 */
function formatPlugins(pluginStatus) {
  if (pluginStatus.count === 0) {
    return 'None installed.';
  }
  return `${pluginStatus.count} installed (${pluginStatus.plugins.join(', ')})`;
}

/**
 * Formats a human-readable summary line for the sync section.
 *
 * @param {{ lastBackup: string|null }} syncStatus - The sync check result.
 * @returns {string}
 */
function formatSync(syncStatus) {
  if (!syncStatus.lastBackup) {
    return 'Never.';
  }
  // Format the ISO timestamp into something more readable
  try {
    const date = new Date(syncStatus.lastBackup);
    return date.toLocaleString();
  } catch {
    return syncStatus.lastBackup;
  }
}

/**
 * Runs the status health check. Gathers information from config files,
 * machine profile, auth directory, aliases, plugins, and sync state.
 * Outputs a compact summary for humans or a structured object for JSON.
 *
 * @param {object} args - Parsed command arguments (none expected).
 * @param {object} context - The CLI context object with config, platform, shell, output, flags.
 */
async function run(args, context) {
  const configStatus = checkConfig(context.config);
  const machineStatus = checkMachine(context.config);
  const authStatus = checkAuth(context.config);
  const aliasStatus = checkAliases(context.config);
  const pluginStatus = checkPlugins(context.config);
  const syncStatus = checkSync(context.config);

  const result = {
    config: configStatus,
    machine: machineStatus,
    auth: authStatus,
    aliases: aliasStatus,
    plugins: pluginStatus,
    sync: syncStatus,
  };

  if (context.flags.format === 'json') {
    context.output.out(result);
    return;
  }

  // Human-friendly output
  context.output.info('DevUtils Status');
  context.output.info('---------------');
  context.output.info(`Config:      ${formatConfig(configStatus)}`);
  context.output.info(`Machine:     ${formatMachine(machineStatus)}`);
  context.output.info(`Auth:        ${formatAuth(authStatus)}`);
  context.output.info(`Aliases:     ${formatAliases(aliasStatus)}`);
  context.output.info(`API Plugins: ${formatPlugins(pluginStatus)}`);
  context.output.info(`Last Sync:   ${formatSync(syncStatus)}`);
}

module.exports = { meta, run };
