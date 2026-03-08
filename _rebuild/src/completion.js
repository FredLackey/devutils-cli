#!/usr/bin/env node

/**
 * @fileoverview Tab completion handler for the dev CLI.
 * Provides shell completion for bash, zsh, and fish.
 */

const fs = require('fs');
const path = require('path');

/**
 * Command completion definitions
 * Maps parent commands to their available subcommands
 */
const COMMANDS = {
  '': ['configure', 'status', 'identity', 'ignore', 'install', 'completion'],
  'dev': ['configure', 'status', 'identity', 'ignore', 'install', 'completion'],
  'identity': ['add', 'remove', 'link'],
  'completion': ['install', 'uninstall']
};

/**
 * Command descriptions for enhanced completion (zsh/fish)
 */
const DESCRIPTIONS = {
  'configure': 'Interactive configuration wizard',
  'status': 'Display current configuration',
  'identity': 'Manage identity profiles',
  'ignore': 'Append patterns to .gitignore',
  'install': 'Install development tools',
  'completion': 'Manage shell completion',
  'add': 'Add a new identity profile',
  'remove': 'Remove an identity profile',
  'link': 'Link identity to a source folder'
};

/**
 * Get available ignore technologies by scanning src/ignore directory
 * @returns {string[]} Array of technology names
 */
function getIgnoreTechnologies() {
  try {
    const ignoreDir = path.join(__dirname, 'ignore');
    if (!fs.existsSync(ignoreDir)) {
      return [];
    }
    return fs.readdirSync(ignoreDir)
      .filter(file => file.endsWith('.txt'))
      .map(file => file.replace('.txt', ''));
  } catch {
    return [];
  }
}

/**
 * Get available install scripts by scanning src/installs directory
 * @returns {string[]} Array of install script names
 */
function getInstallScripts() {
  try {
    const installsDir = path.join(__dirname, 'installs');
    if (!fs.existsSync(installsDir)) {
      return [];
    }
    return fs.readdirSync(installsDir)
      .filter(file => file.endsWith('.js'))
      .map(file => file.replace('.js', ''));
  } catch {
    return [];
  }
}

/**
 * Parse completion environment variables
 * @returns {object} Parsed environment with line, words, prev, etc.
 */
function parseEnv() {
  const line = process.env.COMP_LINE || '';
  const point = parseInt(process.env.COMP_POINT || line.length, 10);
  const partial = line.slice(0, point);
  const words = partial.split(/\s+/).filter(Boolean);
  const lastPartial = partial.endsWith(' ') ? '' : (words[words.length - 1] || '');
  const prev = words.length > 1 ? words[words.length - (partial.endsWith(' ') ? 1 : 2)] : '';

  return {
    line,
    point,
    words,
    prev,
    lastPartial,
    wordCount: words.length
  };
}

/**
 * Output completions in the format expected by shells
 * @param {string[]|object[]} completions - Array of completion strings or objects with name/description
 */
function logCompletions(completions) {
  completions.forEach(item => {
    if (typeof item === 'string') {
      console.log(item);
    } else {
      // For zsh/fish: name:description format
      console.log(`${item.name}:${item.description || ''}`);
    }
  });
}

/**
 * Handle tab completion request
 * Called when COMP_LINE environment variable is present
 */
function handleCompletion() {
  const env = parseEnv();
  let completions = [];

  // Determine what completions to provide based on context
  if (env.prev === 'ignore') {
    completions = getIgnoreTechnologies();
  } else if (env.prev === 'install') {
    completions = getInstallScripts();
  } else if (COMMANDS[env.prev]) {
    completions = COMMANDS[env.prev];
  } else if (env.wordCount <= 2) {
    completions = COMMANDS['dev'];
  }

  // Filter completions by partial match
  if (env.lastPartial && !env.line.endsWith(' ')) {
    completions = completions.filter(c =>
      c.toLowerCase().startsWith(env.lastPartial.toLowerCase())
    );
  }

  // Add descriptions if available
  const withDescriptions = completions.map(name => ({
    name,
    description: DESCRIPTIONS[name] || ''
  }));

  logCompletions(withDescriptions);
}

