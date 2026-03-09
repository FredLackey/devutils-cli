'use strict';

const path = require('path');
const fs = require('fs');

const meta = {
  name: 'git-status',
  description: 'Scan directories for git repos and show a color-coded status summary',
  platforms: ['macos', 'ubuntu', 'raspbian', 'amazon-linux', 'windows', 'gitbash'],
  arguments: [
    { name: 'path', required: false, description: 'Directory to scan (defaults to current directory)' },
  ],
  flags: [
    { name: 'depth', type: 'number', description: 'How many levels deep to scan for repos (default: 1)' },
  ],
};

/**
 * Run the Unix bash script for git status scanning.
 * @param {string} dir - The directory to scan.
 */
async function runUnixScript(dir) {
  const shell = require('../../lib/shell');
  const scriptPath = path.join(__dirname, 'unix.sh');

  const result = await shell.exec(`bash "${scriptPath}" "${dir}"`);

  if (result.exitCode !== 0) {
    console.error(result.stderr || 'git-status script failed');
    return;
  }

  if (result.stdout) {
    console.log(result.stdout);
  }
}

/**
 * Pure JavaScript fallback for platforms without bash (Windows, Git Bash).
 * @param {string} dir - The directory to scan.
 */
async function runJsFallback(dir) {
  const shell = require('../../lib/shell');

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const repos = entries
    .filter(e => e.isDirectory() && fs.existsSync(path.join(dir, e.name, '.git')))
    .map(e => ({ name: e.name, path: path.join(dir, e.name) }));

  if (repos.length === 0) {
    console.log('No git repositories found in ' + dir);
    return;
  }

  for (const repo of repos) {
    const opts = { cwd: repo.path };

    // Get branch
    let branch = shell.execSync('git symbolic-ref --short HEAD', opts);
    if (branch === null) branch = 'detached';

    // Get dirty count
    const porcelain = shell.execSync('git status --porcelain', opts) || '';
    const dirtyCount = porcelain ? porcelain.split('\n').filter(Boolean).length : 0;

    // Get stash count
    const stashList = shell.execSync('git stash list', opts) || '';
    const stashCount = stashList ? stashList.split('\n').filter(Boolean).length : 0;

    // Get ahead/behind
    let ahead = 0;
    let behind = 0;
    const tracking = shell.execSync('git rev-parse --abbrev-ref @{upstream}', opts);
    if (tracking) {
      const counts = shell.execSync('git rev-list --left-right --count HEAD...@{upstream}', opts);
      if (counts) {
        const parts = counts.split(/\s+/);
        ahead = parseInt(parts[0], 10) || 0;
        behind = parseInt(parts[1], 10) || 0;
      }
    }

    // Build status string
    const statusParts = [];
    if (dirtyCount > 0) statusParts.push(`${dirtyCount} dirty`);
    if (ahead > 0) statusParts.push(`+${ahead}`);
    if (behind > 0) statusParts.push(`-${behind}`);
    if (stashCount > 0) statusParts.push(`${stashCount} stash`);
    if (statusParts.length === 0) statusParts.push('clean');

    const nameCol = repo.name.padEnd(30);
    const branchCol = branch.padEnd(20);
    console.log(`${nameCol} ${branchCol} ${statusParts.join('  ')}`);
  }
}

async function run(args) {
  const platform = require('../../lib/platform').detect();
  const targetDir = args[0] || process.cwd();
  const resolvedDir = path.resolve(targetDir);

  if (!fs.existsSync(resolvedDir)) {
    console.error(`Directory not found: ${resolvedDir}`);
    return;
  }

  const unixPlatforms = ['macos', 'ubuntu', 'raspbian', 'amazon-linux'];

  if (unixPlatforms.includes(platform.type)) {
    await runUnixScript(resolvedDir);
  } else {
    await runJsFallback(resolvedDir);
  }
}

module.exports = { meta, run };
