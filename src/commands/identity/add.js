'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const CONFIG_FILE = path.join(os.homedir(), '.devutils', 'config.json');

const meta = {
  description: 'Create a new identity profile.',
  arguments: [
    { name: 'name', description: 'Short name for this identity (e.g., personal, work)', required: true },
  ],
  flags: [
    { name: 'email', description: 'Git author email (required)' },
    { name: 'ssh-key', description: 'Path to SSH private key file' },
    { name: 'gpg-key', description: 'GPG key ID for commit signing' },
    { name: 'generate-key', description: 'Generate a new SSH key pair for this identity' },
  ],
};

async function run(args, context) {
  const identityName = args.positional[0];
  if (!identityName) {
    context.errors.throwError(400, 'Missing identity name. Usage: dev identity add <name> --email <email>', 'identity');
    return;
  }

  // Validate name format
  if (!/^[a-z0-9][a-z0-9-]*$/.test(identityName)) {
    context.errors.throwError(400, 'Identity name must be lowercase letters, numbers, and hyphens only.', 'identity');
    return;
  }

  const email = args.flags.email;
  if (!email) {
    context.errors.throwError(400, 'Email is required. Use --email your@email.com.', 'identity');
    return;
  }

  // Load config
  if (!fs.existsSync(CONFIG_FILE)) {
    context.errors.throwError(404, 'Config not found. Run "dev config init" first.', 'identity');
    return;
  }
  const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  const identities = config.identities || [];

  // Check for duplicates (case-insensitive)
  if (identities.some(id => id.name.toLowerCase() === identityName.toLowerCase())) {
    context.errors.throwError(400, `Identity '${identityName}' already exists. Use a different name or remove it first.`, 'identity');
    return;
  }

  // Handle SSH key
  let sshKeyPath = null;
  const sshKeyFlag = args.flags['ssh-key'];
  const generateKey = args.flags['generate-key'];

  if (sshKeyFlag && generateKey) {
    context.errors.throwError(400, 'Provide either --ssh-key or --generate-key, not both.', 'identity');
    return;
  }

  if (sshKeyFlag) {
    const resolved = path.resolve(sshKeyFlag);
    if (!fs.existsSync(resolved)) {
      context.errors.throwError(404, `SSH key file not found: ${resolved}`, 'identity');
      return;
    }
    sshKeyPath = resolved;
  } else if (generateKey) {
    sshKeyPath = await generateSshKey(identityName, email, context);
    if (!sshKeyPath) return; // Error already reported
  }

  // Handle GPG key
  const gpgKey = args.flags['gpg-key'] || null;

  // Build identity
  const identity = {
    name: identityName,
    email: email,
    sshKey: sshKeyPath,
    gpgKey: gpgKey,
    folders: [],
  };

  // Save
  identities.push(identity);
  config.identities = identities;
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2) + '\n');

  context.output.info(`Identity '${identityName}' created.`);
  context.output.out(identity);
}

/**
 * Generates an ED25519 SSH key pair for the given identity.
 * @param {string} name - The identity name (used in the key filename).
 * @param {string} email - The email (used as the key comment).
 * @param {object} context - The command context.
 * @returns {Promise<string|null>} The key path, or null on failure.
 */
async function generateSshKey(name, email, context) {
  const sshDir = path.join(os.homedir(), '.ssh');
  if (!fs.existsSync(sshDir)) {
    fs.mkdirSync(sshDir, { mode: 0o700 });
  }

  const keyPath = path.join(sshDir, `id_ed25519_${name}`);
  if (fs.existsSync(keyPath)) {
    context.errors.throwError(400, `SSH key already exists at ${keyPath}. Use --ssh-key ${keyPath} to reference it.`, 'identity');
    return null;
  }

  const result = await context.shell.exec(
    `ssh-keygen -t ed25519 -C "${email}" -f "${keyPath}" -N ""`
  );

  if (result.exitCode !== 0) {
    context.errors.throwError(500, `Failed to generate SSH key: ${result.stderr}`, 'identity');
    return null;
  }

  context.output.info(`SSH key generated: ${keyPath}`);
  context.output.info(`Public key: ${keyPath}.pub`);
  context.output.info('Add the public key to your GitHub account at https://github.com/settings/keys');

  return keyPath;
}

module.exports = { meta, run };
