'use strict';

const { loadAliases, saveAliases, generateWrapper, BIN_DIR } = require('./helpers');

const meta = {
  description: 'Create a global shorthand command that maps to any dev command.',
  arguments: [
    { name: 'name', required: true, description: 'The alias name (what the user will type)' },
    { name: 'command', required: true, description: 'The full command to run (quoted string)' }
  ],
  flags: [
    { name: 'force', type: 'boolean', description: 'Overwrite an existing alias without prompting' }
  ]
};

/**
 * Creates a new alias by writing the mapping to aliases.json and generating
 * a wrapper script in ~/.devutils/bin/.
 *
 * @param {object} args - Parsed command arguments (positional and flags).
 * @param {object} context - The command context (output, prompt, errors, shell, platform).
 */
async function run(args, context) {
  // Step 1: Parse arguments
  // The first positional arg is the alias name. Everything after it is the command.
  const name = args.positional[0];
  const command = args.positional.slice(1).join(' ');

  if (!name || !command) {
    context.output.error('Usage: dev alias add <name> "<command>"');
    context.output.error('');
    context.output.error('Examples:');
    context.output.error('  dev alias add gs "dev util run git-status"');
    context.output.error('  dev alias add clone "dev util run clone"');
    context.output.error('  dev alias add claude-danger "dev ai launch claude"');
    return;
  }

  // Step 2: Validate the alias name
  // Must be lowercase letters, numbers, and hyphens. Must start with a letter or number.
  if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) {
    context.output.error('Alias names must be lowercase letters, numbers, and hyphens only.');
    return;
  }

  // Step 3: Check for system command conflicts
  // Use shell.which to see if the name matches an existing command on the system PATH.
  // Exclude our own bin directory from the check so re-creating an alias is not a conflict.
  const binDir = BIN_DIR;
  const existingPath = context.shell.which(name);

  if (existingPath && !existingPath.startsWith(binDir)) {
    context.output.error(`Warning: "${name}" already exists on your system at ${existingPath}`);
    context.output.error('Creating this alias will shadow the existing command.');

    if (!args.flags.force) {
      const proceed = await context.prompt.confirm(
        'Create the alias anyway?',
        false
      );
      if (!proceed) {
        context.output.info('Cancelled.');
        return;
      }
    }
  }

  // Step 4: Check for existing aliases
  // If an alias with this name already exists, warn the user unless --force is set.
  const aliases = loadAliases();

  if (aliases[name] && !args.flags.force) {
    context.output.error(`Alias "${name}" already exists: ${aliases[name]}`);
    context.output.error('Use --force to overwrite it.');
    return;
  }

  // Step 5: Write the alias to aliases.json
  aliases[name] = command;
  saveAliases(aliases);

  // Step 6: Generate the wrapper script
  const platform = context.platform.detect();
  generateWrapper(name, command, binDir, platform.type);

  // Step 7: Print confirmation
  context.output.info(`Alias "${name}" created.`);
  context.output.info(`  ${name} -> ${command}`);
  context.output.info('');
  context.output.info(`You can now run: ${name}`);
}

module.exports = { meta, run };
