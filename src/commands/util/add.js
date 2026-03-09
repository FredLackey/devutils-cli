'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const meta = {
  description: 'Register a custom utility by name and source path. Copies the script into ~/.devutils/utils/.',
  arguments: [
    { name: 'name', required: true, description: 'Name for the utility (used in dev util run <name>)' },
    { name: 'path', required: true, description: 'Path to the script file or directory to register' },
  ],
  flags: [
    { name: 'link', description: 'Create a symlink instead of copying (for active development)' },
  ],
};

/**
 * Recursively copy a directory.
 * @param {string} src - Source directory path.
 * @param {string} dest - Destination directory path.
 */
function copyDirectorySync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirectorySync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

async function run(args, context) {
  const name = args.positional[0];
  const sourcePath = args.positional[1];

  if (!name || !sourcePath) {
    context.errors.throwError(400, 'Usage: dev util add <name> <path>', 'util');
    return;
  }

  if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) {
    context.output.error('Utility names must be lowercase letters, numbers, and hyphens only.');
    context.output.info('Example: my-script, git-helper, deploy-2');
    return;
  }

  // Check for name conflicts with built-in utilities
  const builtInRegistry = require('../../utils/registry.json');
  const isBuiltIn = (builtInRegistry.utilities || []).some(u => u.name === name);
  if (isBuiltIn) {
    context.output.error(`"${name}" is a built-in utility and cannot be overridden.`);
    return;
  }

  const customDir = path.join(os.homedir(), '.devutils', 'utils');
  const existingFolder = path.join(customDir, name);
  const existingFile = path.join(customDir, name + '.js');
  if (fs.existsSync(existingFolder) || fs.existsSync(existingFile)) {
    context.output.error(`A custom utility named "${name}" already exists.`);
    context.output.info('Remove it first with: dev util remove ' + name);
    return;
  }

  // Validate the source path
  const resolvedSource = path.resolve(sourcePath);
  if (!fs.existsSync(resolvedSource)) {
    context.output.error(`Source path not found: ${resolvedSource}`);
    return;
  }

  const stat = fs.statSync(resolvedSource);
  let entryPoint;

  if (stat.isDirectory()) {
    entryPoint = path.join(resolvedSource, 'index.js');
    if (!fs.existsSync(entryPoint)) {
      context.output.error('Directory does not contain an index.js file.');
      return;
    }
  } else if (stat.isFile() && resolvedSource.endsWith('.js')) {
    entryPoint = resolvedSource;
  } else {
    context.output.error('Source must be a .js file or a directory containing index.js.');
    return;
  }

  // Verify it exports a run function
  try {
    const mod = require(entryPoint);
    if (typeof mod.run !== 'function') {
      context.output.error('The source file must export a run() function.');
      return;
    }
  } catch (err) {
    context.output.error(`Failed to load source file: ${err.message}`);
    return;
  }

  // Copy or link the utility
  fs.mkdirSync(customDir, { recursive: true });

  if (args.flags.link) {
    const linkTarget = stat.isDirectory()
      ? path.join(customDir, name)
      : path.join(customDir, name + '.js');
    fs.symlinkSync(resolvedSource, linkTarget);
  } else {
    if (stat.isDirectory()) {
      copyDirectorySync(resolvedSource, path.join(customDir, name));
    } else {
      fs.copyFileSync(resolvedSource, path.join(customDir, name + '.js'));
    }
  }

  // Update the custom registry
  const registryPath = path.join(customDir, 'registry.json');
  let registry = { utilities: [] };
  if (fs.existsSync(registryPath)) {
    try {
      registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
    } catch {
      registry = { utilities: [] };
    }
  }

  const mod = require(entryPoint);
  const utilMeta = mod.meta || {};

  registry.utilities.push({
    name: name,
    description: utilMeta.description || '',
    type: 'custom',
    platforms: utilMeta.platforms || [],
    arguments: utilMeta.arguments || [],
    flags: utilMeta.flags || [],
    source: resolvedSource,
    linked: !!args.flags.link,
  });

  fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2) + '\n');

  context.output.info(`Utility "${name}" registered successfully.`);
  context.output.info(`Run it with: dev util run ${name}`);
}

module.exports = { meta, run };
