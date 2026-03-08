# Story 003: Git Status Utility

## Goal
Create the first real built-in utility: `src/utils/git-status/`. This utility scans a directory for git repositories and displays a color-coded summary of each repo's status -- branch name, ahead/behind tracking, dirty file count, and stash count. It is one of the most-used tools from v0.0.18, and getting it working validates the entire utility framework. The `index.js` detects the platform and delegates to `unix.sh` (a bash script for macOS and Linux) or falls back to a pure JavaScript implementation for Windows and other environments where bash is not available.

## Prerequisites
- 008-util/001 (utility framework -- `dev util run`, `list`, and `show` must be working)

## Background
Developers who work across many repos need a quick way to see which repos have uncommitted changes, which are ahead or behind their remote, and which have stashed work. Running `git status` in each repo manually is tedious. The `git-status` utility automates this by scanning a parent directory, finding all `.git` folders, and building a summary table.

In v0.0.18, this was a 200+ line bash script registered as a standalone global command. In the rebuild, it becomes a utility folder with a JavaScript entry point and a bash script for Unix platforms. The JavaScript `index.js` handles argument parsing and platform detection, then either shells out to the bash script (on macOS/Linux) or runs a pure JS fallback (on Windows/Git Bash).

Reference: `research/proposed/proposed-package-structure.md` lines 297-319 for the utility folder structure.

## Technique

### Step 1: Create the directory and index.js

Create `src/utils/git-status/index.js` with the standard utility interface:

```javascript
'use strict';

const path = require('path');
const fs = require('fs');

const meta = {
  name: 'git-status',
  description: 'Scan directories for git repos and show a color-coded status summary',
  platforms: ['macos', 'ubuntu', 'raspbian', 'amazon-linux', 'windows', 'gitbash'],
  arguments: [
    { name: 'path', required: false, description: 'Directory to scan (defaults to current directory)' }
  ],
  flags: [
    { name: 'depth', type: 'number', description: 'How many levels deep to scan for git repos (default: 1)' }
  ]
};
```

The `run` function should:

1. Parse the target directory from args (default to `process.cwd()`).
2. Parse the depth flag (default to 1, meaning only immediate subdirectories).
3. Detect the platform using `require('../../lib/platform')`.
4. On Unix platforms (macos, ubuntu, raspbian, amazon-linux), shell out to `unix.sh`.
5. On other platforms (windows, gitbash), use the pure JS fallback.

```javascript
async function run(args, context) {
  const platform = require('../../lib/platform').detect();
  const targetDir = (args[0] || process.cwd());
  const resolvedDir = path.resolve(targetDir);

  if (!fs.existsSync(resolvedDir)) {
    console.error(`Directory not found: ${resolvedDir}`);
    return;
  }

  const unixPlatforms = ['macos', 'ubuntu', 'raspbian', 'amazon-linux'];

  if (unixPlatforms.includes(platform.type)) {
    await runUnixScript(resolvedDir, args, context);
  } else {
    await runJsFallback(resolvedDir, args, context);
  }
}
```

### Step 2: Implement the Unix shell script

Create `src/utils/git-status/unix.sh`. This is where most of the display logic lives. The bash script should:

1. Accept the target directory as the first argument.
2. Find all directories containing a `.git` folder (up to the configured depth).
3. For each repo, collect:
   - **Repo name**: the directory name
   - **Branch**: output of `git symbolic-ref --short HEAD` (or "detached" if not on a branch)
   - **Ahead/behind**: parse `git rev-list --left-right --count HEAD...@{upstream}` (if a tracking branch exists)
   - **Dirty files**: count of lines from `git status --porcelain`
   - **Stash count**: count of lines from `git stash list`
4. Color-code the output:
   - Green for clean repos (no dirty files, not ahead or behind)
   - Yellow for repos with uncommitted changes
   - Red for repos that are behind their remote
   - Cyan for the branch name
5. Print a summary line for each repo.

The shell script should be called from `index.js` using `lib/shell.js`:

