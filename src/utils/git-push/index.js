'use strict';

const meta = {
  name: 'git-push',
  description: 'Safer git push: shows what will be pushed, confirms before pushing, and protects main/master',
  platforms: ['macos', 'ubuntu', 'raspbian', 'amazon-linux', 'windows', 'gitbash'],
  arguments: [
    { name: 'message', required: true, description: 'Commit message (all arguments after the name are joined)' },
  ],
  flags: [
    { name: 'force', type: 'boolean', description: 'Allow pushing to protected branches (main/master)' },
    { name: 'yes', type: 'boolean', description: 'Skip the confirmation prompt' },
  ],
};

const shell = require('../../lib/shell');

/**
 * Check if the current directory is inside a git repo.
 * @returns {boolean}
 */
function isGitRepo() {
  const result = shell.execSync('git rev-parse --is-inside-work-tree');
  return result === 'true';
}

/**
 * Get the current branch name.
 * @returns {string|null} Branch name, or null if in detached HEAD state.
 */
function getCurrentBranch() {
  return shell.execSync('git symbolic-ref --short HEAD') || null;
}

/**
 * Get a list of changed files (staged, unstaged, and untracked).
 * @returns {Array<{ status: string, file: string }>}
 */
function getChangedFiles() {
  const result = shell.execSync('git status --porcelain');
  if (!result) return [];

  return result.split('\n').filter(Boolean).map(line => {
    const status = line.substring(0, 2).trim();
    const file = line.substring(3);
    return { status, file };
  });
}

/**
 * Get the list of commits that would be pushed (ahead of remote).
 * @returns {string[]} Array of commit summary lines.
 */
function getUnpushedCommits() {
  const result = shell.execSync('git log @{upstream}..HEAD --oneline');
  if (!result) return [];
  return result.split('\n').filter(Boolean);
}

/**
 * Check if there is a tracking branch configured.
 * @returns {boolean}
 */
function hasTrackingBranch() {
  const result = shell.execSync('git rev-parse --abbrev-ref @{upstream}');
  return result !== null;
}

/**
 * Check if --force flag was passed.
 * @param {string[]} args - Raw args array.
 * @param {object} context - Command context.
 * @returns {boolean}
 */
function isForceFlag(args, context) {
  if (context && context.flags && context.flags.force) return true;
  return args.includes('--force');
}

/**
 * Check if --yes flag was passed.
 * @param {string[]} args - Raw args array.
 * @param {object} context - Command context.
 * @returns {boolean}
 */
function isYesFlag(args, context) {
  if (context && context.flags && context.flags.yes) return true;
  return args.includes('--yes') || args.includes('-y');
}

/**
 * Convert a git status code to a human-readable label.
 * @param {string} status - Status code from git status --porcelain.
 * @returns {string}
 */
function statusLabel(status) {
  const labels = {
    'M': 'modified',
    'A': 'added',
    'D': 'deleted',
    'R': 'renamed',
    'C': 'copied',
    '?': 'untracked',
    '!': 'ignored',
  };
  const char = status.replace(/\s/g, '') || '?';
  return labels[char[0]] || status;
}

async function run(args, context) {
  if (!shell.commandExists('git')) {
    console.error('Error: git is not installed.');
    return;
  }

  if (!isGitRepo()) {
    console.error('Error: Not inside a git repository.');
    return;
  }

  // Filter out flags from args to build the commit message
  const messageArgs = args.filter(a => !a.startsWith('--') && a !== '-y');
  const message = messageArgs.join(' ').trim();
  if (!message) {
    console.error('Usage: dev util run git-push "your commit message"');
    console.error('');
    console.error('All arguments after the utility name become the commit message.');
    console.error('Example: dev util run git-push Fix the login button color');
    return;
  }

  const branch = getCurrentBranch();
  if (!branch) {
    console.error('Error: Not on a branch (detached HEAD).');
    console.error('Check out a branch first: git checkout <branch>');
    return;
  }

  // Check for protected branches
  const protectedBranches = ['main', 'master'];
  if (protectedBranches.includes(branch) && !isForceFlag(args, context)) {
    console.error(`Warning: You are on the "${branch}" branch.`);
    console.error('Pushing directly to this branch is usually not recommended.');
    console.error('');

    if (!context || !context.prompt) {
      console.error('Use --force to push to protected branches in non-interactive mode.');
      return;
    }

    const proceed = await context.prompt.confirm(
      `Are you sure you want to push directly to ${branch}?`,
      false
    );
    if (!proceed) {
      console.log('Cancelled.');
      return;
    }
  }

  const changedFiles = getChangedFiles();
  const existingUnpushed = hasTrackingBranch() ? getUnpushedCommits() : [];

  if (changedFiles.length === 0 && existingUnpushed.length === 0) {
    console.log('Nothing to commit or push. Working tree is clean.');
    return;
  }

  // Display what will happen
  console.log('');
  console.log(`Branch: ${branch}`);
  console.log(`Commit message: "${message}"`);
  console.log('');

  if (changedFiles.length > 0) {
    console.log(`Files to be committed (${changedFiles.length}):`);
    for (const f of changedFiles) {
      const label = statusLabel(f.status);
      console.log(`  ${label} ${f.file}`);
    }
    console.log('');
  }

  if (existingUnpushed.length > 0) {
    console.log(`Already unpushed commits (${existingUnpushed.length}):`);
    for (const c of existingUnpushed) {
      console.log(`  ${c}`);
    }
    console.log('');
  }

  // Confirm
  if (!isYesFlag(args, context)) {
    if (context && context.prompt) {
      const ok = await context.prompt.confirm('Proceed with commit and push?', true);
      if (!ok) {
        console.log('Cancelled.');
        return;
      }
    }
  }

  // Execute: add, commit, push
  console.log('Staging all changes...');
  const addResult = await shell.exec('git add -A');
  if (addResult.exitCode !== 0) {
    console.error('git add failed: ' + addResult.stderr);
    return;
  }

  console.log('Committing...');
  const escapedMessage = message.replace(/"/g, '\\"');
  const commitResult = await shell.exec(`git commit -m "${escapedMessage}"`);
  if (commitResult.exitCode !== 0) {
    console.error('git commit failed: ' + commitResult.stderr);
    return;
  }

  console.log(`Pushing to origin/${branch}...`);
  const pushResult = await shell.exec(`git push origin "${branch}"`);
  if (pushResult.exitCode !== 0) {
    console.error('git push failed: ' + pushResult.stderr);
    return;
  }

  console.log('');
  console.log('Done. Changes committed and pushed.');
}

module.exports = { meta, run };
