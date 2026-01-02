#!/usr/bin/env node

/**
 * @fileoverview Identity command - Manage identity profiles for git configuration,
 * SSH keys, and GPG signing.
 *
 * @depends-on SSH key generation:
 *   - macOS:        ssh-keygen (built-in, part of OpenSSH)
 *   - Ubuntu/Debian: ssh-keygen (openssh-client package)
 *   - Raspberry Pi:  ssh-keygen (openssh-client package)
 *   - Amazon Linux:  ssh-keygen (openssh-clients package)
 *   - RHEL/Fedora:   ssh-keygen (openssh-clients package)
 *   - Windows:       ssh-keygen (OpenSSH via Windows Features, or Git Bash)
 *   - WSL:           ssh-keygen (openssh-client package)
 *
 * @depends-on GPG key generation:
 *   - macOS:        gpg (gnupg via Homebrew), pinentry-mac (for GUI passphrase prompts)
 *   - Ubuntu/Debian: gpg (gnupg package)
 *   - Raspberry Pi:  gpg (gnupg package)
 *   - Amazon Linux:  gpg (gnupg2 package)
 *   - RHEL/Fedora:   gpg (gnupg2 package)
 *   - Windows:       gpg (Gpg4win via Chocolatey, or gnupg via winget)
 *   - WSL:           gpg (gnupg package)
 */

const { Command } = require('commander');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync, spawn } = require('child_process');

const shell = require('../utils/common/shell');
const osUtils = require('../utils/common/os');
const opensshInstall = require('../installs/openssh');
const gpgInstall = require('../installs/gpg');

const HOME_DIR = process.env.HOME || process.env.USERPROFILE;
const CONFIG_FILE = path.join(HOME_DIR, '.devutils');
const SSH_DIR = path.join(HOME_DIR, '.ssh');
const SSH_CONFIG_FILE = path.join(SSH_DIR, 'config');
const GITCONFIG_FILE = path.join(HOME_DIR, '.gitconfig');

// ============================================================================
// URL and Argument Parsing Utilities
// ============================================================================

/**
 * Parse a remote URL and extract components
 * Supports: https://github.com/org, https://gitlab.com:8443/org,
 *           git@github.com:org, ssh://git@gitlab.com:2222/org
 * @param {string} url - Remote URL to parse
 * @returns {{ host: string, port: number|null, pathPrefix: string, isSSH: boolean }|null}
 */
