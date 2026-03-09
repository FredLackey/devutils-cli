'use strict';

/**
 * Command: dev tools check <tool-name>
 *
 * Checks if a tool is installed and shows its version.
 */

/**
 * @type {{ description: string, arguments: Array, flags: Array }}
 */
const meta = {
  description: 'Check if a tool is installed and show its version',
  arguments: [
    { name: 'tool', description: 'Name of the tool to check', required: true }
  ],
  flags: []
};

/**
 * Runs the check command.
 * @param {{ positional: string[], flags: object }} args - Parsed command arguments.
 * @param {object} context - The CLI context object.
 */
async function run(args, context) {
  const toolName = args.positional[0];

  if (!toolName) {
    context.errors.throwError(400, 'Missing required argument: tool. Usage: dev tools check <tool-name>', 'tools');
    return;
  }

  const installer = require('../../lib/installer');

  // Look up the tool in the registry
  const tool = installer.findTool(toolName);
  if (!tool) {
    context.output.error(`Tool '${toolName}' not found in registry. Run "dev tools search ${toolName}" to search.`);
    return;
  }

  try {
    // Load the installer and check if the tool is installed
    const mod = installer.loadInstaller(tool);
    const installed = await mod.isInstalled(context);

    if (installed) {
      // Try to get the version
      let version = 'version unknown';
      if (typeof mod.getVersion === 'function') {
        const ver = await mod.getVersion(context);
        if (ver) {
          version = `version ${ver}`;
        }
      } else {
        // Fall back to --version
        try {
          const result = await context.shell.exec(`${tool.name} --version`);
          if (result.exitCode === 0 && result.stdout) {
            const match = result.stdout.trim().match(/(\d+\.\d+[\.\d]*)/);
            if (match) {
              version = `version ${match[1]}`;
            }
          }
        } catch {
          // version remains "version unknown"
        }
      }

      context.output.out({ name: tool.name, installed: true, version });
    } else {
      context.output.out({ name: tool.name, installed: false, version: null });
    }
  } catch (err) {
    context.output.error(err.message);
  }
}

module.exports = { meta, run };