/**
 * Install shell tab completion
 * Adds completion script to user's shell configuration
 */
async function installCompletion() {
  const shell = process.env.SHELL || '';
  const home = process.env.HOME || process.env.USERPROFILE;

  let rcFile;
  let completionScript;

  if (shell.includes('zsh')) {
    rcFile = path.join(home, '.zshrc');
    completionScript = `
# @fredlackey/devutils completion
_dev_completions() {
  local IFS=$'\\n'
  COMPREPLY=($(COMP_LINE="$COMP_LINE" COMP_POINT="$COMP_POINT" dev))
}
complete -F _dev_completions dev
`;
  } else if (shell.includes('bash')) {
    rcFile = path.join(home, '.bashrc');
    completionScript = `
# @fredlackey/devutils completion
_dev_completions() {
  local IFS=$'\\n'
  COMPREPLY=($(COMP_LINE="$COMP_LINE" COMP_POINT="$COMP_POINT" dev))
}
complete -F _dev_completions dev
`;
  } else if (shell.includes('fish')) {
    rcFile = path.join(home, '.config', 'fish', 'config.fish');
    completionScript = `
# @fredlackey/devutils completion
complete -c dev -f -a "(COMP_LINE=(commandline) COMP_POINT=(commandline -C) dev)"
`;
  } else {
    console.error('Unsupported shell. Supported shells: bash, zsh, fish');
    process.exit(1);
  }

  try {
    // Check if completion is already installed
    if (fs.existsSync(rcFile)) {
      const content = fs.readFileSync(rcFile, 'utf8');
      if (content.includes('@fredlackey/devutils completion')) {
        console.log('Tab completion is already installed.');
        return;
      }
    }

    // Append completion script
    fs.appendFileSync(rcFile, '\n' + completionScript);
    console.log(`Tab completion installed in ${rcFile}`);
    console.log('Restart your shell or run:');
    console.log(`  source ${rcFile}`);
  } catch (err) {
    console.error('Failed to install completion:', err.message);
    process.exit(1);
  }
}

/**
 * Uninstall shell tab completion
 * Removes completion script from user's shell configuration
 */
async function uninstallCompletion() {
  const shell = process.env.SHELL || '';
  const home = process.env.HOME || process.env.USERPROFILE;

  let rcFile;
  if (shell.includes('zsh')) {
    rcFile = path.join(home, '.zshrc');
  } else if (shell.includes('bash')) {
    rcFile = path.join(home, '.bashrc');
  } else if (shell.includes('fish')) {
    rcFile = path.join(home, '.config', 'fish', 'config.fish');
  } else {
    console.error('Unsupported shell. Supported shells: bash, zsh, fish');
    process.exit(1);
  }

  try {
    if (!fs.existsSync(rcFile)) {
      console.log('Shell configuration file not found.');
      return;
    }

    let content = fs.readFileSync(rcFile, 'utf8');

    // Remove completion block
    const startMarker = '# @fredlackey/devutils completion';
    if (!content.includes(startMarker)) {
      console.log('Tab completion is not installed.');
      return;
    }

    // Remove the completion section (handles multi-line blocks)
    const lines = content.split('\n');
    const filteredLines = [];
    let inCompletionBlock = false;
    let braceCount = 0;

    for (const line of lines) {
      if (line.includes(startMarker)) {
        inCompletionBlock = true;
        continue;
      }
      if (inCompletionBlock) {
        if (line.includes('{')) braceCount++;
        if (line.includes('}')) braceCount--;
        if (line.includes('complete') && braceCount === 0) {
          inCompletionBlock = false;
          continue;
        }
        if (braceCount === 0 && line.trim() === '') {
          inCompletionBlock = false;
        }
        continue;
      }
      filteredLines.push(line);
    }

    fs.writeFileSync(rcFile, filteredLines.join('\n'));
    console.log(`Tab completion removed from ${rcFile}`);
    console.log('Restart your shell for changes to take effect.');
  } catch (err) {
    console.error('Failed to uninstall completion:', err.message);
    process.exit(1);
  }
}

module.exports = {
  handleCompletion,
  installCompletion,
  uninstallCompletion,
  getIgnoreTechnologies,
  getInstallScripts
};