```javascript
async function runUnixScript(dir, args, context) {
  const shell = require('../../lib/shell');
  const scriptPath = path.join(__dirname, 'unix.sh');

  // Build the command with arguments
  const cmd = `bash "${scriptPath}" "${dir}"`;
  const result = await shell.exec(cmd);

  if (result.exitCode !== 0) {
    console.error(result.stderr || 'git-status script failed');
    return;
  }

  // The script outputs directly to stdout with colors
  if (result.stdout) {
    console.log(result.stdout);
  }
}
```

For the bash script itself, here is the approach for each repo:

```bash
#!/bin/bash
# git-status: Scan directory for git repos and show status summary

TARGET_DIR="${1:-.}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m'  # No Color
BOLD='\033[1m'

# Find git repos (immediate subdirectories with .git folders)
for dir in "$TARGET_DIR"/*/; do
  if [ ! -d "$dir/.git" ]; then
    continue
  fi

  repo_name=$(basename "$dir")

  # Get branch name
  branch=$(git -C "$dir" symbolic-ref --short HEAD 2>/dev/null)
  if [ -z "$branch" ]; then
    branch="detached"
  fi

  # Get dirty file count
  dirty_count=$(git -C "$dir" status --porcelain 2>/dev/null | wc -l | tr -d ' ')

  # Get stash count
  stash_count=$(git -C "$dir" stash list 2>/dev/null | wc -l | tr -d ' ')

  # Get ahead/behind counts
  ahead=0
  behind=0
  tracking=$(git -C "$dir" rev-parse --abbrev-ref '@{upstream}' 2>/dev/null)
  if [ -n "$tracking" ]; then
    counts=$(git -C "$dir" rev-list --left-right --count HEAD...'@{upstream}' 2>/dev/null)
    if [ -n "$counts" ]; then
      ahead=$(echo "$counts" | awk '{print $1}')
      behind=$(echo "$counts" | awk '{print $2}')
    fi
  fi

  # Determine color based on status
  color="$GREEN"
  if [ "$dirty_count" -gt 0 ]; then
    color="$YELLOW"
  fi
  if [ "$behind" -gt 0 ]; then
    color="$RED"
  fi

  # Build status string
  status_parts=""
  if [ "$dirty_count" -gt 0 ]; then
    status_parts="${status_parts} ${YELLOW}${dirty_count} dirty${NC}"
  fi
  if [ "$ahead" -gt 0 ]; then
    status_parts="${status_parts} ${GREEN}+${ahead}${NC}"
  fi
  if [ "$behind" -gt 0 ]; then
    status_parts="${status_parts} ${RED}-${behind}${NC}"
  fi
  if [ "$stash_count" -gt 0 ]; then
    status_parts="${status_parts} ${CYAN}${stash_count} stash${NC}"
  fi
  if [ -z "$status_parts" ]; then
    status_parts=" ${GREEN}clean${NC}"
  fi

  # Print the line
  printf "${color}${BOLD}%-30s${NC} ${CYAN}%-20s${NC}%s\n" "$repo_name" "$branch" "$status_parts"
done
```

### Step 3: Implement the JavaScript fallback

For platforms where bash is not available, implement the same logic in pure JavaScript inside `index.js`. This function scans the directory, runs git commands using `lib/shell.js`, and formats the output.

```javascript
async function runJsFallback(dir, args, context) {
  const shell = require('../../lib/shell');

  // Find subdirectories with .git folders
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

    // Format output (simple padding)
    const nameCol = repo.name.padEnd(30);
    const branchCol = branch.padEnd(20);
    console.log(`${nameCol} ${branchCol} ${statusParts.join('  ')}`);
  }
}
```

### Step 4: Register in registry.json

Add the git-status entry to `src/utils/registry.json`:

```json
{
  "utilities": [
    {
      "name": "git-status",
      "description": "Scan directories for git repos and show a color-coded status summary",
      "type": "built-in",
      "platforms": ["macos", "ubuntu", "raspbian", "amazon-linux", "windows", "gitbash"],
      "arguments": [
        { "name": "path", "required": false, "description": "Directory to scan (defaults to current directory)" }
      ],
      "flags": [
        { "name": "depth", "type": "number", "description": "How many levels deep to scan for repos (default: 1)" }
      ]
    }
  ]
}
```

