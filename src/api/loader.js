'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const DEVUTILS_DIR = path.join(os.homedir(), '.devutils');
const PLUGINS_FILE = path.join(DEVUTILS_DIR, 'plugins.json');
const PLUGINS_DIR = path.join(DEVUTILS_DIR, 'plugins');

/**
 * Reads and parses ~/.devutils/plugins.json.
 * Returns an empty object if the file does not exist or is unreadable.
 * Logs a warning to stderr if the file exists but contains invalid JSON.
 *
 * @returns {object} A map of plugin names to their entries, or {}.
 */
function readPluginsJson() {
  try {
    const raw = fs.readFileSync(PLUGINS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    // If the file exists but JSON is invalid, warn the user
    if (err instanceof SyntaxError && fs.existsSync(PLUGINS_FILE)) {
      process.stderr.write(`Warning: ${PLUGINS_FILE} contains invalid JSON. Treating as empty.\n`);
    }
    return {};
  }
}

/**
 * Validates that a plugin module exports the required contract fields.
 * Returns null if valid, or a structured error object if something is missing.
 *
 * @param {object} pluginModule - The required plugin module.
 * @param {string} pluginName - The plugin name (for error messages).
 * @returns {object|null} Null if valid, or { error, code, message } if invalid.
 */
function validateContract(pluginModule, pluginName) {
  const required = ['name', 'description', 'version', 'auth', 'resources'];
  const missing = required.filter(field => !pluginModule[field]);

  if (missing.length > 0) {
    return {
      error: true,
      code: 'INVALID_CONTRACT',
      message: `Plugin "${pluginName}" is missing required fields: ${missing.join(', ')}.\nThe plugin may be outdated or incorrectly built.`
    };
  }

  if (typeof pluginModule.resources !== 'object') {
    return {
      error: true,
      code: 'INVALID_CONTRACT',
      message: `Plugin "${pluginName}" has an invalid resources export. Expected an object.`
    };
  }

  return null;
}

/**
 * Loads a plugin by name from the installed plugins directory.
 * Reads plugins.json, requires the package, and validates the contract.
 *
 * @param {string} pluginName - The short plugin name (e.g., 'gmail').
 * @returns {object} { error: false, plugin } on success, or { error: true, code, message } on failure.
 */
function loadPlugin(pluginName) {
  const plugins = readPluginsJson();
  const entry = plugins[pluginName];

  if (!entry) {
    return {
      error: true,
      code: 'NOT_INSTALLED',
      message: `API plugin "${pluginName}" is not installed.\nRun "dev api enable ${pluginName}" to install it.`
    };
  }

  const packagePath = path.join(PLUGINS_DIR, 'node_modules', entry.package);

  let pluginModule;
  try {
    pluginModule = require(packagePath);
  } catch (err) {
    return {
      error: true,
      code: 'LOAD_FAILED',
      message: `Failed to load plugin "${pluginName}" from ${packagePath}.\nThe package may be corrupted. Try "dev api disable ${pluginName}" then "dev api enable ${pluginName}".`
    };
  }

  // Validate the plugin contract
  const validation = validateContract(pluginModule, pluginName);
  if (validation) {
    return validation;
  }

  return { error: false, plugin: pluginModule };
}

/**
 * Resolves a specific command from a plugin's resource tree.
 * Given a plugin name, resource name, and command name, loads the plugin
 * and walks the resource/command tree to find the command module.
 *
 * @param {string} pluginName - The plugin name (e.g., 'gmail').
 * @param {string} resourceName - The resource name (e.g., 'messages').
 * @param {string} commandName - The command name (e.g., 'list').
 * @returns {object} { error: false, command, plugin } on success, or { error: true, code, message } on failure.
 */
function resolveCommand(pluginName, resourceName, commandName) {
  const result = loadPlugin(pluginName);
  if (result.error) return result;

  const plugin = result.plugin;
  const resource = plugin.resources[resourceName];

  if (!resource) {
    const available = Object.keys(plugin.resources).join(', ');
    return {
      error: true,
      code: 'UNKNOWN_RESOURCE',
      message: `Plugin "${pluginName}" has no resource "${resourceName}".\nAvailable resources: ${available}`
    };
  }

  const commandLoader = resource.commands[commandName];
  if (!commandLoader) {
    const available = Object.keys(resource.commands).join(', ');
    return {
      error: true,
      code: 'UNKNOWN_COMMAND',
      message: `Resource "${resourceName}" in plugin "${pluginName}" has no command "${commandName}".\nAvailable commands: ${available}`
    };
  }

  let commandModule;
  try {
    commandModule = typeof commandLoader === 'function' ? commandLoader() : commandLoader;
  } catch (err) {
    return {
      error: true,
      code: 'COMMAND_LOAD_FAILED',
      message: `Failed to load command "${commandName}" from plugin "${pluginName}": ${err.message}`
    };
  }

  return {
    error: false,
    command: commandModule,
    plugin: plugin
  };
}

/**
 * Builds the context object that plugin commands receive.
 * Reads the auth credential for the plugin's declared auth service
 * and unwraps the credential envelope so plugins get flat access.
 *
 * @param {object} plugin - The plugin's contract object (must have an auth field).
 * @param {object} coreContext - The core CLI context (output, errors, config, shell, platform).
 * @returns {object} The enriched plugin context with auth, output, errors, config, shell, platform.
 */
function buildPluginContext(plugin, coreContext) {
  const authService = plugin.auth;

  // Read the auth credential for this plugin's declared service
  const authFilePath = path.join(DEVUTILS_DIR, 'auth', `${authService}.json`);
  let authCredential = null;
  try {
    const raw = fs.readFileSync(authFilePath, 'utf8');
    const credentialFile = JSON.parse(raw);

    // Unwrap the credential envelope. The auth system stores files as:
    //   { service, type, credentials: { ... } }
    // Plugins expect flat access (e.g., context.auth.accessKeyId), so we
    // pass credentialFile.credentials directly instead of the full envelope.
    authCredential = credentialFile.credentials || credentialFile;
  } catch (err) {
    // Auth not available - plugin commands will get null
  }

  return {
    auth: authCredential,
    output: coreContext.output,
    errors: coreContext.errors,
    config: coreContext.config,
    shell: coreContext.shell,
    platform: coreContext.platform
  };
}

/**
 * Returns all installed plugins from plugins.json.
 * Returns an empty object if no plugins are installed.
 *
 * @returns {object} A map of plugin names to their entries.
 */
function getInstalledPlugins() {
  return readPluginsJson();
}

/**
 * Returns the list of available plugins from the bundled registry.
 * Returns an empty array if the registry file is missing or unreadable.
 *
 * @returns {Array<object>} An array of registry plugin entries.
 */
function getRegistryPlugins() {
  try {
    return require('./registry.json');
  } catch (err) {
    return [];
  }
}

module.exports = {
  resolveCommand,
  loadPlugin,
  buildPluginContext,
  validateContract,
  getInstalledPlugins,
  getRegistryPlugins,
  readPluginsJson,
  PLUGINS_FILE,
  PLUGINS_DIR
};
