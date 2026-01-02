#!/usr/bin/env node

/**
 * @fileoverview Configure command - Create the initial .devutils configuration
 * file with user information.
 */

const { Command } = require('commander');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const CONFIG_FILE = path.join(process.env.HOME || process.env.USERPROFILE, '.devutils');

/**
 * Create readline interface for prompts
 * @returns {readline.Interface}
 */
function createPrompt() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

/**
 * Prompt user for input
 * @param {readline.Interface} rl - Readline interface
 * @param {string} question - Question to ask
 * @param {string} [defaultValue] - Default value if empty
 * @returns {Promise<string>}
 */
function ask(rl, question, defaultValue) {
  return new Promise(resolve => {
    const prompt = defaultValue ? `${question} [${defaultValue}]: ` : `${question}: `;
    rl.question(prompt, answer => {
      resolve(answer.trim() || defaultValue || '');
    });
  });
}

/**
 * Prompt user for confirmation
 * @param {readline.Interface} rl - Readline interface
 * @param {string} question - Question to ask
 * @returns {Promise<boolean>}
 */
function confirm(rl, question) {
  return new Promise(resolve => {
    rl.question(`${question} (y/n): `, answer => {
      resolve(answer.toLowerCase().startsWith('y'));
    });
  });
}

/**
 * Load existing configuration
 * @returns {object|null}
 */
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const content = fs.readFileSync(CONFIG_FILE, 'utf8');
      return JSON.parse(content);
    }
  } catch (err) {
    // Invalid JSON or read error
  }
  return null;
}

/**
 * Save configuration to file
 * @param {object} config - Configuration object
 */
function saveConfig(config) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2) + '\n');
}

/**
 * Display current configuration
 * @param {object} config - Configuration object
 */
function displayConfig(config) {
  console.log('\nCurrent Configuration:');
  console.log('─'.repeat(40));

  if (config.user) {
    console.log('User:');
    console.log(`  Name:  ${config.user.name || '(not set)'}`);
    console.log(`  Email: ${config.user.email || '(not set)'}`);
    console.log(`  URL:   ${config.user.url || '(not set)'}`);
  }

  console.log('\nConfig file:', CONFIG_FILE);
  if (config.created) {
    console.log(`Created:     ${new Date(config.created).toLocaleString()}`);
  }
  if (config.updated) {
    console.log(`Updated:     ${new Date(config.updated).toLocaleString()}`);
  }
  console.log('');
}

/**
 * Run the configure command
 * @param {object} options - Command options
 */
async function runConfigure(options) {
  const existingConfig = loadConfig();

  // Show existing config if requested
  if (options.show) {
    if (existingConfig) {
      displayConfig(existingConfig);
    } else {
      console.log('\nNo configuration found.');
      console.log(`Run 'dev configure' to create ${CONFIG_FILE}\n`);
    }
    return;
  }

  let name = options.name;
  let email = options.email;
  let url = options.url;

  // If all required params provided via CLI, skip interactive mode
  const hasAllRequired = name && email;

  if (!hasAllRequired) {
    // Check for existing config
    if (existingConfig && !options.force) {
      console.log('\nExisting configuration found:');
      displayConfig(existingConfig);

      const rl = createPrompt();
      const shouldUpdate = await confirm(rl, 'Do you want to update this configuration?');
      rl.close();

      if (!shouldUpdate) {
        console.log('Configuration unchanged.');
        return;
      }
    }

    const rl = createPrompt();

    console.log('\n--- Developer Profile Setup ---\n');

    // Get user information (use CLI args as defaults if provided)
    name = await ask(rl, 'Name (required)', name || existingConfig?.user?.name);
    if (!name) {
      console.error('\nError: Name is required.');
      rl.close();
      process.exit(1);
    }

    email = await ask(rl, 'Email (required)', email || existingConfig?.user?.email);
    if (!email) {
      console.error('\nError: Email is required.');
      rl.close();
      process.exit(1);
    }

    url = await ask(rl, 'URL (optional)', url || existingConfig?.user?.url);

    rl.close();
  }

  // Build config object
  const now = new Date().toISOString();
  const config = {
    user: {
      name,
      email,
      ...(url && { url })
    },
    created: existingConfig?.created || now,
    updated: now
  };

  // Save configuration
  saveConfig(config);

  console.log(`\nConfiguration saved to ${CONFIG_FILE}`);
  displayConfig(config);
}

// Create and configure the command
const configure = new Command('configure')
  .description('Configure developer profile and create ~/.devutils')
  .option('--name <name>', 'Developer name')
  .option('--email <email>', 'Developer email')
  .option('--url <url>', 'Developer URL (optional)')
  .option('--force', 'Overwrite existing config without prompting')
  .option('-s, --show', 'Display current configuration')
  .action(runConfigure);

module.exports = configure;
