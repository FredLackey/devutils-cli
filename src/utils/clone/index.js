'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const meta = {
  name: 'clone',
  description: 'Clone a git repo and auto-install dependencies using the detected package manager',
  platforms: ['macos', 'ubuntu', 'raspbian', 'amazon-linux', 'windows', 'gitbash'],
  arguments: [
    { name: 'url', required: true, description: 'Git repository URL (SSH or HTTPS)' },
    { name: 'directory', required: false, description: 'Target directory name (defaults to repo name)' },
  ],
  flags: [],
};

/**
 * Extract the repository name from a git URL.
 * Handles HTTPS, SSH, and bare path formats.
 *
 * @param {string} url - The git repository URL.
 * @returns {string} The extracted repo name.
 */
function extractRepoName(url) {
  let cleaned = url.replace(/\/+$/, '');
  cleaned = cleaned.replace(/\.git$/, '');

  const lastSegment = cleaned.split('/').pop() || '';

  if (lastSegment.includes(':')) {
    return lastSegment.split(':').pop() || 'cloned-repo';
  }

  return lastSegment || 'cloned-repo';
}

/**
 * Detect which package manager to use based on lock files in the directory.
 * Checks lock files in order: yarn.lock, pnpm-lock.yaml, package-lock.json.
 * Falls back to npm if no lock file is found but package.json exists.
 *
 * @param {string} dir - The directory to check.
 * @returns {{ name: string, installCmd: string }|null} Package manager info, or null if not a JS project.
 */
function detectPackageManager(dir) {
  const hasPackageJson = fs.existsSync(path.join(dir, 'package.json'));
  if (!hasPackageJson) {
    return null;
  }

  if (fs.existsSync(path.join(dir, 'yarn.lock'))) {
    return { name: 'yarn', installCmd: 'yarn install' };
  }

  if (fs.existsSync(path.join(dir, 'pnpm-lock.yaml'))) {
    return { name: 'pnpm', installCmd: 'pnpm install' };
  }

  if (fs.existsSync(path.join(dir, 'package-lock.json'))) {
    return { name: 'npm', installCmd: 'npm install' };
  }

  // package.json exists but no lock file -- default to npm
  return { name: 'npm', installCmd: 'npm install' };
}

/**
 * Check if a command is available on the system.
 *
 * @param {string} cmd - The command name to check.
 * @returns {boolean} True if the command exists on PATH.
 */
function isAvailable(cmd) {
  const shell = require('../../lib/shell');
  return shell.commandExists(cmd);
}

async function run(args) {
  const shell = require('../../lib/shell');

  if (!shell.commandExists('git')) {
    console.error('Error: git is not installed.');
    console.error('Install git first, then try again.');
    return;
  }

  const url = args[0];
  if (!url) {
    console.error('Usage: dev util run clone <url> [directory]');
    console.error('');
    console.error('Examples:');
    console.error('  dev util run clone git@github.com:user/repo.git');
    console.error('  dev util run clone https://github.com/user/repo.git');
    console.error('  dev util run clone git@github.com:user/repo.git my-project');
    return;
  }

  const targetDir = args[1] || extractRepoName(url);
  const fullPath = path.resolve(process.cwd(), targetDir);

  if (fs.existsSync(fullPath)) {
    console.error(`Error: Directory "${targetDir}" already exists.`);
    return;
  }

  console.log(`Cloning ${url} into ${targetDir}...`);
  console.log('');

  const cloneResult = spawnSync('git', ['clone', url, targetDir], {
    stdio: 'inherit',
    cwd: process.cwd(),
  });

  if (cloneResult.status !== 0) {
    console.error('');
    console.error('git clone failed.');
    return;
  }

  if (!fs.existsSync(fullPath)) {
    console.error('Clone appeared to succeed but the directory was not created.');
    return;
  }

  const pm = detectPackageManager(fullPath);

  if (!pm) {
    console.log('');
    console.log(`Cloned into "${targetDir}".`);
    console.log('No package.json found -- skipping dependency installation.');
    return;
  }

  if (!isAvailable(pm.name)) {
    console.log('');
    console.log(`Cloned into "${targetDir}".`);
    console.log(`package.json found, but ${pm.name} is not installed.`);
    console.log(`Install ${pm.name} and run: ${pm.installCmd}`);
    return;
  }

  console.log('');
  console.log(`Installing dependencies with ${pm.name}...`);
  console.log('');

  const installResult = spawnSync(pm.name, ['install'], {
    stdio: 'inherit',
    cwd: fullPath,
    shell: true,
  });

  if (installResult.status !== 0) {
    console.error('');
    console.error(`${pm.name} install finished with errors. Check the output above.`);
  } else {
    console.log('');
    console.log('Dependencies installed.');
  }

  console.log('');
  console.log(`Done. To enter the project: cd ${targetDir}`);
}

module.exports = { meta, run };
