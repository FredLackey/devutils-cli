# Story 002: Shell Utilities

## Goal
Build the shell execution wrapper that every installer, utility, and command in DevUtils uses to run system commands. Instead of calling `child_process` directly in dozens of places (and handling errors differently each time), everything goes through `src/lib/shell.js`. This gives us one place to handle errors, one place to add logging, and one consistent return format.

## Prerequisites
- Story 001: Platform Detection (shell.js uses platform detection for `which` vs `where` on Windows)

## Background
DevUtils runs a lot of shell commands: `brew install`, `apt-get update`, `git clone`, `which node`, and so on. The legacy codebase called `child_process.exec` and `child_process.execSync` directly all over the place. That meant every file had its own error handling (or didn't have any), and there was no consistent way to capture stdout, stderr, and the exit code together.

This module wraps those Node.js built-ins with consistent behavior. Every shell command in the entire project goes through here. If we ever need to add command logging, dry-run support, or timeout handling, we do it in one place.

Reference: `research/proposed/proposed-package-structure.md` lines 399-401.

## Technique

### Step 1: Implement `exec(cmd, opts)` (async)

This is the async version. It wraps `child_process.exec` in a Promise and always resolves (never rejects). The caller gets back a result object and decides what to do with errors.

```javascript
const { exec: cpExec } = require('child_process');

async function exec(cmd, opts = {}) {
  return new Promise((resolve) => {
    cpExec(cmd, opts, (error, stdout, stderr) => {
      resolve({
        stdout: stdout ? stdout.toString().trim() : '',
        stderr: stderr ? stderr.toString().trim() : '',
        exitCode: error ? error.code || 1 : 0
      });
    });
  });
}
```

Key design decisions:
- **Always resolve, never reject.** The caller checks `exitCode` to see if the command succeeded. This avoids try/catch boilerplate everywhere.
- **Trim stdout and stderr.** Shell commands often have trailing newlines. Trimming here saves every caller from doing it.
- **Default exitCode to 1 on error.** Some errors don't have a code property. Defaulting to 1 is safer than `undefined`.
- The `opts` parameter passes through to `child_process.exec`, so callers can set `cwd`, `env`, `timeout`, etc.

### Step 2: Implement `execSync(cmd, opts)` (synchronous)

This wraps `child_process.execSync`. Returns the trimmed stdout string on success, or `null` on failure.

```javascript
const { execSync: cpExecSync } = require('child_process');

function execSync(cmd, opts = {}) {
  try {
    const result = cpExecSync(cmd, { ...opts, encoding: 'utf8' });
    return result ? result.trim() : '';
  } catch (err) {
    return null;
  }
}
```

Key decisions:
- Returns `null` on failure, not an empty string. This lets callers distinguish between "command succeeded but produced no output" (empty string) and "command failed" (null).
- Always sets `encoding: 'utf8'` so the result is a string, not a Buffer.

### Step 3: Implement `which(binary)`

Finds the full path to a binary on the system PATH. Returns the path string or `null` if not found.

```javascript
function which(binary) {
  const platform = require('./platform').detect();
  const cmd = platform.type === 'windows' ? `where ${binary}` : `which ${binary}`;
  const result = execSync(cmd);
  if (result === null) {
    return null;
  }
  // 'where' on Windows can return multiple lines; take the first one
  return result.split('\n')[0].trim();
}
```

Uses `platform.detect()` to decide whether to run `which` (unix) or `where` (Windows). Git Bash has its own `which`, so it uses the unix path.

Wait -- there's a subtlety. On `gitbash`, `process.platform` is `'win32'`, but Git Bash provides `which`. The platform detection from Story 001 returns `type: 'gitbash'` for Git Bash. So the check should be specifically for `type === 'windows'`, not for `process.platform === 'win32'`.

### Step 4: Implement `commandExists(binary)`

A boolean wrapper around `which()`. Returns `true` if the binary is found, `false` otherwise.

```javascript
function commandExists(binary) {
  return which(binary) !== null;
}
```

That's it. Simple wrapper. But it's clearer at the call site: `if (shell.commandExists('docker'))` reads better than `if (shell.which('docker') !== null)`.

### Step 5: Code style and exports

```javascript
module.exports = { exec, execSync, which, commandExists };
```

- CommonJS modules
- 2-space indentation, LF line endings
- JSDoc comments on every exported function
- `'use strict';` at the top
- No external dependencies

## Files to Create or Modify
- `src/lib/shell.js` - All four functions: `exec`, `execSync`, `which`, `commandExists`

## Acceptance Criteria
- [ ] `exec(cmd)` returns a Promise that resolves to `{ stdout, stderr, exitCode }`
- [ ] `exec` never rejects -- failed commands resolve with `exitCode > 0`
- [ ] `execSync(cmd)` returns a trimmed string on success, `null` on failure
- [ ] `which('node')` returns the full path to node (e.g., `/usr/local/bin/node`)
- [ ] `which('nonexistent-xyz')` returns `null`
- [ ] `commandExists('node')` returns `true`
- [ ] `commandExists('nonexistent-xyz')` returns `false`
- [ ] `opts` parameter passes through to `child_process` (e.g., `cwd`, `timeout`)
- [ ] No external dependencies are added to package.json

## Testing

Run from the project root:

```bash
# Test async exec - successful command
node -e "const s = require('./src/lib/shell'); s.exec('echo hello').then(r => console.log(r))"
# Expected: { stdout: 'hello', stderr: '', exitCode: 0 }

# Test async exec - failed command
node -e "const s = require('./src/lib/shell'); s.exec('nonexistent-command-xyz').then(r => console.log(r))"
# Expected: { stdout: '', stderr: '...not found...', exitCode: 127 }

# Test execSync - successful command
node -e "const s = require('./src/lib/shell'); console.log(s.execSync('echo hello'))"
# Expected: hello

# Test execSync - failed command
node -e "const s = require('./src/lib/shell'); console.log(s.execSync('nonexistent-command-xyz'))"
# Expected: null

# Test which - known binary
node -e "const s = require('./src/lib/shell'); console.log(s.which('node'))"
# Expected: /usr/local/bin/node  (or wherever node is installed)

# Test which - unknown binary
node -e "const s = require('./src/lib/shell'); console.log(s.which('nonexistent-xyz'))"
# Expected: null

# Test commandExists
node -e "const s = require('./src/lib/shell'); console.log(s.commandExists('node'), s.commandExists('nonexistent-xyz'))"
# Expected: true false

# Test opts passthrough (cwd)
node -e "const s = require('./src/lib/shell'); s.exec('pwd', { cwd: '/tmp' }).then(r => console.log(r.stdout))"
# Expected: /tmp  (or /private/tmp on macOS)
```

## Notes
- The `exec` function always resolves. This is intentional. Most callers in DevUtils want to check the exit code and take different actions for success vs. failure. If we rejected on failure, every call site would need try/catch, which is noisy and easy to forget.
- The `execSync` function returns `null` on failure (not an empty string). This is important -- an empty string means "the command ran but produced no output," while `null` means "the command failed." Callers should check `result !== null` for success.
- Be careful with `which` on Windows. The `where` command can return multiple lines if a binary exists in multiple PATH locations. We take only the first line.
- Don't add shell injection protection in this story. The callers are all internal DevUtils code, not user-supplied strings piped directly into exec. If we need input sanitization later, we'll add it as a separate concern.
- The `opts` parameter supports everything `child_process.exec` supports: `cwd`, `env`, `timeout`, `maxBuffer`, `encoding`, etc. Don't filter or restrict these.