function parseRemoteUrl(url) {
  if (!url) return null;

  // SSH format: git@github.com:org/repo or git@github.com:org
  const sshMatch = url.match(/^git@([^:]+):(.+?)(?:\.git)?$/);
  if (sshMatch) {
    return {
      host: sshMatch[1],
      port: null,
      pathPrefix: sshMatch[2].replace(/\/$/, ''),
      isSSH: true
    };
  }

  // ssh:// format: ssh://git@github.com:2222/org or ssh://git@github.com/org
  const sshSchemeMatch = url.match(/^ssh:\/\/git@([^/:]+)(?::(\d+))?\/(.+?)(?:\.git)?$/);
  if (sshSchemeMatch) {
    return {
      host: sshSchemeMatch[1],
      port: sshSchemeMatch[2] ? parseInt(sshSchemeMatch[2], 10) : null,
      pathPrefix: sshSchemeMatch[3].replace(/\/$/, ''),
      isSSH: true
    };
  }

  // HTTPS format: https://github.com/org or https://gitlab.com:8443/org
  const httpsMatch = url.match(/^https?:\/\/([^/:]+)(?::(\d+))?(\/[^?#]*)?/);
  if (httpsMatch) {
    let pathPrefix = (httpsMatch[3] || '/').replace(/^\//, '').replace(/\/$/, '');
    // Remove .git suffix if present
    pathPrefix = pathPrefix.replace(/\.git$/, '');
    return {
      host: httpsMatch[1],
      port: httpsMatch[2] ? parseInt(httpsMatch[2], 10) : null,
      pathPrefix: pathPrefix,
      isSSH: false
    };
  }

  return null;
}

/**
 * Check if a string is a remote URL
 * @param {string} str - String to check
 * @returns {boolean}
 */
function isRemoteUrl(str) {
  if (!str) return false;
  return /^(https?:\/\/|ssh:\/\/|git@)/.test(str);
}

/**
 * Check if a string is a folder path
 * @param {string} str - String to check
 * @returns {boolean}
 */
function isFolderPath(str) {
  if (!str) return false;
  // Starts with /, ~/, ./, ../, or Windows drive letter (C:\)
  return /^(\/|~\/|\.\/|\.\.\/|[a-zA-Z]:\\)/.test(str);
}

/**
 * Expand ~ to home directory in path
 * @param {string} p - Path to expand
 * @returns {string}
 */
function expandPath(p) {
  if (!p) return p;
  if (p.startsWith('~/')) {
    return path.join(HOME_DIR, p.slice(2));
  }
  return path.resolve(p);
}

/**
 * Contract home directory to ~ in path for display/storage
 * @param {string} p - Path to contract
 * @returns {string}
 */
function contractPath(p) {
  if (!p) return p;
  if (p.startsWith(HOME_DIR)) {
    return '~' + p.slice(HOME_DIR.length);
  }
  return p;
}

/**
 * Parse command arguments and detect their types
 * @param {string[]} args - Array of arguments
 * @param {object} config - Config object with identities
 * @returns {{ identity: string|null, folderPath: string|null, remote: string|null }}
 */
function parseArguments(args, config) {
  const result = { identity: null, folderPath: null, remote: null };
  const identityNames = Object.keys(config.identities || {});

  for (const arg of args) {
    if (!arg) continue;

    // Check if it's an identity name
    if (identityNames.includes(arg)) {
      result.identity = arg;
      continue;
    }

    // Check if it's a remote URL
    if (isRemoteUrl(arg)) {
      result.remote = arg;
      continue;
    }

    // Check if it's a folder path
    if (isFolderPath(arg)) {
      result.folderPath = arg;
      continue;
    }

    // Unknown argument - might be identity name that doesn't exist yet
    // but we'll treat unrecognized as potential identity for error messaging
    if (!result.identity) {
      result.identity = arg;
    }
  }

  return result;
}

/**
 * Generate SSH host alias name for an identity
 * @param {string} host - Git host (e.g., github.com)
 * @param {string} identityAlias - Identity alias
 * @returns {string}
 */
function generateHostAlias(host, identityAlias) {
  return `${host}-${identityAlias}`;
}

// ============================================================================
// File Generation Utilities
// ============================================================================

/**
 * Read SSH config file
 * @returns {string}
 */
function readSshConfig() {
  if (fs.existsSync(SSH_CONFIG_FILE)) {
    return fs.readFileSync(SSH_CONFIG_FILE, 'utf8');
  }
  return '';
}

/**
 * Write SSH config file
 * @param {string} content - Config content
 */
function writeSshConfig(content) {
  // Ensure .ssh directory exists
  if (!fs.existsSync(SSH_DIR)) {
    fs.mkdirSync(SSH_DIR, { mode: 0o700, recursive: true });
  }
  fs.writeFileSync(SSH_CONFIG_FILE, content, { mode: 0o600 });
}

/**
 * Update SSH config with a host entry (idempotent)
 * @param {string} hostAlias - Host alias (e.g., github.com-work)
 * @param {string} hostName - Actual hostname (e.g., github.com)
 * @param {string} identityFile - Path to SSH key
 * @param {number|null} port - Optional port number
 * @param {string} identityAlias - Identity name for comment
 */
function updateSshConfig(hostAlias, hostName, identityFile, port, identityAlias) {
  let config = readSshConfig();
  const marker = `# Added by dev identity link (${identityAlias})`;

  // Build host entry
  let hostEntry = `${marker}\nHost ${hostAlias}\n`;
  hostEntry += `    HostName ${hostName}\n`;
  if (port) {
    hostEntry += `    Port ${port}\n`;
  }
  hostEntry += `    User git\n`;
  hostEntry += `    IdentityFile ${identityFile}\n`;
  hostEntry += `    IdentitiesOnly yes\n`;

  // Check if host entry already exists
  const hostPattern = new RegExp(
    `(${marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\n)?Host ${hostAlias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\n[\\s\\S]*?(?=\n(?:Host |#|$))`,
    'g'
  );

  if (config.match(hostPattern)) {
    // Replace existing entry
    config = config.replace(hostPattern, hostEntry.trim());
  } else {
    // Add new entry at the end
    config = config.trim() + '\n\n' + hostEntry;
  }

  writeSshConfig(config.trim() + '\n');
}

/**
 * Read gitconfig file
 * @param {string} filePath - Path to gitconfig
 * @returns {string}
 */
function readGitconfig(filePath) {
  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath, 'utf8');
  }
  return '';
}

/**
 * Write gitconfig file
 * @param {string} filePath - Path to gitconfig
 * @param {string} content - Config content
 */
function writeGitconfig(filePath, content) {
  fs.writeFileSync(filePath, content);
}

/**
 * Generate profile-specific gitconfig content
 * @param {object} identity - Identity object
 * @param {string} identityAlias - Identity alias
 * @param {object[]} urlRewrites - Array of { hostAlias, pathPrefix, host, port }
 * @returns {string}
 */
function generateProfileGitconfig(identity, identityAlias, urlRewrites) {
  let content = '# Generated by dev identity link\n';
  content += '[user]\n';
  content += `    email = ${identity.email}\n`;

  // Use SSH public key for signing if available
  const signingKey = identity.gpgKey || (identity.ssh ? identity.ssh.publicKey : null);
  if (signingKey) {
    content += `    signingkey = ${signingKey}\n`;
  }

  content += '\n[core]\n';
  const sshKeyPath = identity.sshKey || (identity.ssh ? identity.ssh.privateKey : null);
  if (sshKeyPath) {
    content += `    sshCommand = ssh -i ${sshKeyPath} -o IdentitiesOnly=yes\n`;
  }

  // Add URL rewrites
  for (const rewrite of urlRewrites) {
    content += '\n# URL rewriting (routes both HTTPS and SSH URLs through the host alias)\n';
    content += `[url "git@${rewrite.hostAlias}:${rewrite.pathPrefix}/"]\n`;

    // Generate HTTPS insteadOf
    const httpsPort = rewrite.port ? `:${rewrite.port}` : '';
    content += `    insteadOf = https://${rewrite.host}${httpsPort}/${rewrite.pathPrefix}/\n`;

    // Generate SSH insteadOf (git@ format)
    content += `    insteadOf = git@${rewrite.host}:${rewrite.pathPrefix}/\n`;

    // Generate SSH insteadOf (ssh:// format with port if applicable)
    if (rewrite.port) {
      content += `    insteadOf = ssh://git@${rewrite.host}:${rewrite.port}/${rewrite.pathPrefix}/\n`;
    } else {
      content += `    insteadOf = ssh://git@${rewrite.host}/${rewrite.pathPrefix}/\n`;
    }
  }

  // Add commit signing settings
  if (signingKey) {
    content += '\n[commit]\n';
    content += '    gpgsign = true\n';
    content += '\n[gpg]\n';
    content += '    format = ssh\n';
  }

  return content;
}

/**
 * Update main ~/.gitconfig with includeIf rules (idempotent)
 * @param {string} identityAlias - Identity alias
 * @param {string|null} folderPath - Folder path (with ~/)
 * @param {string|null} remote - Remote URL for hasconfig matching
 */
function updateMainGitconfig(identityAlias, folderPath, remote) {
  let config = readGitconfig(GITCONFIG_FILE);
  const profilePath = `~/.gitconfig-${identityAlias}`;
  const marker = `# ${identityAlias} identity (added by dev identity link)`;

  // Build includeIf sections
  let includeSection = '';

  if (folderPath) {
    // Ensure trailing slash for gitdir
    const gitdirPath = folderPath.endsWith('/') ? folderPath : folderPath + '/';
    includeSection += `${marker}\n`;
    includeSection += `[includeIf "gitdir:${gitdirPath}"]\n`;
    includeSection += `    path = ${profilePath}\n`;
  }

  if (remote) {
    const parsed = parseRemoteUrl(remote);
    if (parsed) {
      // Add hasconfig rule for git@ format
      if (includeSection) includeSection += '\n';
      else includeSection += `${marker}\n`;
      includeSection += `[includeIf "hasconfig:remote.*.url:git@${parsed.host}:${parsed.pathPrefix}/**"]\n`;
      includeSection += `    path = ${profilePath}\n`;
    }
  }

  if (!includeSection) return;

  // Check if marker already exists
  const markerRegex = new RegExp(
    `${marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\n[\\s\\S]*?(?=\n# \\w+ identity \\(added by|$)`,
    'g'
  );

  if (config.match(markerRegex)) {
    // Replace existing section
    config = config.replace(markerRegex, includeSection.trim());
  } else {
    // Add at end
    config = config.trim() + '\n\n' + includeSection;
  }

  writeGitconfig(GITCONFIG_FILE, config.trim() + '\n');
}

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Check if two paths overlap (one is parent/child of the other)
 * @param {string} path1 - First path
 * @param {string} path2 - Second path
 * @returns {boolean}
 */
function pathsOverlap(path1, path2) {
  const expanded1 = expandPath(path1);
  const expanded2 = expandPath(path2);

  // Same path
  if (expanded1 === expanded2) return true;

  // One is parent of the other
  const rel1 = path.relative(expanded1, expanded2);
  const rel2 = path.relative(expanded2, expanded1);

  // If relative path doesn't start with .., one is inside the other
  return (!rel1.startsWith('..') && rel1 !== '') ||
         (!rel2.startsWith('..') && rel2 !== '');
}

/**
 * Get all linked paths from config
 * @param {object} config - Configuration object
 * @returns {Array<{ path: string, identity: string }>}
 */
function getAllLinkedPaths(config) {
  const result = [];
  for (const [name, identity] of Object.entries(config.identities || {})) {
    for (const link of (identity.links || [])) {
      if (link.path) {
        result.push({ path: link.path, identity: name });
      }
    }
  }
  return result;
}

/**
 * Check if a path would conflict with existing links
 * @param {string} folderPath - Path to check
 * @param {string} identityAlias - Identity being linked
 * @param {object} config - Configuration object
 * @returns {{ conflict: boolean, message: string|null }}
 */
function checkPathConflict(folderPath, identityAlias, config) {
  const linkedPaths = getAllLinkedPaths(config);

  for (const linked of linkedPaths) {
    if (pathsOverlap(folderPath, linked.path)) {
      if (linked.identity === identityAlias && expandPath(folderPath) === expandPath(linked.path)) {
        // Same identity, same path - not a conflict, just idempotent
        return { conflict: false, message: null };
      }

      const expanded = expandPath(folderPath);
      const linkedExpanded = expandPath(linked.path);

      if (expanded === linkedExpanded) {
        return {
          conflict: true,
          message: `Path ${contractPath(folderPath)} is already linked to identity "${linked.identity}"`
        };
      }

      const rel = path.relative(expanded, linkedExpanded);
      if (!rel.startsWith('..')) {
        return {
          conflict: true,
          message: `Cannot link ${contractPath(folderPath)} - child path ${contractPath(linked.path)} is already linked to identity "${linked.identity}"`
        };
      }

      return {
        conflict: true,
        message: `Cannot link ${contractPath(folderPath)} - parent path ${contractPath(linked.path)} is already linked to identity "${linked.identity}"`
      };
    }
  }

  return { conflict: false, message: null };
}

/**
 * Find a link by folder path
 * @param {string} folderPath - Path to find
 * @param {object} config - Configuration object
 * @returns {{ identity: string, link: object, linkIndex: number }|null}
 */
function findLinkByPath(folderPath, config) {
  const expandedPath = expandPath(folderPath);

  for (const [identityName, identity] of Object.entries(config.identities || {})) {
    const links = identity.links || [];
    for (let i = 0; i < links.length; i++) {
      if (links[i].path && expandPath(links[i].path) === expandedPath) {
        return {
          identity: identityName,
          link: links[i],
          linkIndex: i
        };
      }
    }
  }

  return null;
}

/**
 * Remove gitdir includeIf rule from main ~/.gitconfig (idempotent)
 * @param {string} folderPath - Folder path to remove (with ~/)
 */
function removeGitdirIncludeIf(folderPath) {
  let config = readGitconfig(GITCONFIG_FILE);
  if (!config) return;

  // Ensure trailing slash for matching
  const gitdirPath = folderPath.endsWith('/') ? folderPath : folderPath + '/';

  // Match the includeIf gitdir block
  // Pattern: [includeIf "gitdir:~/path/"]\n    path = ~/.gitconfig-xxx\n
  const pattern = new RegExp(
    `\\[includeIf "gitdir:${gitdirPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"\\]\\n\\s+path = [^\\n]+\\n?`,
    'g'
  );

  const newConfig = config.replace(pattern, '');

  // Clean up any double newlines that might result
  const cleaned = newConfig.replace(/\n{3,}/g, '\n\n').trim();

  writeGitconfig(GITCONFIG_FILE, cleaned + '\n');
}

/**
 * Check if SSH tools are available
 * @returns {boolean}
 */
function isSshAvailable() {
  return shell.commandExists('ssh-keygen');
}

/**
 * Check if GPG tools are available
 * @returns {boolean}
 */
function isGpgAvailable() {
  return shell.commandExists('gpg');
}

/**
 * Get platform-specific package info for display
 * @param {string} tool - 'ssh' or 'gpg'
 * @returns {{ command: string, package: string }}
 */
function getPackageInfo(tool) {
  const platform = osUtils.detect();

  if (tool === 'ssh') {
    switch (platform.type) {
      case 'macos':
        return { command: 'ssh-keygen', package: 'built-in (OpenSSH)' };
      case 'ubuntu':
      case 'debian':
      case 'raspbian':
      case 'wsl':
        return { command: 'ssh-keygen', package: 'openssh-client (apt)' };
      case 'amazon_linux':
      case 'fedora':
      case 'rhel':
        return { command: 'ssh-keygen', package: `openssh-clients (${platform.packageManager})` };
      case 'windows':
        return { command: 'ssh-keygen', package: 'OpenSSH (winget) or Git Bash' };
      default:
        return { command: 'ssh-keygen', package: 'openssh' };
    }
  } else if (tool === 'gpg') {
    switch (platform.type) {
      case 'macos':
        return { command: 'gpg', package: 'gnupg (brew)' };
      case 'ubuntu':
      case 'debian':
      case 'raspbian':
      case 'wsl':
        return { command: 'gpg', package: 'gnupg (apt)' };
      case 'amazon_linux':
      case 'fedora':
      case 'rhel':
        return { command: 'gpg', package: `gnupg2 (${platform.packageManager})` };
      case 'windows':
        return { command: 'gpg', package: 'Gpg4win (winget/choco)' };
      default:
        return { command: 'gpg', package: 'gnupg' };
    }
  }
  return { command: tool, package: 'unknown' };
}

/**
 * Check and optionally install SSH dependency
 * @param {readline.Interface} rl - Readline interface
 * @param {boolean} force - Skip prompts if true
 * @returns {Promise<boolean>} - True if SSH is available after check/install
 */
async function ensureSshAvailable(rl, force) {
  if (isSshAvailable()) {
    return true;
  }

  const pkgInfo = getPackageInfo('ssh');
  console.log(`\nWarning: ${pkgInfo.command} is not installed.`);
  console.log(`Package: ${pkgInfo.package}`);

  let shouldInstall = force;
  if (!force) {
    shouldInstall = await confirm(rl, 'Would you like to install it now?');
  }

  if (!shouldInstall) {
    console.log('SSH key generation requires ssh-keygen. Skipping SSH key generation.');
    return false;
  }

  console.log('\nInstalling OpenSSH...');
  const success = await opensshInstall.install();

  if (!success) {
    console.error('Failed to install OpenSSH.');
    return false;
  }

  // Verify installation
  if (!isSshAvailable()) {
    console.error('OpenSSH was installed but ssh-keygen is still not available.');
    console.log('You may need to restart your terminal or add it to PATH.');
    return false;
  }

  console.log('OpenSSH installed and verified.\n');
  return true;
}

/**
 * Check and optionally install GPG dependency
 * @param {readline.Interface} rl - Readline interface
 * @param {boolean} force - Skip prompts if true
 * @returns {Promise<boolean>} - True if GPG is available after check/install
 */
async function ensureGpgAvailable(rl, force) {
  if (isGpgAvailable()) {
    return true;
  }

  const pkgInfo = getPackageInfo('gpg');
  console.log(`\nWarning: ${pkgInfo.command} is not installed.`);
  console.log(`Package: ${pkgInfo.package}`);

  let shouldInstall = force;
  if (!force) {
    shouldInstall = await confirm(rl, 'Would you like to install it now?');
  }

  if (!shouldInstall) {
    console.log('GPG key generation requires gpg. Skipping GPG key generation.');
    return false;
  }

  console.log('\nInstalling GPG...');
  const success = await gpgInstall.install();

  if (!success) {
    console.error('Failed to install GPG.');
    return false;
  }

  // Verify installation
  if (!isGpgAvailable()) {
    console.error('GPG was installed but gpg is still not available.');
    console.log('You may need to restart your terminal or add it to PATH.');
    return false;
  }

  console.log('GPG installed and verified.\n');
  return true;
}

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
 * @returns {object}
 */
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const content = fs.readFileSync(CONFIG_FILE, 'utf8');
      return JSON.parse(content);
    }
  } catch {
    // Return empty config on error
  }
  return {};
}

