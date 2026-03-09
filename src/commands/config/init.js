'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const DEVUTILS_DIR = path.join(os.homedir(), '.devutils');
const CONFIG_FILE = path.join(DEVUTILS_DIR, 'config.json');

const meta = {
  description: 'First-run onboarding wizard. Sets up ~/.devutils/ and creates config.json.',
  arguments: [],
  flags: [
    { name: 'force', type: 'boolean', description: 'Re-run setup even if already configured' },
    { name: 'profile', type: 'string', description: 'Set the profile name (skip the prompt)' },
  ],
};

/**
 * Detects the user's shell config file path for PATH modification.
 * @returns {{ shell: string, file: string }|null}
 */
function getShellConfig() {
  const shell = process.env.SHELL || '';
  const home = os.homedir();

  if (shell.includes('zsh')) {
    return { shell: 'zsh', file: path.join(home, '.zshrc') };
  }
  if (shell.includes('bash')) {
    return { shell: 'bash', file: path.join(home, '.bashrc') };
  }
  if (shell.includes('fish')) {
    return { shell: 'fish', file: path.join(home, '.config', 'fish', 'config.fish') };
  }
  return null;
}

/**
 * Adds the devutils bin directory to the user's PATH via shell config.
 * Idempotent: checks if the line is already present before adding.
 * @param {string} shellFile - The shell config file path.
 */
function addToPathFile(shellFile) {
  const exportLine = 'export PATH="$HOME/.devutils/bin:$PATH"';

  // Create the file if it doesn't exist
  if (!fs.existsSync(shellFile)) {
    fs.mkdirSync(path.dirname(shellFile), { recursive: true });
    fs.writeFileSync(shellFile, '', 'utf8');
  }

  const content = fs.readFileSync(shellFile, 'utf8');

  // Check if the line is already there
  if (content.includes('.devutils/bin')) {
    return false; // Already present
  }

  fs.appendFileSync(shellFile, '\n# DevUtils CLI\n' + exportLine + '\n');
  return true; // Added
}

async function run(args, context) {
  // Check if already configured
  if (fs.existsSync(CONFIG_FILE) && !args.flags.force) {
    context.output.info('DevUtils is already configured. Use --force to re-run setup.');
    return;
  }

  // Create the directory structure
  fs.mkdirSync(path.join(DEVUTILS_DIR, 'machines'), { recursive: true });
  fs.mkdirSync(path.join(DEVUTILS_DIR, 'bin'), { recursive: true });
  fs.mkdirSync(path.join(DEVUTILS_DIR, 'auth'), { recursive: true });
  fs.mkdirSync(path.join(DEVUTILS_DIR, 'plugins'), { recursive: true });
  fs.mkdirSync(path.join(DEVUTILS_DIR, 'utils'), { recursive: true });
  fs.mkdirSync(path.join(DEVUTILS_DIR, 'cache'), { recursive: true });

  // Prompt for user info
  const name = await context.prompt.ask('Your full name', '');
  const email = await context.prompt.ask('Your email address', '');
  const url = await context.prompt.ask('Your URL (optional)', '');

  // Prompt for backup backend
  const backupBackend = await context.prompt.choose(
    'Where should DevUtils store configuration backups?',
    ['repo', 'gist'],
    0
  );

  // Prompt for profile name
  const profile = args.flags.profile || await context.prompt.ask('Profile name for this machine', 'default');

  // Build and write config
  const config = {
    user: {
      name: name,
      email: email,
      url: url,
    },
    defaults: {
      license: 'MIT',
      packageManager: 'npm',
    },
    backup: {
      backend: backupBackend,
      location: null,
    },
    profile: profile,
  };

  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2) + '\n');

  // Offer to add ~/.devutils/bin to PATH
  const shellConfig = getShellConfig();
  if (shellConfig) {
    const addToPath = await context.prompt.confirm(
      'Add ~/.devutils/bin to your PATH? (required for aliases to work)',
      true
    );
    if (addToPath) {
      const added = addToPathFile(shellConfig.file);
      if (added) {
        context.output.info(`Added to ${shellConfig.file}. Restart your terminal or run: source ${shellConfig.file}`);
      } else {
        context.output.info('PATH entry already exists. No changes made.');
      }
    }
  }

  // Print summary
  context.output.info('');
  context.output.info('DevUtils configured successfully!');
  context.output.info('');
  context.output.info(`  Name:     ${name || '(not set)'}`);
  context.output.info(`  Email:    ${email || '(not set)'}`);
  context.output.info(`  Profile:  ${profile}`);
  context.output.info(`  Backup:   ${backupBackend}`);
  context.output.info(`  Config:   ${CONFIG_FILE}`);
  context.output.info('');
}

module.exports = { meta, run };
