#!/usr/bin/env node

/**
 * @fileoverview Ignore command - Append technology-specific patterns to .gitignore.
 * Reads patterns from src/ignore/*.txt and adds them to the repository's .gitignore.
 */

const { Command } = require('commander');
const fs = require('fs');
const path = require('path');

const IGNORE_DIR = path.join(__dirname, '..', 'ignore');

/**
 * Get list of available ignore technologies
 * @returns {string[]} Array of technology names
 */
function getAvailableTechnologies() {
  try {
    if (!fs.existsSync(IGNORE_DIR)) {
      return [];
    }
    return fs.readdirSync(IGNORE_DIR)
      .filter(file => file.endsWith('.txt'))
      .map(file => file.replace('.txt', ''))
      .sort();
  } catch {
    return [];
  }
}

/**
 * Find the git root directory by walking up the tree
 * @param {string} startDir - Starting directory
 * @returns {string|null} Path to git root or null
 */
function findGitRoot(startDir) {
  let currentDir = path.resolve(startDir);
  const root = path.parse(currentDir).root;

  while (currentDir !== root) {
    const gitDir = path.join(currentDir, '.git');
    if (fs.existsSync(gitDir)) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }

  return null;
}

/**
 * Generate section markers for a technology
 * @param {string} technology - Technology name
 * @returns {{ start: string, end: string }}
 */
function getSectionMarkers(technology) {
  return {
    start: `# === @fredlackey/devutils: ${technology} ===`,
    end: `# === end: ${technology} ===`
  };
}

/**
 * Check if patterns for a technology are already in .gitignore
 * @param {string} gitignoreContent - Content of .gitignore
 * @param {string} technology - Technology name
 * @returns {boolean}
 */
function hasPatterns(gitignoreContent, technology) {
  const markers = getSectionMarkers(technology);
  return gitignoreContent.includes(markers.start);
}

/**
 * Remove existing patterns for a technology from .gitignore
 * @param {string} gitignoreContent - Content of .gitignore
 * @param {string} technology - Technology name
 * @returns {string} Updated content
 */
function removePatterns(gitignoreContent, technology) {
  const markers = getSectionMarkers(technology);
  const lines = gitignoreContent.split('\n');
  const result = [];
  let inSection = false;

  for (const line of lines) {
    if (line.trim() === markers.start) {
      inSection = true;
      continue;
    }
    if (line.trim() === markers.end) {
      inSection = false;
      continue;
    }
    if (!inSection) {
      result.push(line);
    }
  }

  // Remove trailing empty lines that were before the section
  while (result.length > 0 && result[result.length - 1] === '') {
    result.pop();
  }

  return result.join('\n');
}

/**
 * List all available technologies
 */
function listTechnologies() {
  const technologies = getAvailableTechnologies();

  if (technologies.length === 0) {
    console.log('\nNo ignore patterns available.');
    console.log(`Pattern files should be placed in: ${IGNORE_DIR}\n`);
    return;
  }

  console.log('\nAvailable technologies:');
  console.log('─'.repeat(40));

  for (const tech of technologies) {
    console.log(`  ${tech}`);
  }

  console.log(`\nUsage: dev ignore <technology> [folder]`);
  console.log('');
}

/**
 * Run the ignore command
 * @param {string} technology - Technology name
 * @param {string} folder - Optional folder path for .gitignore
 * @param {object} options - Command options
 */
async function runIgnore(technology, folder, options) {
  // Handle --list option
  if (options.list) {
    listTechnologies();
    return;
  }

  // Validate technology argument
  if (!technology) {
    console.error('\nError: No technology specified.');
    console.log('Usage: dev ignore <technology> [folder]');
    console.log('Run `dev ignore --list` to see available options.\n');
    process.exit(1);
  }

  // Check if technology pattern file exists
  const patternFile = path.join(IGNORE_DIR, `${technology}.txt`);
  if (!fs.existsSync(patternFile)) {
    console.error(`\nError: Unknown technology "${technology}".`);
    console.log('Run `dev ignore --list` to see available options.\n');
    process.exit(1);
  }

  // Determine target directory for .gitignore
  let targetDir;
  if (folder) {
    // Use specified folder path
    targetDir = path.resolve(folder);
    if (!fs.existsSync(targetDir)) {
      console.error(`\nError: Folder "${folder}" does not exist.\n`);
      process.exit(1);
    }
    if (!fs.statSync(targetDir).isDirectory()) {
      console.error(`\nError: "${folder}" is not a directory.\n`);
      process.exit(1);
    }
  } else {
    // Find git root (default behavior)
    targetDir = findGitRoot(process.cwd());
    if (!targetDir) {
      console.error('\nError: No git repository found.');
      console.log('Initialize with `git init` or specify a folder path.\n');
      process.exit(1);
    }
  }

  const gitignorePath = path.join(targetDir, '.gitignore');

  // Read existing .gitignore content
  let gitignoreContent = '';
  if (fs.existsSync(gitignorePath)) {
    gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  }

  // Check for existing patterns
  if (hasPatterns(gitignoreContent, technology)) {
    if (options.force) {
      // Remove existing patterns to replace them
      gitignoreContent = removePatterns(gitignoreContent, technology);
      console.log(`Replacing existing patterns for ${technology}...`);
    } else {
      console.log(`\nPatterns for ${technology} already present in .gitignore`);
      console.log('Use --force to replace existing patterns.\n');
      return;
    }
  }

  // Read pattern file
  const patterns = fs.readFileSync(patternFile, 'utf8');
  const markers = getSectionMarkers(technology);

  // Build the section to add
  const section = `\n${markers.start}\n${patterns.trim()}\n${markers.end}\n`;

  // Show dry run output
  if (options.dryRun) {
    console.log(`\n[Dry run] Would append to ${gitignorePath}:`);
    console.log('─'.repeat(40));
    console.log(section);
    console.log('─'.repeat(40));
    return;
  }

  // Append to .gitignore
  const newContent = gitignoreContent.trimEnd() + section;
  fs.writeFileSync(gitignorePath, newContent);

  console.log(`\nAdded ${technology} patterns to ${gitignorePath}`);

  // Show what was added (if verbose)
  if (options.verbose) {
    console.log('\nPatterns added:');
    console.log('─'.repeat(40));
    console.log(patterns.trim());
    console.log('');
  }
}

// Create and configure the command
const ignore = new Command('ignore')
  .description('Append technology-specific patterns to .gitignore')
  .argument('[technology]', 'Technology name (e.g., node, python, macos)')
  .argument('[folder]', 'Target folder for .gitignore (defaults to git root)')
  .option('--list', 'List all available technologies')
  .option('--dry-run', 'Show what would be added without modifying files')
  .option('--force', 'Re-add patterns even if section already exists')
  .option('--verbose', 'Show detailed output')
  .action(runIgnore);

module.exports = ignore;
