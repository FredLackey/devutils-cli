'use strict';

const path = require('path');
const fs = require('fs');

const meta = {
  description: 'List available gitignore pattern technologies',
  arguments: [],
  flags: []
};

/**
 * Returns the absolute path to the gitignore patterns directory.
 * Uses __dirname so the path is relative to the installed package.
 *
 * @returns {string} Absolute path to the patterns directory.
 */
function getPatternsDir() {
  return path.resolve(__dirname, '../../patterns/gitignore');
}

/**
 * Lists all available gitignore pattern technologies by scanning the
 * patterns directory. Each .txt file represents one technology. The
 * technology name is the filename without the .txt extension.
 *
 * @param {object} args - Parsed command arguments ({ positional, flags }).
 * @param {object} context - The DevUtils context object.
 */
async function run(args, context) {
  const patternsDir = getPatternsDir();

  // Step A: Read the patterns directory
  if (!fs.existsSync(patternsDir)) {
    context.errors.throwError(500, 'Patterns directory not found. The DevUtils installation may be corrupted.', 'ignore');
    return;
  }

  const files = fs.readdirSync(patternsDir)
    .filter(f => f.endsWith('.txt'))
    .sort();

  if (files.length === 0) {
    context.errors.throwError(500, 'No pattern files found. The DevUtils installation may be corrupted.', 'ignore');
    return;
  }

  // Step B: Read the first comment line from each file as a description
  const technologies = files.map(file => {
    const name = file.replace(/\.txt$/, '');
    let description = name;

    try {
      const content = fs.readFileSync(path.join(patternsDir, file), 'utf8');
      const firstLine = content.split(/\r?\n/)[0];
      if (firstLine && firstLine.startsWith('# ')) {
        description = firstLine.slice(2).trim();
      }
    } catch {
      // If we can't read the file, fall back to the name
    }

    return { name, description };
  });

  // Step C: Build the result
  const result = {
    technologies,
    count: technologies.length
  };

  // Step D: Format the output
  if (context.flags.format === 'json') {
    context.output.out(result);
  } else {
    // Calculate padding for aligned columns
    const maxNameLength = Math.max(...technologies.map(t => t.name.length));

    context.output.info('Available technologies:');
    for (const tech of technologies) {
      const paddedName = tech.name.padEnd(maxNameLength + 2);
      context.output.info(`  ${paddedName}${tech.description}`);
    }
    context.output.info('');
    context.output.info('Use "dev ignore add <technology>" to add patterns to .gitignore.');
  }
}

module.exports = { meta, run };
