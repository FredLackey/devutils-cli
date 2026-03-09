'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const CONFIG_FILE = path.join(os.homedir(), '.devutils', 'config.json');

const SSH_START = '# >>> DevUtils Managed SSH Config - DO NOT EDIT BETWEEN MARKERS >>>';
const SSH_END = '# <<< DevUtils Managed SSH Config <<<';
const GIT_START = '# >>> DevUtils Managed Git Config - DO NOT EDIT BETWEEN MARKERS >>>';
const GIT_END = '# <<< DevUtils Managed Git Config <<<';

const meta = {
  description: 'Regenerate SSH config and git config from identity definitions.',
  arguments: [],
  flags: [
    { name: 'dry-run', description: 'Show what would be written without making changes' },
  ],
};

/**
 * Builds SSH config blocks for an identity.
 * @param {object} identity - The identity object.
 * @returns {string} The SSH config block text.
 */
function buildSshConfigBlock(identity) {
  const remotes = [...new Set((identity.folders || []).map(f => f.remote || 'github.com'))];
  const blocks = [];

  for (const remote of remotes) {
    blocks.push([
      `# DevUtils managed - ${identity.name}`,
      `Host ${remote}-${identity.name}`,
      `  HostName ${remote}`,
      `  User git`,
      `  IdentityFile ${identity.sshKey}`,
      `  IdentitiesOnly yes`,
    ].join('\n'));
  }

  return blocks.join('\n\n');
}

/**
 * Updates a config file by replacing content between markers or appending.
 * @param {string} filePath - The file to update.
 * @param {string} startMarker - The start marker.
 * @param {string} endMarker - The end marker.
 * @param {string} newContent - The new content between markers.
 * @param {boolean} dryRun - If true, don't write the file.
 * @param {object} [writeOpts] - Options for writeFileSync (e.g., mode).
 * @returns {string} The full file content.
 */
function updateManagedSection(filePath, startMarker, endMarker, newContent, dryRun, writeOpts = {}) {
  let existing = '';
  if (fs.existsSync(filePath)) {
    existing = fs.readFileSync(filePath, 'utf8');
  }

  const startIdx = existing.indexOf(startMarker);
  const endIdx = existing.indexOf(endMarker);

  let updated;
  if (startIdx !== -1 && endIdx !== -1) {
    updated = existing.substring(0, startIdx) +
      startMarker + '\n' + newContent + '\n' + endMarker +
      existing.substring(endIdx + endMarker.length);
  } else {
    updated = existing.trimEnd() + '\n\n' +
      startMarker + '\n' + newContent + '\n' + endMarker + '\n';
  }

  if (!dryRun) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { mode: 0o700, recursive: true });
    }
    fs.writeFileSync(filePath, updated, writeOpts);
  }

  return updated;
}

async function run(args, context) {
  const dryRun = args.flags['dry-run'] || context.flags.dryRun;

  if (!fs.existsSync(CONFIG_FILE)) {
    context.errors.throwError(404, 'Config not found. Run "dev config init" first.', 'identity');
    return;
  }
  const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  const identities = config.identities || [];

  if (identities.length === 0) {
    context.output.info('No identities configured. Nothing to sync.');
    return;
  }

  // Build SSH config
  const sshBlocks = [];
  for (const id of identities) {
    if (!id.sshKey) {
      context.output.info(`Warning: Skipping SSH config for '${id.name}' (no SSH key configured).`);
      continue;
    }
    if ((id.folders || []).length === 0) {
      context.output.info(`Warning: Identity '${id.name}' has no linked folders.`);
    }
    sshBlocks.push(buildSshConfigBlock(id));
  }

  const sshConfigPath = path.join(os.homedir(), '.ssh', 'config');
  const sshContent = sshBlocks.join('\n\n');

  if (dryRun) {
    context.output.info('=== SSH Config (dry run) ===');
    context.output.info(sshContent || '(no SSH entries)');
  } else if (sshContent) {
    updateManagedSection(sshConfigPath, SSH_START, SSH_END, sshContent, false, { mode: 0o600 });
    context.output.info(`SSH config updated: ${sshConfigPath}`);
  }

  // Build git config includes
  const gitConfigPath = path.join(os.homedir(), '.gitconfig');
  const includeLines = [];

  for (const id of identities) {
    const folders = id.folders || [];
    if (folders.length === 0) continue;

    // Write per-identity gitconfig
    const idConfigPath = path.join(os.homedir(), `.gitconfig-${id.name}`);
    const lines = ['[user]', `  email = ${id.email}`];
    if (id.gpgKey) {
      lines.push(`  signingkey = ${id.gpgKey}`);
      lines.push('[commit]');
      lines.push('  gpgsign = true');
    }
    const idContent = lines.join('\n') + '\n';

    if (dryRun) {
      context.output.info(`\n=== ${idConfigPath} (dry run) ===`);
      context.output.info(idContent);
    } else {
      fs.writeFileSync(idConfigPath, idContent);
    }

    // Build includeIf entries for each unique folder
    for (const f of folders) {
      const folderPath = f.path.endsWith('/') ? f.path : f.path + '/';
      includeLines.push(`[includeIf "gitdir:${folderPath}"]`);
      includeLines.push(`  path = ${idConfigPath}`);
    }
  }

  const gitIncludeContent = includeLines.join('\n');

  if (dryRun) {
    context.output.info('\n=== Git Config includes (dry run) ===');
    context.output.info(gitIncludeContent || '(no git config entries)');
  } else if (gitIncludeContent) {
    updateManagedSection(gitConfigPath, GIT_START, GIT_END, gitIncludeContent, false);
    context.output.info(`Git config updated: ${gitConfigPath}`);
  }

  if (!dryRun) {
    context.output.info('Sync complete.');
  }
}

module.exports = { meta, run };