/**
 * Save configuration to file
 * @param {object} config - Configuration object
 */
function saveConfig(config) {
  config.updated = new Date().toISOString();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2) + '\n');
}

/**
 * Generate SSH key pair
 * @param {string} alias - Identity alias
 * @param {string} email - Email address
 * @param {string} passphrase - Optional passphrase
 * @param {string} keyType - Key type (ed25519 or rsa)
 * @returns {Promise<{ privateKey: string, publicKey: string }>}
 */
async function generateSSHKey(alias, email, passphrase, keyType = 'ed25519') {
  // Ensure .ssh directory exists
  if (!fs.existsSync(SSH_DIR)) {
    fs.mkdirSync(SSH_DIR, { mode: 0o700 });
  }

  const keyFile = path.join(SSH_DIR, `id_${keyType}_${alias}`);

  // Check if key already exists
  if (fs.existsSync(keyFile)) {
    throw new Error(`SSH key already exists at ${keyFile}`);
  }

  return new Promise((resolve, reject) => {
    const args = [
      '-t', keyType,
      '-C', email,
      '-f', keyFile,
      '-N', passphrase || ''
    ];

    if (keyType === 'rsa') {
      args.push('-b', '4096');
    }

    const sshKeygen = spawn('ssh-keygen', args, { stdio: 'inherit' });

    sshKeygen.on('close', code => {
      if (code === 0) {
        resolve({
          privateKey: keyFile,
          publicKey: `${keyFile}.pub`
        });
      } else {
        reject(new Error(`ssh-keygen exited with code ${code}`));
      }
    });

    sshKeygen.on('error', err => {
      reject(new Error(`Failed to run ssh-keygen: ${err.message}`));
    });
  });
}

