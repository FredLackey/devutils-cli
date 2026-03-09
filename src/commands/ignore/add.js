'use strict';

const path = require('path');
const fs = require('fs');
const { MARKER_START, MARKER_END } = require('./markers');

const meta = {
  description: 'Add gitignore patterns for a technology',
  arguments: [
    { name: 'technology', description: 'Technology name (e.g., node, macos, docker)', required: true }
  ],
  flags: [
    { name: 'path', description: 'Target directory (defaults to current directory)', type: 'string', default: '.' }
  ]
};

/**
 * Resolves the absolute path to a pattern file for a given technology.
 * Uses __dirname so the path is relative to the installed package, not the
 * user's working directory.
 *
 * @param {string} technology - Technology name (e.g., 'node').
 * @returns {string} Absolute path to the pattern file.
 */
function getPatternFilePath(technology) {
  return path.resolve(__dirname, '../../patterns/gitignore', `${technology}.txt`);
}

/**
 * Adds gitignore patterns for a technology to the .gitignore in the target
 * directory. If the section already exists, it is replaced in place (idempotent).
 * If the .gitignore does not exist, it is created.
 *
 * @param {object} args - Parsed command arguments ({ positional, flags }).
 * @param {object} context - The DevUtils context object.
 */
async function run(args, context) {
  const technology = args.positional[0];

  // Validate: technology name is required
  if (!technology) {
    context.errors.throwError(400, 'Missing required argument: <technology>. Example: dev ignore add node', 'ignore');
    return;
  }

  // Step A: Validate the technology name and read the pattern file
  const patternFilePath = getPatternFilePath(technology);
  if (!fs.existsSync(patternFilePath)) {
    context.errors.throwError(404, `Unknown technology "${technology}". Run "dev ignore list" to see available options.`, 'ignore');
    return;
  }

  const patternContent = fs.readFileSync(patternFilePath, 'utf8').trimEnd();

  // Step B: Resolve the target .gitignore path
  const flagPath = args.flags.path || '.';
  const gitignorePath = path.resolve(flagPath, '.gitignore');

  // Step C: Read existing .gitignore or start empty
  let existingContent = '';
  let fileExists = false;
  if (fs.existsSync(gitignorePath)) {
    existingContent = fs.readFileSync(gitignorePath, 'utf8');
    fileExists = true;
  }

  // Step D: Build the new section
  const section = [
    MARKER_START(technology),
    patternContent,
    MARKER_END(technology)
  ].join('\n');

  // Step E: Check if the section already exists
  const lines = existingContent.split(/\r?\n/);
  const startMarker = MARKER_START(technology);
  const endMarker = MARKER_END(technology);
  const startIndex = lines.findIndex(line => line.trim() === startMarker);
  const endIndex = lines.findIndex(line => line.trim() === endMarker);

  let updatedContent;
  let action;

  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    // Both markers found: replace the existing section in place
    const before = lines.slice(0, startIndex);
    const after = lines.slice(endIndex + 1);
    const sectionLines = section.split('\n');
    const newLines = [...before, ...sectionLines, ...after];
    updatedContent = newLines.join('\n');
    action = 'updated';
  } else if (startIndex !== -1 || endIndex !== -1) {
    // Only one marker found: corrupted state. Warn and append.
    if (!context.flags.quiet) {
      context.output.info(`Warning: Found partial markers for "${technology}" in .gitignore. Appending new section at end.`);
    }
    updatedContent = existingContent;
    // Ensure a blank line before the new section
    if (updatedContent.length > 0 && !updatedContent.endsWith('\n\n') && !updatedContent.endsWith('\n')) {
      updatedContent += '\n';
    }
    if (updatedContent.length > 0 && !updatedContent.endsWith('\n\n')) {
      updatedContent += '\n';
    }
    updatedContent += section;
    action = 'added';
  } else {
    // No markers found: fresh add, append to end
    updatedContent = existingContent;
    // Step F: Ensure a blank line before the new section
    if (updatedContent.length > 0) {
      if (!updatedContent.endsWith('\n')) {
        updatedContent += '\n';
      }
      if (!updatedContent.endsWith('\n\n')) {
        updatedContent += '\n';
      }
    }
    updatedContent += section;
    action = 'added';
  }

  // Make sure the file ends with a trailing newline
  if (!updatedContent.endsWith('\n')) {
    updatedContent += '\n';
  }

  // Count pattern lines (lines between markers, not including markers)
  const sectionLines = section.split('\n');
  const patternLineCount = sectionLines.length - 2; // minus start and end markers

  // Step G: Handle --dry-run
  if (context.flags.dryRun) {
    if (context.flags.format === 'json') {
      context.output.out({
        technology,
        action,
        path: gitignorePath,
        lines: patternLineCount,
        dryRun: true
      });
    } else {
      context.output.info(`[dry-run] Would have ${action} ${technology} patterns in ${gitignorePath} (${patternLineCount} lines)`);
    }
    return;
  }

  // Step G: Write the result
  fs.writeFileSync(gitignorePath, updatedContent);

  // Step H: Output the result
  if (context.flags.format === 'json') {
    context.output.out({
      technology,
      action,
      path: gitignorePath,
      lines: patternLineCount
    });
  } else {
    const verb = action === 'updated' ? 'Updated' : 'Added';
    context.output.info(`${verb} ${technology} patterns ${action === 'updated' ? 'in' : 'to'} .gitignore`);
  }
}

module.exports = { meta, run };