### Step 5: Make the shell script executable

```bash
chmod +x src/utils/git-status/unix.sh
```

## Files to Create or Modify
- `src/utils/git-status/index.js` -- Entry point with meta, platform detection, and JS fallback
- `src/utils/git-status/unix.sh` -- Bash implementation for macOS and Linux
- `src/utils/registry.json` -- Add the git-status entry to the utilities array

## Acceptance Criteria
- [ ] `dev util run git-status` scans the current directory for git repos and shows a summary
- [ ] `dev util run git-status ~/Source/Personal` scans the specified directory
- [ ] Each repo line shows: repo name, branch, dirty file count, ahead/behind counts, stash count
- [ ] Clean repos are visually distinct from dirty repos (color-coded on Unix, labeled on Windows)
- [ ] Repos that are behind their remote are highlighted (red on Unix)
- [ ] The utility handles repos with no tracking branch gracefully (no ahead/behind shown)
- [ ] The utility handles detached HEAD state (shows "detached" instead of a branch name)
- [ ] The utility shows a message if no git repos are found in the target directory
- [ ] Works on macOS and Linux via the bash script
- [ ] Works on Windows and Git Bash via the JS fallback
- [ ] `dev util list` shows git-status in the output
- [ ] `dev util show git-status` shows the full metadata

## Testing

```bash
# Run in a directory that contains multiple git repos
dev util run git-status ~/Source/Personal/FredLackey
# Expected: Color-coded table showing each repo's status

# Run in the current directory (which should be a git repo parent)
cd ~/Source/Personal/FredLackey
dev util run git-status
# Expected: Same as above

# Run in a directory with no git repos
dev util run git-status /tmp
# Expected: "No git repositories found in /tmp"

# Run in a non-existent directory
dev util run git-status /does/not/exist
# Expected: Error message about directory not found

# Verify it appears in the utility list
dev util list
# Expected: git-status shows up with its description

# Verify show works
dev util show git-status
# Expected: Full metadata including platforms and arguments
```

To test specific status conditions, create test repos:

```bash
# Create test repos
mkdir -p /tmp/test-repos
cd /tmp/test-repos

# Clean repo
mkdir clean-repo && cd clean-repo && git init && echo "hello" > file.txt && git add . && git commit -m "init" && cd ..

# Dirty repo
mkdir dirty-repo && cd dirty-repo && git init && echo "hello" > file.txt && git add . && git commit -m "init" && echo "change" >> file.txt && cd ..

# Repo with stash
mkdir stash-repo && cd stash-repo && git init && echo "hello" > file.txt && git add . && git commit -m "init" && echo "stash me" >> file.txt && git stash && cd ..

# Run git-status
dev util run git-status /tmp/test-repos
# Expected: clean-repo (clean), dirty-repo (1 dirty), stash-repo (1 stash)

# Clean up
rm -rf /tmp/test-repos
```

## Notes
- The bash script uses ANSI escape codes for colors. When the output is piped (not a terminal), the escape codes will appear as literal characters. A future improvement could detect whether stdout is a TTY and disable colors when piped. For now, this is acceptable.
- The `git -C "$dir"` syntax runs a git command as if you `cd`'d into that directory first. This avoids actually changing the working directory, which is important for scanning multiple repos.
- The ahead/behind count uses `git rev-list --left-right --count HEAD...@{upstream}`. If the repo has no upstream tracking branch, this command fails. The script handles this by checking for a tracking branch first and skipping ahead/behind if there is none.
- The JS fallback uses `shell.execSync` for simplicity. Each git command is a separate exec call, which means scanning 50 repos runs about 200 shell commands. This is fast enough for typical use (under 2 seconds for 50 repos on a modern machine). If performance becomes an issue, the commands could be batched.
- The depth flag is defined in the meta but is not implemented in this story. The default behavior scans immediate subdirectories only (depth 1). Supporting deeper scans is a future enhancement. The flag is included in the meta now so that the interface is stable when the feature is added later.
