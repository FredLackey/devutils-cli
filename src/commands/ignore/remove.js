'use strict';

const path = require('path');
const fs = require('fs');
const { MARKER_START, MARKER_END } = require('./markers');

const meta = {
  description: 'Remove managed gitignore patterns for a technology',
  arguments: [
    { name: 'technology', description: 'Technology name to remove (e.g., node, macos)', required: true }
  ],
  flags: [
    { name: 'path', description: 'Target directory (defaults to current directory)', type: 'string', default: '.' }
  ]
};

/**
 * Removes a DevUtils-managed section from the .gitignore in the target
 * directory. If the section does not exist, this is a no-op (idempotent).
 * If removing the section leaves the file empty, the file is deleted.
 *
 * @param {object} args - Parsed command arguments ({ positional, flags }).
 * @param {object} context - The DevUtils context object.
 */
async function run(args, context) {
  const technology = args.positional[0];

  // Validate: technology name is required
  if (!technology) {
    context.errors.throwError(400, 'Missing required argument: <technology>. Example: dev ignore remove node', 'ignore');
    return;
  }

  // Step A: Resolve the .gitignore path
  const flagPath = args.flags.path || '.';
  const gitignorePath = path.resolve(flagPath, '.gitignore');

  // Step B: Read existing .gitignore
  if (!fs.existsSync(gitignorePath)) {
    if (context.flags.format === 'json') {
      context.output.out({
        technology,
        action: 'none',
        message: `No .gitignore found at ${path.resolve(flagPath)}.`
      });
    } else {
      context.output.info(`No .gitignore found at ${path.resolve(flagPath)}.`);
    }
    return;
  }

  const existingContent = fs.readFileSync(gitignorePath, 'utf8');

  // Step C: Find the section markers
  const lines = existingContent.split(/\r?\n/);
  const startMarker = MARKER_START(technology);
  const endMarker = MARKER_END(technology);
  const startIndex = lines.findIndex(line => line.trim() === startMarker);
  const endIndex = lines.findIndex(line => line.trim() === endMarker);

  if (startIndex === -1 && endIndex === -1) {
    // Section not present: no-op
    if (context.flags.format === 'json') {
      context.output.out({
        technology,
        action: 'none',
        message: `No managed section for "${technology}" found in .gitignore.`
      });
    } else {
      context.output.info(`No managed section for "${technology}" found in .gitignore.`);
    }
    return;
  }

  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    // Only one marker found or end before start: corrupted state
    context.output.info(`Warning: Found partial or corrupted markers for "${technology}" in .gitignore. Please fix manually.`);
    return;
  }

  // Step D: Remove the section (start through end marker, inclusive)
  const before = lines.slice(0, startIndex);
  let after = lines.slice(endIndex + 1);

  // Clean up one trailing blank line after the end marker
  if (after.length > 0 && after[0].trim() === '') {
    after = after.slice(1);
  }

  let newLines = [...before, ...after];

  // Build the updated content
  let updatedContent = newLines.join('\n');

  // Step E: If the file is now empty (only whitespace), delete it
  if (updatedContent.trim() === '') {
    if (context.flags.dryRun) {
      if (context.flags.format === 'json') {
        context.output.out({
          technology,
          action: 'removed',
          path: gitignorePath,
          fileDeleted: true,
          dryRun: true
        });
      } else {
        context.output.info(`[dry-run] Would remove ${technology} patterns from .gitignore and delete the empty file`);
      }
      return;
    }

    fs.unlinkSync(gitignorePath);

    if (context.flags.format === 'json') {
      context.output.out({
        technology,
        action: 'removed',
        path: gitignorePath,
        fileDeleted: true
      });
    } else {
      context.output.info(`Removed ${technology} patterns from .gitignore (file deleted -- was empty)`);
    }
    return;
  }

  // Make sure the file ends with a trailing newline
  if (!updatedContent.endsWith('\n')) {
    updatedContent += '\n';
  }

  // Handle --dry-run
  if (context.flags.dryRun) {
    if (context.flags.format === 'json') {
      context.output.out({
        technology,
        action: 'removed',
        path: gitignorePath,
        fileDeleted: false,
        dryRun: true
      });
    } else {
      context.output.info(`[dry-run] Would remove ${technology} patterns from .gitignore`);
    }
    return;
  }

  // Step E: Write the result
  fs.writeFileSync(gitignorePath, updatedContent);

  // Step F: Output the result
  if (context.flags.format === 'json') {
    context.output.out({
      technology,
      action: 'removed',
      path: gitignorePath,
      fileDeleted: false
    });
  } else {
    context.output.info(`Removed ${technology} patterns from .gitignore`);
  }
}

module.exports = { meta, run };
