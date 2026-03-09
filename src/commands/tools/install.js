'use strict';

/**
 * Command: dev tools install <tool-name>
 *
 * Installs a development tool using the platform-appropriate method.
 * Resolves and installs dependencies automatically.
 */

/**
 * @type {{ description: string, arguments: Array, flags: Array }}
 */
const meta = {
  description: 'Install a development tool',
  arguments: [
    { name: 'tool', description: 'Name of the tool to install', required: true }
  ],
  flags: [
    { name: '--dry-run', description: 'Show what would be installed without doing it' },
    { name: '--skip-deps', description: 'Skip dependency installation' }
  ]
};

/**
 * Runs the install command.
 * @param {{ positional: string[], flags: object }} args - Parsed command arguments.
 * @param {object} context - The CLI context object.
 */
async function run(args, context) {
  const toolName = args.positional[0];

  if (!toolName) {
    context.errors.throwError(400, 'Missing required argument: tool. Usage: dev tools install <tool-name>', 'tools');
    return;
  }

  const installer = require('../../lib/installer');

  // Look up the tool in the registry
  const tool = installer.findTool(toolName);
  if (!tool) {
    context.output.error(`Tool '${toolName}' not found in registry. Run "dev tools search ${toolName}" to search.`);
    return;
  }

  // Check platform support
  const platformType = context.platform.detect().type;
  if (!tool.platforms.includes(platformType)) {
    context.output.error(
      `Tool '${tool.name}' is not supported on ${platformType}. ` +
      `Supported platforms: ${tool.platforms.join(', ')}`
    );
    return;
  }

  // Dry run: show what would be installed without doing it
  if (context.flags.dryRun || args.flags['dry-run']) {
    try {
      const chain = installer.resolveDependencies(tool.name);

      // Check which tools are already installed
      const statuses = [];
      for (const name of chain) {
        const isAlready = await installer.checkInstalled(name, context);
        statuses.push({ name, installed: isAlready });
      }

      const needsInstall = statuses.filter(s => !s.installed);
      const alreadyInstalled = statuses.filter(s => s.installed);

      if (needsInstall.length === 0) {
        context.output.info(`${tool.name} is already installed (and all dependencies).`);
      } else {
        context.output.info('Would install (in order):');
        for (const s of needsInstall) {
          context.output.info(`  - ${s.name}`);
        }
        if (alreadyInstalled.length > 0) {
          context.output.info('Already installed:');
          for (const s of alreadyInstalled) {
            context.output.info(`  - ${s.name}`);
          }
        }
      }
    } catch (err) {
      context.output.error(err.message);
    }
    return;
  }

  // Actually install
  try {
    const result = await installer.installTool(tool.name, context);

    if (result.alreadyInstalled) {
      context.output.info(`${tool.name} is already installed.`);
    } else {
      if (result.dependenciesInstalled.length > 0) {
        context.output.info(`Dependencies installed: ${result.dependenciesInstalled.join(', ')}`);
      }
      if (result.installed) {
        context.output.info(`${tool.name} installed successfully.`);
      }
    }
  } catch (err) {
    context.output.error(err.message);
  }
}

module.exports = { meta, run };
