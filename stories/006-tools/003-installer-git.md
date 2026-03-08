# Story 003: Git Installer

## Goal
Create the first real installer: `src/installers/git.js`. This installs git on all six supported platforms. It's the simplest installer we'll build, which makes it a good test of the framework from story 001. Git is also a dependency for other tools (nvm needs it to clone its repo), so it needs to exist before we can build the node installer.

## Prerequisites
- 006-tools/001 (installer framework -- provides the base pattern, registry, and orchestration)

## Background
Git is available through every major package manager, so the install commands are straightforward. The interesting parts are:

1. **Idempotency** -- Before installing, check if git is already on the system. If it is, do nothing.
2. **Platform-specific quirks** -- On macOS, the first time you run `git` it may trigger Xcode Command Line Tools installation. On Git Bash, git is already present by definition (Git Bash ships with git).
3. **Version detection** -- `git --version` returns something like `git version 2.43.0`. We need to parse the version number out of that string for `dev tools check git`.

The registry entry for git was added in story 001. This story creates the actual installer file that the registry points to.

## Technique

### Step 1: Create `src/installers/git.js`

Copy `src/installers/_template.js` and modify it. Here's what each function should do:

**`isInstalled(context)`**

Check if the `git` binary is on the PATH using `context.shell.commandExists('git')`. Return `true` or `false`.

```javascript
async function isInstalled(context) {
  return context.shell.commandExists('git');
}
```

That's it. Simple.

**`getVersion(context)`**

This is an extra function not in the template. Add it because the `check` command needs it. Run `git --version` and parse out the version number.

```javascript
async function getVersion(context) {
  try {
    const result = await context.shell.exec('git --version');
    // Output looks like: "git version 2.43.0" or "git version 2.43.0.windows.1"
    const match = result.stdout.trim().match(/(\d+\.\d+\.\d+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}
```

**`install_macos(context)`**

