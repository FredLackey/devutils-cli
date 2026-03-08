# Story 005: Git Push Utility

## Goal
Create the built-in `git-push` utility at `src/utils/git-push/`. This is a safer version of the common "add, commit, push" workflow. Before doing anything destructive, it shows the user exactly what will be pushed -- which commits, which files changed -- and asks for confirmation in interactive mode. It also prevents accidental pushes to protected branches (main and master) without explicit confirmation. This replaces the legacy `git-push` script from v0.0.18 with guardrails that prevent common mistakes.

## Prerequisites
- 008-util/001 (utility framework -- `dev util run`, `list`, and `show` must be working)

## Background
The v0.0.18 `git-push` script (at `_rebuild/src/scripts/git-push.js`) ran `git add -A && git commit -m "message" && git push` in one shot. It was convenient but risky: it staged everything (including files you might not want committed), pushed without showing what would go out, and had no branch protection. The new version keeps the convenience but adds visibility and safety.

The utility works entirely in JavaScript using `lib/shell.js` to run git commands. There are no platform-specific differences since git commands are the same everywhere.

Reference: `_rebuild/src/scripts/git-push.js` for the original implementation.

## Technique

### Step 1: Create the directory and index.js

Create `src/utils/git-push/index.js`:

```javascript
'use strict';

const meta = {
  name: 'git-push',
  description: 'Safer git push: shows what will be pushed, confirms before pushing, and protects main/master',
  platforms: ['macos', 'ubuntu', 'raspbian', 'amazon-linux', 'windows', 'gitbash'],
  arguments: [
    { name: 'message', required: true, description: 'Commit message (all arguments after the name are joined)' }
  ],
  flags: [
    { name: 'force', type: 'boolean', description: 'Allow pushing to protected branches (main/master)' },
    { name: 'yes', type: 'boolean', description: 'Skip the confirmation prompt' }
  ]
};
```

### Step 2: Implement git helper functions

Write small helper functions that wrap individual git commands. Use `lib/shell.js` for all shell execution.

```javascript
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
 * @returns {string|null} Branch name, or null if in detached HEAD state
 */
function getCurrentBranch() {
  const result = shell.execSync('git symbolic-ref --short HEAD');
  return result || null;
}

/**
 * Get a list of changed files (staged, unstaged, and untracked).
 * Returns an array of { status, file } objects.
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
 * @returns {string[]} Array of commit summary lines
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
```

### Step 3: Implement the run function

The `run` function should follow this flow:

1. **Check prerequisites.** Verify we are in a git repo and git is installed.

2. **Get the commit message.** Join all positional args into a single message string. If no message is provided, show usage and exit.

3. **Check the current branch.** If it is `main` or `master` and `--force` is not set, warn the user and ask for explicit confirmation.

4. **Show what will happen.** Display:
   - The current branch
   - A list of changed files (from `git status --porcelain`)
   - Any existing unpushed commits (from `git log @{upstream}..HEAD`)
   - The commit message that will be used

5. **Ask for confirmation.** In interactive mode (unless `--yes` is set), ask the user to confirm before proceeding.

6. **Execute.** Run `git add -A`, `git commit -m "message"`, and `git push origin <branch>`.

```javascript
async function run(args, context) {
  // Check git is installed
  if (!shell.commandExists('git')) {
    console.error('Error: git is not installed.');
    return;
  }

  // Check we are in a git repo
  if (!isGitRepo()) {
    console.error('Error: Not inside a git repository.');
    return;
  }

  // Get the commit message (all args joined)
  const message = args.join(' ').trim();
  if (!message) {
    console.error('Usage: dev util run git-push "your commit message"');
    console.error('');
    console.error('All arguments after the utility name become the commit message.');
    console.error('Example: dev util run git-push Fix the login button color');
    return;
  }

  // Get the current branch
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

    // In non-interactive mode without --force, refuse
    if (!context || !context.prompt) {
      console.error('Use --force to push to protected branches in non-interactive mode.');
      return;
    }

    const proceed = await context.prompt.confirm(
      `Are you sure you want to push directly to ${branch}?`,
      { default: false }
    );
    if (!proceed) {
      console.log('Cancelled.');
      return;
    }
  }

  // Gather information to show the user
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
      const ok = await context.prompt.confirm('Proceed with commit and push?', { default: true });
      if (!ok) {
        console.log('Cancelled.');
        return;
      }
    }
  }

  // Execute: add, commit, push
  try {
    console.log('Staging all changes...');
    const addResult = await shell.exec('git add -A');
    if (addResult.exitCode !== 0) {
      console.error('git add failed: ' + addResult.stderr);
      return;
    }

    console.log('Committing...');
    // Escape double quotes in the message for the shell command
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
  } catch (err) {
    console.error('Unexpected error: ' + err.message);
  }
}
```

### Step 4: Add helper functions for flag detection and status labels

Since utilities receive raw args (not the parsed flags object that commands get), you need to check for flags manually in the args array, or adapt based on whether the context provides flags.

