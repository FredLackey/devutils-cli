'use strict';

const fs = require('fs');
const path = require('path');
const { loadAliases, generateWrapper, BIN_DIR } = require('./helpers');

const meta = {
  description: 'Rebuild all alias wrapper scripts from aliases.json. Cleans up orphaned scripts.',
  arguments: [],
  flags: [
    { name: 'dry-run', type: 'boolean', description: 'Show what would be done without doing it' }
  ]
};

/**
 * Regenerates all wrapper scripts from aliases.json and removes orphaned
 * scripts that no longer have a matching alias entry. This is the repair
 * command for the alias system -- after importing config on a new machine,
 * run sync to rebuild all the wrapper scripts.
 *
 * @param {object} args - Parsed command arguments (positional and flags).
 * @param {object} context - The command context (output, platform, flags).
 */
async function run(args, context) {
  // Step 1: Load aliases.json
  const aliases = loadAliases();

  // Step 2: Ensure the bin directory exists
  const binDir = BIN_DIR;
  if (!fs.existsSync(binDir)) {
    fs.mkdirSync(binDir, { recursive: true });
  }

  // Step 3: Scan existing scripts in the bin directory
  const existingFiles = fs.readdirSync(binDir);

  // Step 4: Determine what to create and what to remove
  const platform = context.platform.detect();

  // Find orphans: files in bin/ that are not in aliases.json
  const orphans = existingFiles.filter(file => {
    // Strip .cmd extension for comparison
    const baseName = file.endsWith('.cmd') ? file.slice(0, -4) : file;
    return !aliases[baseName];
  });

  // Find missing: aliases that do not have a wrapper script yet
  const missing = Object.keys(aliases).filter(name => {
    return !fs.existsSync(path.join(binDir, name))
      && !fs.existsSync(path.join(binDir, name + '.cmd'));
  });

  // Step 5: Handle dry-run mode
  // --dry-run is a global flag (context.flags.dryRun) or a command flag (args.flags['dry-run'])
  const isDryRun = context.flags.dryRun || args.flags['dry-run'];

  if (isDryRun) {
    if (missing.length === 0 && orphans.length === 0) {
      context.output.info('Everything is in sync. Nothing to do.');
      return;
    }

    if (missing.length > 0) {
      context.output.info(`Would create ${missing.length} wrapper script(s):`);
      for (const name of missing) {
        context.output.info(`  + ${name} -> ${aliases[name]}`);
      }
    }

    if (orphans.length > 0) {
      context.output.info(`Would remove ${orphans.length} orphaned script(s):`);
      for (const file of orphans) {
        context.output.info(`  - ${file}`);
      }
    }
    return;
  }

  // Step 6: Generate all wrapper scripts
  // Regenerate every script (not just missing ones) to ensure they are all up to date.
  // This handles cases where the command mapping changed in aliases.json.
  let created = 0;
  for (const [name, command] of Object.entries(aliases)) {
    generateWrapper(name, command, binDir, platform.type);
    created++;
  }

  // Step 7: Remove orphaned scripts
  let removed = 0;
  for (const file of orphans) {
    const filePath = path.join(binDir, file);
    fs.unlinkSync(filePath);
    removed++;
  }

  // Step 8: Report results
  context.output.info('Alias sync complete.');
  context.output.info(`  ${created} script(s) generated`);
  if (removed > 0) {
    context.output.info(`  ${removed} orphaned script(s) removed`);
  }
  context.output.info('');

  if (created > 0) {
    context.output.info('Make sure ~/.devutils/bin is in your PATH.');
  }
}

module.exports = { meta, run };