/**
 * Generate GPG key pair
 * @param {string} name - User's name
 * @param {string} email - Email address
 * @returns {Promise<{ keyId: string, fingerprint: string }>}
 */
async function generateGPGKey(name, email) {
  return new Promise((resolve, reject) => {
    // Create batch file content for GPG key generation
    const batchContent = `
%no-protection
Key-Type: eddsa
Key-Curve: ed25519
Key-Usage: sign
Subkey-Type: ecdh
Subkey-Curve: cv25519
Subkey-Usage: encrypt
Name-Real: ${name}
Name-Email: ${email}
Expire-Date: 0
%commit
`.trim();

    // Write batch file to temp location
    const tempBatchFile = path.join(require('os').tmpdir(), `gpg-batch-${Date.now()}`);
    fs.writeFileSync(tempBatchFile, batchContent);

    const gpg = spawn('gpg', ['--batch', '--gen-key', tempBatchFile], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stderr = '';

    gpg.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    gpg.on('close', async (code) => {
      // Clean up temp file
      try {
        fs.unlinkSync(tempBatchFile);
      } catch {
        // Ignore cleanup errors
      }

      if (code !== 0) {
        reject(new Error(`gpg exited with code ${code}: ${stderr}`));
        return;
      }

      // Get the key ID for the newly created key
      try {
        const keyId = await getGPGKeyId(email);
        if (keyId) {
          resolve(keyId);
        } else {
          reject(new Error('GPG key created but could not retrieve key ID'));
        }
      } catch (err) {
        reject(err);
      }
    });

    gpg.on('error', err => {
      try {
        fs.unlinkSync(tempBatchFile);
      } catch {
        // Ignore cleanup errors
      }
      reject(new Error(`Failed to run gpg: ${err.message}`));
    });
  });
}

/**
 * Get GPG key ID for an email address
 * @param {string} email - Email address to look up
 * @returns {Promise<{ keyId: string, fingerprint: string }|null>}
 */
async function getGPGKeyId(email) {
  return new Promise((resolve, reject) => {
    const gpg = spawn('gpg', ['--list-keys', '--keyid-format', 'long', email], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    gpg.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    gpg.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    gpg.on('close', (code) => {
      if (code !== 0) {
        resolve(null);
        return;
      }

      // Parse the output to get key ID and fingerprint
      // Look for lines like: "pub   ed25519/KEYID 2024-01-01 [SC]"
      const pubMatch = stdout.match(/pub\s+\w+\/([A-F0-9]+)\s/i);
      const fpMatch = stdout.match(/^\s+([A-F0-9]{40})\s*$/m);

      if (pubMatch) {
        resolve({
          keyId: pubMatch[1],
          fingerprint: fpMatch ? fpMatch[1] : pubMatch[1]
        });
      } else {
        resolve(null);
      }
    });

    gpg.on('error', () => {
      resolve(null);
    });
  });
}

/**
 * List all configured identities
 * @param {object} config - Configuration object
 */
function listIdentities(config) {
  const identities = config.identities || {};
  const names = Object.keys(identities);

  if (names.length === 0) {
    console.log('\nNo identities configured.');
    console.log('Run `dev identity add <alias>` to create one.\n');
    return;
  }

  console.log('\nConfigured identities:');
  console.log('─'.repeat(50));

  for (const name of names) {
    const identity = identities[name];
    console.log(`\n  ${name}:`);
    console.log(`    Name:   ${identity.name}`);
    console.log(`    Email:  ${identity.email}`);

    // Show SSH key
    const sshKey = identity.sshKey || (identity.ssh ? identity.ssh.publicKey : null);
    if (sshKey) {
      console.log(`    SSH:    ${sshKey}`);
    }

    // Show GPG key
    const gpgKey = identity.gpgKey || (identity.gpg ? identity.gpg.keyId : null);
    if (gpgKey) {
      console.log(`    GPG:    ${gpgKey}`);
    }

    // Show links
    const links = identity.links || [];
    if (links.length > 0) {
      console.log(`    Links:`);
      for (const link of links) {
        let linkDesc = '      - ';
        if (link.path && link.remote) {
          linkDesc += `${link.path} → ${link.remote}`;
        } else if (link.path) {
          linkDesc += `${link.path}`;
        } else if (link.remote) {
          linkDesc += `${link.remote}`;
        }
        console.log(linkDesc);
      }
    }
  }
  console.log('');
}

/**
 * Add a new identity
 * @param {string} alias - Identity alias
 * @param {object} options - Command options
 */
async function addIdentity(alias, options) {
  if (!alias) {
    console.error('\nError: Alias is required.');
    console.log('Usage: dev identity add <alias> [--name <name>] [--email <email>]\n');
    process.exit(1);
  }

  const config = loadConfig();
  config.identities = config.identities || {};

  // Check if alias already exists
  if (config.identities[alias] && !options.force) {
    console.error(`\nError: Identity "${alias}" already exists.`);
    console.log('Use --force to overwrite.\n');
    process.exit(1);
  }

  // Get name and email from options or prompt
  let name = options.name;
  let email = options.email;

  // Defaults come from user info in .devutils
  const defaultName = config.user?.name || '';
  const defaultEmail = config.user?.email || '';

  // If both provided via CLI, skip interactive mode
  const hasAllRequired = name && email;

  if (!hasAllRequired) {
    const rl = createPrompt();

    console.log(`\n--- Add Identity: ${alias} ---\n`);

    if (!name) {
      name = await ask(rl, 'Name', defaultName);
      if (!name) {
        console.error('\nError: Name is required.');
        rl.close();
        process.exit(1);
      }
    }

    if (!email) {
      email = await ask(rl, 'Email', defaultEmail);
      if (!email) {
        console.error('\nError: Email is required.');
        rl.close();
        process.exit(1);
      }
    }

    rl.close();
  }

  // Create identity object
  const identity = {
    name,
    email,
    created: new Date().toISOString()
  };

  // SSH key generation (always create without passphrase)
  console.log('\n--- SSH Key ---\n');
  const rl = createPrompt();
  const sshAvailable = await ensureSshAvailable(rl, options.force);
  if (sshAvailable) {
    const keyType = options.sshType || 'ed25519';

    try {
      console.log(`Generating ${keyType} SSH key...`);
      const sshKey = await generateSSHKey(alias, email, '', keyType);
      identity.ssh = sshKey;
      console.log(`SSH key created: ${sshKey.publicKey}`);

      // Show public key
      const publicKey = fs.readFileSync(sshKey.publicKey, 'utf8');
      console.log('\nPublic key:');
      console.log('─'.repeat(40));
      console.log(publicKey.trim());
      console.log('─'.repeat(40));
    } catch (err) {
      console.error(`\nWarning: Failed to generate SSH key: ${err.message}`);
    }
  }

  // GPG key generation (always create)
  console.log('\n--- GPG Key ---\n');
  const gpgAvailable = await ensureGpgAvailable(rl, options.force);
  if (gpgAvailable) {
    try {
      console.log('Generating GPG key...');
      const gpgKey = await generateGPGKey(name, email);
      identity.gpg = gpgKey;
      console.log(`GPG key created: ${gpgKey.keyId}`);
      console.log(`Fingerprint: ${gpgKey.fingerprint}`);
    } catch (err) {
      console.error(`\nWarning: Failed to generate GPG key: ${err.message}`);
    }
  }

  rl.close();

  // Save identity
  config.identities[alias] = identity;
  saveConfig(config);

  console.log(`\nIdentity "${alias}" saved.`);
  console.log(`Configuration updated: ${CONFIG_FILE}\n`);
}

/**
 * Update an existing identity
 * @param {string} alias - Identity alias
 * @param {object} options - Command options
 */
async function updateIdentity(alias, options) {
  if (!alias) {
    console.error('\nError: Alias is required.');
    console.log('Usage: dev identity update <alias> [--name <name>] [--email <email>]\n');
    process.exit(1);
  }

  const config = loadConfig();
  config.identities = config.identities || {};

  // Check if alias exists
  if (!config.identities[alias]) {
    console.error(`\nError: Identity "${alias}" not found.\n`);
    process.exit(1);
  }

  const existingIdentity = config.identities[alias];

  // Get name and email from options or prompt
  let name = options.name;
  let email = options.email;

  // Defaults come from existing identity
  const defaultName = existingIdentity.name;
  const defaultEmail = existingIdentity.email;

  // If both provided via CLI, skip interactive mode
  const hasAllRequired = name && email;

  if (!hasAllRequired) {
    const rl = createPrompt();

    console.log(`\n--- Update Identity: ${alias} ---\n`);

    if (!name) {
      name = await ask(rl, 'Name', defaultName);
      if (!name) {
        console.error('\nError: Name is required.');
        rl.close();
        process.exit(1);
      }
    }

    if (!email) {
      email = await ask(rl, 'Email', defaultEmail);
      if (!email) {
        console.error('\nError: Email is required.');
        rl.close();
        process.exit(1);
      }
    }

    rl.close();
  }

  // Update identity object (preserve SSH/GPG keys)
  config.identities[alias] = {
    ...existingIdentity,
    name,
    email,
    updated: new Date().toISOString()
  };

  saveConfig(config);

  console.log(`\nIdentity "${alias}" updated.`);
  console.log(`Configuration updated: ${CONFIG_FILE}\n`);
}

/**
 * Remove an identity
 * @param {string} alias - Identity alias to remove
 * @param {object} options - Command options
 */
async function removeIdentity(alias, options) {
  if (!alias) {
    console.error('\nError: Alias is required.');
    console.log('Usage: dev identity remove <alias>\n');
    process.exit(1);
  }

  const config = loadConfig();
  config.identities = config.identities || {};

  // Check if identity exists
  if (!config.identities[alias]) {
    console.error(`\nError: Identity "${alias}" not found.\n`);
    process.exit(1);
  }

  // Confirm deletion (unless --force)
  if (!options.force) {
    const rl = createPrompt();
    const shouldDelete = await confirm(rl, `Delete identity "${alias}"?`);
    rl.close();

    if (!shouldDelete) {
      console.log('Cancelled.');
      return;
    }
  }

  // Delete SSH keys if they exist
  const identity = config.identities[alias];
  if (identity.ssh) {
    if (fs.existsSync(identity.ssh.privateKey)) {
      fs.unlinkSync(identity.ssh.privateKey);
      console.log(`Deleted: ${identity.ssh.privateKey}`);
    }
    if (fs.existsSync(identity.ssh.publicKey)) {
      fs.unlinkSync(identity.ssh.publicKey);
      console.log(`Deleted: ${identity.ssh.publicKey}`);
    }
  }

  // Remove from config
  delete config.identities[alias];
  saveConfig(config);

  console.log(`\nIdentity "${alias}" removed.`);
  console.log(`Configuration updated: ${CONFIG_FILE}\n`);
}

/**
 * Link an identity to a source folder and/or remote server
 * @param {string[]} args - Command arguments (identity, path, remote in any order)
 */
async function linkIdentity(args) {
  const config = loadConfig();
  config.identities = config.identities || {};

  const identityNames = Object.keys(config.identities);

  if (identityNames.length === 0) {
    console.log('\nNo identities configured.');
    console.log('Run `dev identity add <alias>` first.\n');
    return;
  }

  // Parse arguments to detect types
  const parsed = parseArguments(args, config);
  let { identity: alias, folderPath, remote } = parsed;

  const rl = createPrompt();

  // Prompt for identity if not provided
  if (!alias) {
    console.log('\nAvailable identities:');
    identityNames.forEach((n, i) => {
      console.log(`  ${i + 1}. ${n} (${config.identities[n].email})`);
    });
    alias = await ask(rl, '\nSelect identity');
  }

  // Validate identity exists
  if (!config.identities[alias]) {
    console.error(`\n✗ Error: Identity "${alias}" not found.`);
    console.log(`Available identities: ${identityNames.join(', ')}\n`);
    rl.close();
    process.exit(1);
  }

  // Only prompt for path/remote if NEITHER was provided
  // If at least one was provided, use it without prompting
  if (!folderPath && !remote) {
    folderPath = await ask(rl, 'Source folder path (optional, press Enter to skip)');
    if (!folderPath) {
      remote = await ask(rl, 'Remote server URL (optional, press Enter to skip)');
    }

    // Must have at least one of path or remote
    if (!folderPath && !remote) {
      console.error('\n✗ Error: You must provide at least a folder path or remote URL.\n');
      rl.close();
      process.exit(1);
    }
  }

  rl.close();

  const identity = config.identities[alias];

  // Validate and process folder path
  if (folderPath) {
    const expandedPath = expandPath(folderPath);

    // Check if path exists
    if (!fs.existsSync(expandedPath)) {
      const rl2 = createPrompt();
      const create = await confirm(rl2, `Folder ${folderPath} does not exist. Create it?`);
      rl2.close();

      if (create) {
        try {
          fs.mkdirSync(expandedPath, { recursive: true });
          console.log(`✓ Created folder ${folderPath}`);
        } catch (err) {
          console.error(`\n✗ Error creating folder: ${err.message}\n`);
          process.exit(1);
        }
      } else {
        console.log('Aborted.');
        return;
      }
    }

    // Check for path conflicts with existing links
    const conflict = checkPathConflict(folderPath, alias, config);
    if (conflict.conflict) {
      console.error(`\n✗ Error: ${conflict.message}\n`);
      process.exit(1);
    }

    // Normalize to contracted path for storage
    folderPath = contractPath(expandedPath);
  }

  // Parse remote URL if provided
  let parsedRemote = null;
  if (remote) {
    parsedRemote = parseRemoteUrl(remote);
    if (!parsedRemote) {
      console.error(`\n✗ Error: Could not parse remote URL: ${remote}\n`);
      process.exit(1);
    }
  }

  // ================================================================
  // Step 1: Store link in ~/.devutils (source of truth)
  // ================================================================
  identity.links = identity.links || [];

  // Check if this exact link already exists (idempotent)
  const existingLinkIndex = identity.links.findIndex(link => {
    if (folderPath && link.path !== folderPath) return false;
    if (remote && link.remote !== remote) return false;
    if (!folderPath && link.path) return false;
    if (!remote && link.remote) return false;
    return true;
  });

  const linkData = {};
  if (folderPath) linkData.path = folderPath;
  if (remote) linkData.remote = remote;

  if (existingLinkIndex >= 0) {
    // Update existing link
    identity.links[existingLinkIndex] = linkData;
  } else {
    // Add new link
    identity.links.push(linkData);
  }

  saveConfig(config);
  console.log(`✓ Updated ~/.devutils`);

  // ================================================================
  // Step 2: Update ~/.ssh/config with host entry
  // ================================================================
  const sshKeyPath = identity.sshKey || (identity.ssh ? identity.ssh.privateKey : null);

  if (parsedRemote && sshKeyPath) {
    const hostAlias = generateHostAlias(parsedRemote.host, alias);
    updateSshConfig(hostAlias, parsedRemote.host, sshKeyPath, parsedRemote.port, alias);
    console.log(`✓ Updated ~/.ssh/config`);
  }

  // ================================================================
  // Step 3: Create/update profile-specific gitconfig
  // ================================================================
  const profileGitconfigPath = path.join(HOME_DIR, `.gitconfig-${alias}`);

  // Collect all URL rewrites for this identity
  const urlRewrites = [];
  for (const link of identity.links) {
    if (link.remote) {
      const parsed = parseRemoteUrl(link.remote);
      if (parsed) {
        urlRewrites.push({
          hostAlias: generateHostAlias(parsed.host, alias),
          pathPrefix: parsed.pathPrefix,
          host: parsed.host,
          port: parsed.port
        });
      }
    }
  }

  const profileContent = generateProfileGitconfig(identity, alias, urlRewrites);
  writeGitconfig(profileGitconfigPath, profileContent);
  console.log(`✓ Created ~/.gitconfig-${alias}`);

  // ================================================================
  // Step 4: Update ~/.gitconfig with includeIf rules
  // ================================================================
  updateMainGitconfig(alias, folderPath, remote);
  console.log(`✓ Updated ~/.gitconfig`);

  // Summary
  console.log(`\n✓ Linked identity "${alias}":`);
  console.log(`  Name:  ${identity.name}`);
  console.log(`  Email: ${identity.email}`);
  if (folderPath) {
    console.log(`  Path:  ${folderPath}`);
  }
  if (remote) {
    console.log(`  Remote: ${remote}`);
  }
  if (sshKeyPath) {
    console.log(`  SSH Key: ${sshKeyPath}`);
  }
  console.log('');
}

/**
 * Unlink a folder path from its identity
 * @param {string} folderPath - Folder path to unlink
 */
async function unlinkIdentity(folderPath) {
  if (!folderPath) {
    console.error('\n✗ Error: Folder path is required.');
    console.log('Usage: dev identity unlink <folder_path>\n');
    process.exit(1);
  }

  const config = loadConfig();

  // Find the link by folder path
  const found = findLinkByPath(folderPath, config);

  if (!found) {
    console.error(`\n✗ Error: No link found for path "${folderPath}"`);
    console.log('Use `dev identity list` to see all configured links.\n');
    process.exit(1);
  }

  const { identity: identityAlias, link, linkIndex } = found;
  const identity = config.identities[identityAlias];
  const storedPath = link.path;
  const storedRemote = link.remote;

  // ================================================================
  // Step 1: Remove link from ~/.devutils
  // ================================================================
  identity.links.splice(linkIndex, 1);
  saveConfig(config);
  console.log(`✓ Updated ~/.devutils`);

  // ================================================================
  // Step 2: Remove gitdir includeIf from ~/.gitconfig
  // ================================================================
  if (storedPath) {
    removeGitdirIncludeIf(storedPath);
    console.log(`✓ Removed includeIf rule from ~/.gitconfig`);
  }

  // ================================================================
  // Step 3: Regenerate profile-specific gitconfig
  // ================================================================
  const profileGitconfigPath = path.join(HOME_DIR, `.gitconfig-${identityAlias}`);

  // Collect remaining URL rewrites for this identity
  const urlRewrites = [];
  for (const remainingLink of identity.links) {
    if (remainingLink.remote) {
      const parsed = parseRemoteUrl(remainingLink.remote);
      if (parsed) {
        urlRewrites.push({
          hostAlias: generateHostAlias(parsed.host, identityAlias),
          pathPrefix: parsed.pathPrefix,
          host: parsed.host,
          port: parsed.port
        });
      }
    }
  }

  // If identity still has links or other config, regenerate the profile
  // Otherwise, consider removing the profile gitconfig
  if (identity.links.length > 0 || identity.sshKey || identity.ssh) {
    const profileContent = generateProfileGitconfig(identity, identityAlias, urlRewrites);
    writeGitconfig(profileGitconfigPath, profileContent);
    console.log(`✓ Updated ~/.gitconfig-${identityAlias}`);
  } else if (fs.existsSync(profileGitconfigPath)) {
    // No more links and no SSH key - optionally keep the profile for future use
    // For now, we keep it but update it
    const profileContent = generateProfileGitconfig(identity, identityAlias, urlRewrites);
    writeGitconfig(profileGitconfigPath, profileContent);
    console.log(`✓ Updated ~/.gitconfig-${identityAlias}`);
  }

  // Summary
  console.log(`\n✓ Unlinked path from identity "${identityAlias}":`);
  console.log(`  Path:  ${storedPath}`);
  if (storedRemote) {
    console.log(`  Remote: ${storedRemote} (still configured via other links or profile)`);
  }
  console.log('');
}

/**
 * Sync all identities - regenerate config files from ~/.devutils
 * This is useful after copying ~/.devutils to a new machine
 */
async function syncIdentities() {
  const config = loadConfig();
  const identities = config.identities || {};
  const identityNames = Object.keys(identities);

  if (identityNames.length === 0) {
    console.log('\nNo identities configured.');
    console.log('Run `dev identity add <alias>` to create one.\n');
    return;
  }

  console.log('\n=== Syncing Identities ===\n');

  let sshConfigUpdated = false;
  let gitconfigsCreated = 0;
  let includeIfRulesAdded = 0;

  for (const alias of identityNames) {
    const identity = identities[alias];
    const links = identity.links || [];
    const sshKeyPath = identity.sshKey || (identity.ssh ? identity.ssh.privateKey : null);

    console.log(`Processing identity: ${alias}`);

    // Collect URL rewrites for this identity
    const urlRewrites = [];
    const processedHosts = new Set();

    for (const link of links) {
      // Update SSH config for remotes
      if (link.remote && sshKeyPath) {
        const parsed = parseRemoteUrl(link.remote);
        if (parsed && !processedHosts.has(parsed.host)) {
          const hostAlias = generateHostAlias(parsed.host, alias);
          updateSshConfig(hostAlias, parsed.host, sshKeyPath, parsed.port, alias);
          processedHosts.add(parsed.host);
          sshConfigUpdated = true;

          urlRewrites.push({
            hostAlias,
            pathPrefix: parsed.pathPrefix,
            host: parsed.host,
            port: parsed.port
          });
        }
      }

      // Update main gitconfig with includeIf rules
      if (link.path || link.remote) {
        updateMainGitconfig(alias, link.path, link.remote);
        includeIfRulesAdded++;
      }
    }

    // Create profile-specific gitconfig
    if (identity.email || sshKeyPath || urlRewrites.length > 0) {
      const profileGitconfigPath = path.join(HOME_DIR, `.gitconfig-${alias}`);
      const profileContent = generateProfileGitconfig(identity, alias, urlRewrites);
      writeGitconfig(profileGitconfigPath, profileContent);
      gitconfigsCreated++;
    }

    console.log(`  ✓ ${links.length} link(s) processed`);
  }

  // Summary
  console.log('\n=== Sync Complete ===\n');
  console.log(`  Identities synced: ${identityNames.length}`);
  if (sshConfigUpdated) {
    console.log(`  ✓ Updated ~/.ssh/config`);
  }
  console.log(`  ✓ Created ${gitconfigsCreated} profile gitconfig(s)`);
  console.log(`  ✓ Added ${includeIfRulesAdded} includeIf rule(s) to ~/.gitconfig`);
  console.log('');
}

// Create the identity command with subcommands
const identity = new Command('identity')
  .description('Manage identity profiles for git configuration and keys');

identity
  .command('add <alias>')
  .description('Add a new identity profile')
  .option('--name <name>', 'Name for this identity')
  .option('--email <email>', 'Email for this identity')
  .option('--ssh-type <type>', 'SSH key type: ed25519 (default) or rsa', 'ed25519')
  .option('--force', 'Overwrite existing identity')
  .action(addIdentity);

identity
  .command('update <alias>')
  .description('Update an existing identity profile')
  .option('--name <name>', 'New name for this identity')
  .option('--email <email>', 'New email for this identity')
  .action(updateIdentity);

identity
  .command('remove <alias>')
  .description('Remove an identity profile')
  .option('--force', 'Delete without confirmation')
  .action(removeIdentity);

identity
  .command('link [args...]')
  .description('Link an identity to a folder path and/or remote server')
  .action(linkIdentity);

identity
  .command('unlink <folder_path>')
  .description('Unlink a folder path from its identity')
  .action(unlinkIdentity);

identity
  .command('sync')
  .description('Regenerate all config files from ~/.devutils (for new machines)')
  .action(syncIdentities);

identity
  .command('list')
  .description('List all configured identities')
  .action(() => {
    const config = loadConfig();
    listIdentities(config);
  });

// Default action (show help or list)
identity.action(() => {
  const config = loadConfig();
  listIdentities(config);
});

module.exports = identity;