```javascript
/**
 * Check if --force flag was passed.
 * Checks both the args array and context.flags if available.
 */
function isForceFlag(args, context) {
  if (context && context.flags && context.flags.force) return true;
  return args.includes('--force');
}

/**
 * Check if --yes flag was passed.
 */
function isYesFlag(args, context) {
  if (context && context.flags && context.flags.yes) return true;
  return args.includes('--yes') || args.includes('-y');
}

/**
 * Convert a git status code to a human-readable label.
 * @param {string} status - Two-character status code from git status --porcelain
 * @returns {string} A readable label like "modified", "added", "deleted", etc.
 */
function statusLabel(status) {
  const labels = {
    'M': 'modified',
    'A': 'added',
    'D': 'deleted',
    'R': 'renamed',
    'C': 'copied',
    '?': 'untracked',
    '!': 'ignored'
  };
  // The first character is the index (staged) status, the second is the worktree status
  // Show whichever is non-space
  const char = status.replace(/\s/g, '') || '?';
  return labels[char[0]] || status;
}
```

### Step 5: Register in registry.json

Add the git-push entry to `src/utils/registry.json`:

```json
{
  "name": "git-push",
  "description": "Safer git push: shows what will be pushed, confirms before pushing, and protects main/master",
  "type": "built-in",
  "platforms": ["macos", "ubuntu", "raspbian", "amazon-linux", "windows", "gitbash"],
  "arguments": [
    { "name": "message", "required": true, "description": "Commit message" }
  ],
  "flags": [
    { "name": "force", "type": "boolean", "description": "Allow pushing to protected branches" },
    { "name": "yes", "type": "boolean", "description": "Skip confirmation prompt" }
  ]
}
```

## Files to Create or Modify
- `src/utils/git-push/index.js` -- Full implementation with safety checks, preview, confirmation, and execution
- `src/utils/registry.json` -- Add the git-push entry to the utilities array

## Acceptance Criteria
- [ ] `dev util run git-push "commit message"` stages, commits, and pushes changes
- [ ] Before pushing, the utility shows a summary of files to be committed
- [ ] Before pushing, the utility shows any existing unpushed commits
- [ ] In interactive mode, the utility asks for confirmation before proceeding
- [ ] `--yes` flag skips the confirmation prompt
- [ ] Pushing to `main` or `master` shows a warning and requires extra confirmation
- [ ] `--force` flag allows pushing to `main`/`master` without the extra confirmation
- [ ] If there are no changes, the utility says so and exits without error
- [ ] If not in a git repo, a clear error is shown
- [ ] If git is not installed, a clear error is shown
- [ ] If in a detached HEAD state, a clear error tells the user to check out a branch
- [ ] Multiple args without quotes are joined into the commit message (e.g., `git-push Fix the bug`)
- [ ] `dev util list` shows git-push in the output
- [ ] `dev util show git-push` shows the full metadata

## Testing

```bash
# Create a test repo
mkdir /tmp/test-git-push && cd /tmp/test-git-push
git init
git commit --allow-empty -m "initial"

# Make some changes
echo "hello" > file1.txt
echo "world" > file2.txt

# Run git-push (should show the files and ask for confirmation)
dev util run git-push "Add two files"
# Expected: Shows file1.txt and file2.txt as untracked, asks to confirm, then commits and pushes
# (Push will fail since there is no remote -- that is expected for a local test repo)

# Test with no changes
dev util run git-push "Nothing here"
# Expected: "Nothing to commit or push."

# Test protected branch warning
git checkout -b main 2>/dev/null || git checkout main
echo "change" >> file1.txt
dev util run git-push "Push to main"
# Expected: Warning about pushing to main, asks for extra confirmation

# Test with --yes
echo "another" >> file1.txt
dev util run git-push --yes "Quick push"
# Expected: No confirmation prompt, just commits and pushes

# Test with no message
dev util run git-push
# Expected: Usage message

# Test outside a git repo
cd /tmp
dev util run git-push "Not a repo"
# Expected: Error about not being in a git repo

# Clean up
rm -rf /tmp/test-git-push
```

## Notes
- The commit message is built by joining all args, so `dev util run git-push Fix the login bug` works the same as `dev util run git-push "Fix the login bug"`. This is more forgiving than requiring quotes. However, special shell characters in unquoted messages (like `!`, `$`, backticks) may cause issues. Document this in the utility's meta description if needed.
- The `--force` and `--yes` flags are checked by scanning the raw args array. This is because utilities receive raw positional args from the framework, not parsed flags. If the framework evolves to pass parsed flags, the detection functions should check both sources.
- The utility uses `git add -A` to stage everything, including untracked files. This matches the old behavior. If a user wants selective staging, they should use raw git commands. The purpose of this utility is speed, not precision.
- The protected branch list (`main`, `master`) is hardcoded. A future enhancement could let users configure their own protected branches in `~/.devutils/config.json`. For now, these two cover 99% of cases.
- The push command uses `git push origin <branch>`. This assumes the remote is named `origin`, which is the default. If the user has renamed their remote, this will fail. That is acceptable for a convenience utility -- edge cases should use raw git commands.
- When `git push` fails because there is no remote (like in a local-only test repo), the error message from git is shown. The utility does not try to set up a remote automatically.
