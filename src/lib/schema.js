'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const SERVICE_NAMES = [
  'config', 'machine', 'identity', 'tools',
  'ignore', 'util', 'alias', 'auth', 'api', 'ai', 'search',
];

const TOP_LEVEL_COMMANDS = ['status', 'update', 'version', 'schema', 'help'];

let _registry = null;

/**
 * Build the full schema registry by walking all service index.js files,
 * top-level commands, and installed API plugins.
 *
 * @returns {object} The nested registry object.
 */
function buildRegistry() {
  const registry = {};

  // Load services
  for (const name of SERVICE_NAMES) {
    try {
      const service = require(`../commands/${name}/index`);
      const entry = {
        type: 'service',
        name: service.name || name,
        description: service.description || '',
        commands: {},
      };

      for (const [cmdName, loader] of Object.entries(service.commands || {})) {
        try {
          const cmd = typeof loader === 'function' ? loader() : loader;
          entry.commands[cmdName] = {
            type: 'command',
            name: cmdName,
            description: (cmd.meta && cmd.meta.description) || '',
            arguments: (cmd.meta && cmd.meta.arguments) || [],
            flags: (cmd.meta && cmd.meta.flags) || [],
          };
        } catch {
          // Skip commands that fail to load
        }
      }

      registry[name] = entry;
    } catch {
      // Skip services that fail to load
    }
  }

  // Load top-level commands
  for (const name of TOP_LEVEL_COMMANDS) {
    try {
      const cmd = require(`../commands/${name}`);
      registry[name] = {
        type: 'command',
        name,
        description: (cmd.meta && cmd.meta.description) || '',
        arguments: (cmd.meta && cmd.meta.arguments) || [],
        flags: (cmd.meta && cmd.meta.flags) || [],
      };
    } catch {
      // Skip commands that fail to load
    }
  }

  // Load API plugins
  loadPlugins(registry);

  return registry;
}

/**
 * Load installed API plugins into the registry under api.plugins.
 * @param {object} registry - The registry to extend.
 */
function loadPlugins(registry) {
  const pluginsFile = path.join(os.homedir(), '.devutils', 'plugins.json');

  if (!fs.existsSync(pluginsFile)) {
    return;
  }

  let plugins;
  try {
    plugins = JSON.parse(fs.readFileSync(pluginsFile, 'utf8'));
  } catch {
    return;
  }

  const pluginsDir = path.join(os.homedir(), '.devutils', 'plugins');

  if (!registry.api) {
    registry.api = { type: 'service', name: 'api', description: 'API plugin system', commands: {} };
  }

  for (const [serviceName, info] of Object.entries(plugins)) {
    try {
      const pluginPath = path.join(pluginsDir, 'node_modules', info.package);
      const plugin = require(pluginPath);

      const serviceEntry = {
        type: 'plugin',
        name: plugin.name || serviceName,
        description: plugin.description || '',
        version: plugin.version || '',
        auth: plugin.auth || null,
        resources: {},
      };

      for (const [resName, resource] of Object.entries(plugin.resources || {})) {
        const resEntry = {
          type: 'resource',
          name: resName,
          description: (resource.description) || '',
          commands: {},
        };

        for (const [cmdName, loader] of Object.entries(resource.commands || {})) {
          try {
            const cmd = typeof loader === 'function' ? loader() : loader;
            resEntry.commands[cmdName] = {
              type: 'command',
              name: cmdName,
              description: (cmd.meta && cmd.meta.description) || '',
              arguments: (cmd.meta && cmd.meta.arguments) || [],
              flags: (cmd.meta && cmd.meta.flags) || [],
            };
          } catch {
            // Skip commands that fail to load
          }
        }

        serviceEntry.resources[resName] = resEntry;
      }

      if (!registry.api.plugins) {
        registry.api.plugins = {};
      }
      registry.api.plugins[serviceName] = serviceEntry;
    } catch {
      // Plugin failed to load, skip it
    }
  }
}

/**
 * Get the schema registry. Built lazily on first access and cached.
 * @returns {object} The registry.
 */
function getRegistry() {
  if (!_registry) {
    _registry = buildRegistry();
  }
  return _registry;
}

/**
 * Resolve a dot-notation path to a registry entry.
 * Handles up to 4 levels: api.plugin.resource.command.
 *
 * @param {string} dotPath - Dot-notation path (e.g., "config.set", "api.gmail.messages.list").
 * @returns {object|null} The matching entry, or null if not found.
 */
function resolve(dotPath) {
  const registry = getRegistry();
  const parts = dotPath.split('.');

  // Single segment: top-level service or command
  if (parts.length === 1) {
    return registry[parts[0]] || null;
  }

  // Two segments: service.command
  if (parts.length === 2) {
    const service = registry[parts[0]];
    if (!service) return null;
    if (service.type === 'service' && service.commands && service.commands[parts[1]]) {
      return service.commands[parts[1]];
    }
    return null;
  }

  // Three segments: api.plugin.resource
  if (parts.length === 3 && parts[0] === 'api') {
    const plugins = (registry.api && registry.api.plugins) || {};
    const plugin = plugins[parts[1]];
    if (!plugin) return null;
    return (plugin.resources && plugin.resources[parts[2]]) || null;
  }

  // Four segments: api.plugin.resource.command
  if (parts.length === 4 && parts[0] === 'api') {
    const plugins = (registry.api && registry.api.plugins) || {};
    const plugin = plugins[parts[1]];
    if (!plugin) return null;
    const resource = plugin.resources && plugin.resources[parts[2]];
    if (!resource) return null;
    return (resource.commands && resource.commands[parts[3]]) || null;
  }

  return null;
}

module.exports = { getRegistry, resolve };