Install git via Homebrew. Homebrew should already be available (it's either preinstalled or installed via the homebrew installer). If `brew` isn't available, print a message telling the user to install Homebrew first (or run `dev tools install homebrew`).

```javascript
async function install_macos(context) {
  if (!context.shell.commandExists('brew')) {
    throw new Error(
      'Homebrew is not installed. Run "dev tools install homebrew" first, or install git manually.'
    );
  }
  await context.shell.exec('brew install git');
}
```

**`install_ubuntu(context)`**

Install via apt. This requires sudo. Use `context.shell.exec()` which should handle sudo prompting.

```javascript
async function install_ubuntu(context) {
  await context.shell.exec('sudo apt-get update');
  await context.shell.exec('sudo apt-get install -y git');
}
```

The `-y` flag auto-confirms the install prompt. Without it, apt would wait for user input and the script would hang.

**`install_raspbian(context)`**

Same as Ubuntu. Raspbian is Debian-based and uses apt.

```javascript
async function install_raspbian(context) {
  await context.shell.exec('sudo apt-get update');
  await context.shell.exec('sudo apt-get install -y git');
}
```

**`install_amazon_linux(context)`**

Install via dnf (preferred) or fall back to yum.

```javascript
async function install_amazon_linux(context) {
  const hasDnf = context.shell.commandExists('dnf');
  if (hasDnf) {
    await context.shell.exec('sudo dnf install -y git');
  } else {
    await context.shell.exec('sudo yum install -y git');
  }
}
```

**`install_windows(context)`**

Try Chocolatey first, then winget.

```javascript
async function install_windows(context) {
  const hasChoco = context.shell.commandExists('choco');
  const hasWinget = context.shell.commandExists('winget');

  if (hasChoco) {
    await context.shell.exec('choco install git -y');
  } else if (hasWinget) {
    await context.shell.exec('winget install --id Git.Git --accept-package-agreements --accept-source-agreements');
  } else {
    throw new Error(
      'Neither Chocolatey nor winget is available. Install one of them first, or download git from https://git-scm.com'
    );
  }
}
```

The winget command uses `--accept-package-agreements` and `--accept-source-agreements` to avoid interactive prompts.

**`install_gitbash(context)`**

Git Bash ships with git. There's nothing to install. Just confirm it's there.

```javascript
async function install_gitbash(context) {
  if (await isInstalled(context)) {
    context.output.info('Git is already available in Git Bash.');
    return;
  }
  // This shouldn't happen -- Git Bash IS git. But just in case:
  throw new Error(
    'Git not found in Git Bash environment. This is unexpected. Reinstall Git for Windows from https://git-scm.com'
  );
}
```

**`install(context)` dispatcher**

Same pattern as the template, dispatching by platform type.

### Step 2: Update `registry.json` if needed

The git entry was already added in story 001. Verify it looks right:

```json
{
  "name": "git",
  "description": "Distributed version control system",
  "platforms": ["macos", "ubuntu", "raspbian", "amazon-linux", "windows", "gitbash"],
  "dependencies": [],
  "desktop": false,
  "installer": "git.js"
}
```

### Step 3: Verify the full chain works

Make sure the framework can find the registry entry, load `git.js`, call `isInstalled()`, and (if needed) call `install()`. This validates the framework from story 001 with a real installer.

## Files to Create or Modify
- `src/installers/git.js` -- The git installer (new file)
- `src/installers/registry.json` -- Verify the git entry is correct (no changes if story 001 was done right)

## Acceptance Criteria
- [ ] `src/installers/git.js` exists and exports `isInstalled`, `install`, `getVersion`, and all six `install_<platform>` functions
- [ ] `isInstalled()` returns `true` on a system with git installed
- [ ] `isInstalled()` returns `false` on a system without git
- [ ] `getVersion()` returns a version string like `'2.43.0'` on a system with git
- [ ] `getVersion()` returns `null` if version parsing fails
- [ ] `install_macos()` runs `brew install git`
- [ ] `install_macos()` throws a clear error if Homebrew isn't available
- [ ] `install_ubuntu()` and `install_raspbian()` run `sudo apt-get install -y git`
- [ ] `install_amazon_linux()` uses dnf if available, yum as fallback
- [ ] `install_windows()` uses choco if available, winget as fallback, error if neither
- [ ] `install_gitbash()` recognizes git is already present in Git Bash
- [ ] Running `install()` on a system that already has git does not reinstall it (framework handles this)
- [ ] The installer framework can load and execute this installer without errors

## Testing

```bash
# Test isInstalled (git should be on most dev machines)
node -e "
  const git = require('./src/installers/git');
  const context = { shell: { commandExists: (cmd) => { try { require('child_process').execSync('which ' + cmd, { stdio: 'ignore' }); return true; } catch { return false; } } } };
  git.isInstalled(context).then(r => console.log('installed:', r));
"
# Expected: installed: true

# Test getVersion
node -e "
  const git = require('./src/installers/git');
  const context = { shell: { exec: async (cmd) => { const r = require('child_process').execSync(cmd).toString(); return { stdout: r }; } } };
  git.getVersion(context).then(v => console.log('version:', v));
"
# Expected: version: 2.x.x (whatever your git version is)

# Test through the framework
node -e "
  const installer = require('./src/lib/installer');
  const tool = installer.findTool('git');
  const mod = installer.loadInstaller(tool);
  console.log('exports:', Object.keys(mod));
"
# Expected: exports: [ 'isInstalled', 'install', 'getVersion', 'install_macos', ... ]
```

## Notes
- On macOS, if Xcode Command Line Tools aren't installed, the first `git` command triggers a system dialog to install them. Our installer uses `brew install git` which installs its own git binary, avoiding this issue. But `isInstalled()` might return `true` even if only the Xcode shim is there (it returns a version string). That's fine -- the Xcode-provided git works.
- The `sudo` calls in the Ubuntu, Raspbian, and Amazon Linux installers will prompt for a password if the user's sudo session has expired. There's no way around this for system-level package installation. The user needs to be in the sudoers file.
- The `getVersion()` function is optional in the installer pattern. Not every installer needs it. But for tools where version detection is straightforward (like git), it's nice to have.
- On Windows, the `choco install git -y` flag is Chocolatey's equivalent of apt's `-y` -- it auto-confirms the install.
