'use strict';

const fs = require('fs');
const path = require('path');
const shell = require('../../lib/shell');
const loader = require('../../api/loader');

const meta = {
  description: 'Install an API plugin from npm or a git repository',
  arguments: [
    { name: 'name', description: 'Plugin name or full package name', required: true }
  ],
  flags: [
    { name: 'source', type: 'string', description: 'Install source type: "npm" or "git" (default: npm)' },
    { name: 'url', type: 'string', description: 'Package name or git URL when using a non-registry plugin' }
  ]
};

/**
 * Installs an API plugin from npm or a git repository.
 * Resolves short names (like "gmail") through the registry, or accepts
 * full package names (starting with "@") and git URLs directly.
 *
 * @param {object} args - Parsed CLI arguments { positional, flags }.
 * @param {object} context - CLI context { output, errors, prompt }.
 */
async function run(args, context) {
  const pluginName = args.positional[0];

  if (!pluginName) {
    context.errors.throwError(400, 'Missing required argument: <name>. Example: dev api enable gmail', 'api');
    return;
  }

  // Resolve the package name from the registry or direct input
  const registry = loader.getRegistryPlugins();
  const registryEntry = registry.find(entry => entry.name === pluginName);
  let packageName;

  if (registryEntry) {
    // Found in registry - use the registry package name
    packageName = registryEntry.package;
  } else if (args.flags.url) {
    // Not in registry but user provided a URL/package name
    packageName = args.flags.url;
  } else if (pluginName.startsWith('@') || pluginName.includes('/')) {
    // Looks like a scoped npm package or git URL - use directly
    packageName = pluginName;
  } else {
    context.errors.throwError(
      404,
      `Plugin "${pluginName}" not found in the registry. Use --source git --url <git-url> to install from a git repository, or --url <package-name> to install a non-registry npm package.`,
      'api'
    );
    return;
  }

  // Check if already installed
  const installed = loader.readPluginsJson();
  if (installed[pluginName]) {
    context.output.info(
      `Plugin "${pluginName}" is already installed (version ${installed[pluginName].version || 'unknown'}). Use "dev api update ${pluginName}" to update.`
    );
    return;
  }

  // Ensure the plugins directory exists with a package.json
  const pluginsDir = loader.PLUGINS_DIR;
  const pkgJsonPath = path.join(pluginsDir, 'package.json');

  if (!fs.existsSync(pkgJsonPath)) {
    fs.mkdirSync(pluginsDir, { recursive: true });
    fs.writeFileSync(pkgJsonPath, JSON.stringify({
      name: 'devutils-plugins',
      version: '1.0.0',
      private: true,
      description: 'DevUtils CLI plugin packages'
    }, null, 2) + '\n');
  }

  // Determine the install target
  const installTarget = args.flags.url || packageName;

  // Run npm install
  context.output.info(`Installing ${pluginName} (${installTarget})...`);
  const result = await shell.exec(`npm install ${installTarget}`, { cwd: pluginsDir });

  if (result.exitCode !== 0) {
    context.errors.throwError(
      500,
      `Failed to install plugin "${pluginName}".\n${result.stderr || result.stdout}`,
      'api'
    );
    return;
  }

  // Read the installed version from the plugin's package.json
  let installedVersion = 'unknown';
  try {
    const pluginPkgPath = path.join(pluginsDir, 'node_modules', packageName, 'package.json');
    const pluginPkg = JSON.parse(fs.readFileSync(pluginPkgPath, 'utf8'));
    installedVersion = pluginPkg.version || 'unknown';
  } catch (err) {
    // Could not read version, continue with 'unknown'
  }

  // Update plugins.json
  const plugins = loader.readPluginsJson();
  const sourceType = args.flags.source || 'npm';
  plugins[pluginName] = {
    package: packageName,
    version: installedVersion,
    source: sourceType,
    installedAt: new Date().toISOString()
  };

  // Only store the URL if one was explicitly provided
  if (args.flags.url) {
    plugins[pluginName].url = args.flags.url;
  }

  // Ensure the parent directory exists for plugins.json
  const pluginsFileDir = path.dirname(loader.PLUGINS_FILE);
  if (!fs.existsSync(pluginsFileDir)) {
    fs.mkdirSync(pluginsFileDir, { recursive: true });
  }

  fs.writeFileSync(loader.PLUGINS_FILE, JSON.stringify(plugins, null, 2) + '\n');

  // Validate the plugin contract
  const loadResult = loader.loadPlugin(pluginName);
  if (loadResult.error) {
    context.output.info(
      `Warning: Plugin installed but does not follow the expected contract. It may not work correctly.\n${loadResult.message}`
    );
  }

  // Print success
  context.output.info(`Plugin "${pluginName}" installed (v${installedVersion}).`);

  // Show auth hint if available from the registry entry
  const authService = registryEntry ? registryEntry.auth : null;
  if (authService) {
    context.output.info(`This plugin requires "${authService}" authentication. Run "dev auth login ${authService}" if you haven't already.`);
  }
}

module.exports = { meta, run };
