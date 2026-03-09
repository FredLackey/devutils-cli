'use strict';

const path = require('path');
const fs = require('fs');

/**
 * Cached registry data. Set on first call to loadRegistry().
 * The registry doesn't change during a CLI run, so we only read it once.
 * @type {Array<object>|null}
 */
let registryCache = null;

/**
 * Reads and parses the installer registry (src/installers/registry.json).
 * Returns the tools array. Results are cached after the first call.
 *
 * @returns {Array<object>} The array of tool entries from the registry.
 */
function loadRegistry() {
  if (registryCache) {
    return registryCache;
  }

  const registryPath = path.join(__dirname, '..', 'installers', 'registry.json');
  const raw = fs.readFileSync(registryPath, 'utf8');
  const data = JSON.parse(raw);
  registryCache = data.tools || [];
  return registryCache;
}

/**
 * Looks up a tool by name in the registry.
 * Comparison is case-insensitive.
 *
 * @param {string} name - The tool name to look up (e.g. 'git', 'Node').
 * @returns {object|null} The tool entry, or null if not found.
 */
function findTool(name) {
  if (!name) {
    return null;
  }

  const tools = loadRegistry();
  const lower = name.toLowerCase();
  return tools.find(t => t.name.toLowerCase() === lower) || null;
}

/**
 * Loads the installer module for a given tool entry.
 * Validates that the file exists and exports the required functions (isInstalled, install).
 *
 * @param {object} toolEntry - A tool entry from the registry (must have an `installer` field).
 * @returns {object} The installer module (with isInstalled, install, etc.).
 * @throws {Error} If the installer file is missing or doesn't export required functions.
 */
function loadInstaller(toolEntry) {
  if (!toolEntry || !toolEntry.installer) {
    throw new Error('Invalid tool entry: missing installer field.');
  }

  const installerPath = path.join(__dirname, '..', 'installers', toolEntry.installer);

  if (!fs.existsSync(installerPath)) {
    throw new Error(
      `Installer file not found: ${toolEntry.installer}. ` +
      `Expected at ${installerPath}`
    );
  }

  const mod = require(installerPath);

  if (typeof mod.isInstalled !== 'function') {
    throw new Error(
      `Installer "${toolEntry.installer}" does not export an isInstalled() function.`
    );
  }

  if (typeof mod.install !== 'function') {
    throw new Error(
      `Installer "${toolEntry.installer}" does not export an install() function.`
    );
  }

  return mod;
}

/**
 * Resolves the full dependency chain for a tool, in installation order.
 * If tool A depends on B, and B depends on C, returns ['C', 'B', 'A'].
 * Detects circular dependencies and throws if found.
 *
 * @param {string} toolName - The name of the tool to resolve.
 * @param {Set<string>} [visited] - Already-visited tool names (used internally for recursion).
 * @param {string[]} [chain] - Current dependency chain (used internally for circular detection).
 * @returns {string[]} Flat, ordered array of tool names to install.
 * @throws {Error} If a circular dependency is detected or a tool is unknown.
 */
function resolveDependencies(toolName, visited = new Set(), chain = []) {
  if (chain.includes(toolName)) {
    throw new Error(
      `Circular dependency detected: ${chain.join(' -> ')} -> ${toolName}`
    );
  }

  if (visited.has(toolName)) {
    return [];
  }

  const tool = findTool(toolName);
  if (!tool) {
    throw new Error(`Unknown tool: ${toolName}`);
  }

  chain.push(toolName);
  visited.add(toolName);

  const result = [];
  for (const dep of tool.dependencies) {
    result.push(...resolveDependencies(dep, visited, [...chain]));
  }
  result.push(toolName);
  return result;
}

/**
 * Checks if a tool is installed on the current system.
 * Loads the tool's installer and calls its isInstalled() function.
 *
 * @param {string} toolName - The name of the tool to check.
 * @param {object} context - The CLI context object.
 * @returns {Promise<boolean>} true if the tool is installed.
 * @throws {Error} If the tool is unknown or the installer can't be loaded.
 */
async function checkInstalled(toolName, context) {
  const tool = findTool(toolName);
  if (!tool) {
    throw new Error(`Unknown tool: ${toolName}`);
  }

  const mod = loadInstaller(tool);
  return mod.isInstalled(context);
}

/**
 * Installs a tool, including any dependencies, using the platform-appropriate method.
 *
 * Steps:
 * 1. Looks up the tool in the registry. Throws if not found.
 * 2. Checks if the current platform is supported. Throws if not.
 * 3. Resolves the dependency chain.
 * 4. For each tool in the chain, checks if it's already installed.
 *    If not, loads the installer and calls install(context).
 * 5. Returns a summary object.
 *
 * @param {string} toolName - The name of the tool to install.
 * @param {object} context - The CLI context object.
 * @returns {Promise<{ tool: string, alreadyInstalled: boolean, dependenciesInstalled: string[], installed: boolean }>}
 * @throws {Error} If the tool is unknown, unsupported on the current platform, or installation fails.
 */
async function installTool(toolName, context) {
  const tool = findTool(toolName);
  if (!tool) {
    throw new Error(`Tool '${toolName}' not found in registry.`);
  }

  // Check platform support
  const platformType = context.platform.detect().type;
  if (!tool.platforms.includes(platformType)) {
    throw new Error(
      `Tool '${toolName}' is not supported on ${platformType}. ` +
      `Supported platforms: ${tool.platforms.join(', ')}`
    );
  }

  // Resolve dependencies
  const chain = resolveDependencies(toolName);
  const dependenciesInstalled = [];
  let alreadyInstalled = false;
  let installed = false;

  for (const depName of chain) {
    const depTool = findTool(depName);
    const depMod = loadInstaller(depTool);
    const isAlready = await depMod.isInstalled(context);

    if (isAlready) {
      if (depName === toolName) {
        alreadyInstalled = true;
      }
      continue;
    }

    // Check platform support for the dependency too
    if (!depTool.platforms.includes(platformType)) {
      throw new Error(
        `Dependency '${depName}' is not supported on ${platformType}. ` +
        `Cannot install '${toolName}'.`
      );
    }

    await depMod.install(context);

    if (depName === toolName) {
      installed = true;
    } else {
      dependenciesInstalled.push(depName);
    }
  }

  return {
    tool: toolName,
    alreadyInstalled,
    dependenciesInstalled,
    installed,
  };
}

module.exports = {
  loadRegistry,
  findTool,
  loadInstaller,
  resolveDependencies,
  checkInstalled,
  installTool,
};
