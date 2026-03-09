'use strict';

const path = require('path');
const fs = require('fs');
const { MARKER_START_PREFIX, MARKER_END_PREFIX } = require('./markers');

const meta = {
  description: 'Show managed gitignore sections in the current directory',
  arguments: [],
  flags: [
    { name: 'path', description: 'Target directory (defaults to current directory)', type: 'string', default: '.' }
  ]
};

/**
 * Scans the .gitignore in the target directory and reports which
 * DevUtils-managed sections are present, including the technology name,
 * pattern line count, and line range for each section. Also counts
 * unmanaged lines (lines outside any DevUtils section that are not blank
 * or comments).
 *
 * @param {object} args - Parsed command arguments ({ positional, flags }).
 * @param {object} context - The DevUtils context object.
 */
async function run(args, context) {
  // Step A: Resolve the .gitignore path
  const flagPath = args.flags.path || '.';
  const gitignorePath = path.resolve(flagPath, '.gitignore');

  // Step B: Read the file
  if (!fs.existsSync(gitignorePath)) {
    if (context.flags.format === 'json') {
      context.output.out({
        path: gitignorePath,
        sections: [],
        count: 0,
        unmanagedLines: 0,
        message: `No .gitignore found at ${path.resolve(flagPath)}.`
      });
    } else {
      context.output.info(`No .gitignore found at ${path.resolve(flagPath)}.`);
    }
    return;
  }

  const content = fs.readFileSync(gitignorePath, 'utf8');
  const lines = content.split(/\r?\n/);

  // Step C: Parse managed sections
  const sections = [];
  const managedLineIndices = new Set();
  let i = 0;

  while (i < lines.length) {
    const trimmedLine = lines[i].trim();

    if (trimmedLine.startsWith(MARKER_START_PREFIX)) {
      // Found a start marker -- extract the technology name
      const technology = trimmedLine.slice(MARKER_START_PREFIX.length);
      const startLine = i + 1; // 1-indexed
      managedLineIndices.add(i);

      // Find the corresponding end marker
      const expectedEnd = `# <<< devutils:${technology}`;
      let endIdx = -1;

      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].trim() === expectedEnd) {
          endIdx = j;
          break;
        }
      }

      if (endIdx !== -1) {
        // Mark all lines in this section as managed
        for (let k = i; k <= endIdx; k++) {
          managedLineIndices.add(k);
        }

        const patternLineCount = endIdx - i - 1; // lines between markers
        const endLine = endIdx + 1; // 1-indexed

        sections.push({
          technology,
          lines: patternLineCount,
          startLine,
          endLine
        });

        i = endIdx + 1;
      } else {
        // Orphaned start marker -- no matching end
        sections.push({
          technology,
          lines: null,
          startLine,
          endLine: null,
          error: 'Missing end marker'
        });
        i++;
      }
    } else if (trimmedLine.startsWith(MARKER_END_PREFIX)) {
      // Orphaned end marker -- no matching start
      const technology = trimmedLine.slice(MARKER_END_PREFIX.length);
      managedLineIndices.add(i);
      sections.push({
        technology,
        lines: null,
        startLine: null,
        endLine: i + 1, // 1-indexed
        error: 'Missing start marker'
      });
      i++;
    } else {
      i++;
    }
  }

  // Step D: Count unmanaged lines (not blank, not comments, not in a section)
  let unmanagedLines = 0;
  for (let idx = 0; idx < lines.length; idx++) {
    if (managedLineIndices.has(idx)) continue;
    const trimmed = lines[idx].trim();
    if (trimmed === '') continue;
    if (trimmed.startsWith('#')) continue;
    unmanagedLines++;
  }

  // Step E: Build the result
  const result = {
    path: gitignorePath,
    sections,
    count: sections.length,
    unmanagedLines
  };

  // Step F: Format the output
  if (context.flags.format === 'json') {
    context.output.out(result);
  } else {
    if (sections.length === 0) {
      context.output.info('No DevUtils-managed sections found in .gitignore.');
    } else {
      // Calculate padding for aligned columns
      const maxNameLength = Math.max(...sections.map(s => s.technology.length));
      const maxLinesLength = Math.max(...sections.map(s => s.lines !== null ? String(s.lines).length : 1));

      context.output.info('Managed sections in .gitignore:');
      for (const section of sections) {
        if (section.error) {
          const paddedName = section.technology.padEnd(maxNameLength + 2);
          context.output.info(`  ${paddedName}[${section.error}]`);
        } else {
          const paddedName = section.technology.padEnd(maxNameLength + 2);
          const paddedLines = String(section.lines).padStart(maxLinesLength);
          context.output.info(`  ${paddedName}${paddedLines} patterns  (lines ${section.startLine}-${section.endLine})`);
        }
      }
      context.output.info('');
      context.output.info(`${sections.length} managed section${sections.length === 1 ? '' : 's'}.`);
    }

    if (unmanagedLines > 0) {
      context.output.info(`Plus ${unmanagedLines} unmanaged line${unmanagedLines === 1 ? '' : 's'}.`);
    }
  }
}

module.exports = { meta, run };
