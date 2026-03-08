# Story 005: Homebrew Installer

## Goal
Create `src/installers/homebrew.js` to install Homebrew on macOS. This is a platform-specific installer -- it only works on macOS, and all other platforms should get a clear "not available on your OS" message instead of a cryptic error. Homebrew is the foundation for most macOS tool installations, so several other installers depend on it being there.

## Prerequisites
- 006-tools/001 (installer framework -- provides the base pattern and registry)

## Background
Homebrew is the de facto package manager for macOS. It installs command-line tools, GUI applications (via casks), and fonts. Most of our macOS install functions (git, node, vscode, docker, etc.) use `brew install` under the hood, so Homebrew needs to be available first.

The official Homebrew install method is a single bash script downloaded from GitHub:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

This script handles everything: checking for Xcode Command Line Tools, downloading Homebrew, and setting up the PATH. On Apple Silicon Macs (M1/M2/M3), Homebrew installs to `/opt/homebrew/` instead of `/usr/local/`. The install script handles this automatically.

The registry entry for this tool has `platforms: ['macos']` -- it's the only installer that's limited to a single platform. On Ubuntu, Amazon Linux, or Windows, the framework should catch the platform mismatch before the installer is even called. But we still implement the other `install_<platform>()` functions -- they just throw clear error messages.

## Technique

### Step 1: Create `src/installers/homebrew.js`

Start from `_template.js`.

**`isInstalled(context)`**

Check if the `brew` binary is on the PATH:

```javascript
async function isInstalled(context) {
  return context.shell.commandExists('brew');
}
```

**`getVersion(context)`**

```javascript
async function getVersion(context) {
  try {
    const result = await context.shell.exec('brew --version');
    // Output looks like: "Homebrew 4.2.5"
    const match = result.stdout.trim().match(/Homebrew\s+(\d+\.\d+\.\d+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}
```

**`install_macos(context)`**

This is the only platform function with real install logic:

```javascript
async function install_macos(context) {
  context.output.info('Installing Homebrew...');
  context.output.info('This may prompt for your password and take a few minutes.');

  // The official Homebrew install script.
  // NONINTERACTIVE=1 suppresses the "Press RETURN to continue" prompt.
  await context.shell.exec(
    'NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'
  );

  // On Apple Silicon Macs, brew installs to /opt/homebrew and the install script
  // tells the user to add it to their PATH. We do that here if needed.
  const platform = context.platform.detect();
  if (platform.arch === 'arm64') {
    // Check if brew is now on the PATH
    if (!context.shell.commandExists('brew')) {
      context.output.info('Adding Homebrew to PATH for Apple Silicon...');
      // Add the eval line to the current shell profile
      const profilePath = getShellProfile();
      const brewInitLine = 'eval "$(/opt/homebrew/bin/brew shellenv)"';

      const fs = require('fs');
      const existing = fs.existsSync(profilePath) ? fs.readFileSync(profilePath, 'utf8') : '';
      if (!existing.includes(brewInitLine)) {
        fs.appendFileSync(profilePath, `\n# Homebrew\n${brewInitLine}\n`);
        context.output.info(`Added Homebrew PATH to ${profilePath}`);
      }
    }
  }

  // Verify it worked
  if (!context.shell.commandExists('brew')) {
    // Try the known paths directly
    const fs = require('fs');
    if (fs.existsSync('/opt/homebrew/bin/brew') || fs.existsSync('/usr/local/bin/brew')) {
      context.output.warn(
        'Homebrew installed, but "brew" is not on your PATH yet. Open a new terminal or run: eval "$(/opt/homebrew/bin/brew shellenv)"'
      );
      return;
    }
    throw new Error('Homebrew installation failed. Check the output above for errors.');
  }

  context.output.success('Homebrew installed successfully.');
}
```

**Helper: `getShellProfile()`**

A small internal function to find the right shell profile to append to:

```javascript
const path = require('path');
const os = require('os');

function getShellProfile() {
  const shell = process.env.SHELL || '';
  if (shell.includes('zsh')) {
    return path.join(os.homedir(), '.zshrc');
  }
  return path.join(os.homedir(), '.bashrc');
}
```

**All other `install_<platform>()` functions**

For every non-macOS platform, throw an error with a clear message. Don't leave them as generic "not implemented" errors. Be specific about why.

```javascript
async function install_ubuntu(context) {
  throw new Error(
    'Homebrew is only available on macOS. On Ubuntu, packages are managed with apt. ' +
    'DevUtils uses apt automatically for Ubuntu installations.'
  );
}

async function install_raspbian(context) {
  throw new Error(
    'Homebrew is only available on macOS. On Raspberry Pi OS, packages are managed with apt. ' +
    'DevUtils uses apt automatically for Raspberry Pi installations.'
  );
}

async function install_amazon_linux(context) {
  throw new Error(
    'Homebrew is only available on macOS. On Amazon Linux, packages are managed with dnf/yum. ' +
    'DevUtils uses dnf/yum automatically for Amazon Linux installations.'
  );
}

async function install_windows(context) {
  throw new Error(
    'Homebrew is only available on macOS. On Windows, packages are managed with Chocolatey or winget. ' +
    'DevUtils uses those automatically for Windows installations.'
  );
}

async function install_gitbash(context) {
  throw new Error(
    'Homebrew is only available on macOS. In Git Bash, use the Windows package managers (Chocolatey or winget) instead.'
  );
}
```

These error messages should never appear in practice because the installer framework checks the `platforms` array before calling the installer. But if someone calls the installer directly (bypassing the framework), they'll get a helpful message instead of a confusing crash.

### Step 2: Add the registry entry

Verify the homebrew entry in `registry.json` from story 001:

```json
{
  "name": "homebrew",
  "description": "Package manager for macOS",
  "platforms": ["macos"],
  "dependencies": [],
  "desktop": false,
  "installer": "homebrew.js"
}
```

The `platforms` array with only `["macos"]` is what tells the framework to reject this tool on other platforms before even loading the installer.

## Files to Create or Modify
- `src/installers/homebrew.js` -- The Homebrew installer (new file)
- `src/installers/registry.json` -- Verify homebrew entry is correct (no changes expected)

## Acceptance Criteria
- [ ] `src/installers/homebrew.js` exists and exports `isInstalled`, `install`, `getVersion`, and all six `install_<platform>` functions
- [ ] `isInstalled()` returns `true` when `brew` is on the PATH
- [ ] `getVersion()` returns a version string like `'4.2.5'`
- [ ] `install_macos()` runs the official Homebrew install script
- [ ] `install_macos()` uses `NONINTERACTIVE=1` to avoid the "Press RETURN" prompt
- [ ] `install_macos()` handles Apple Silicon PATH setup (adds to `.zshrc` if needed)
- [ ] `install_macos()` doesn't duplicate the PATH line if it already exists in the profile
- [ ] All non-macOS `install_<platform>()` functions throw errors with helpful messages
- [ ] The error messages for non-macOS platforms explain what package manager to use instead
- [ ] Running the installer when Homebrew is already installed does nothing (idempotent)
- [ ] `registry.json` has `platforms: ["macos"]` for the homebrew entry

## Testing

```bash
# Test isInstalled (on macOS with Homebrew)
node -e "
  const brew = require('./src/installers/homebrew');
  const context = { shell: { commandExists: (cmd) => { try { require('child_process').execSync('which ' + cmd, { stdio: 'ignore' }); return true; } catch { return false; } } } };
  brew.isInstalled(context).then(r => console.log('installed:', r));
"
# Expected on macOS with Homebrew: installed: true

# Test getVersion
node -e "
  const brew = require('./src/installers/homebrew');
  const context = { shell: { exec: async (cmd) => { const r = require('child_process').execSync(cmd).toString(); return { stdout: r }; } } };
  brew.getVersion(context).then(v => console.log('version:', v));
"
# Expected: version: 4.x.x

# Test that non-macOS functions throw clear errors
node -e "
  const brew = require('./src/installers/homebrew');
  brew.install_ubuntu({}).catch(e => console.log(e.message));
"
# Expected: "Homebrew is only available on macOS. On Ubuntu, packages are managed with apt..."

# Test registry platforms filter
node -e "
  const installer = require('./src/lib/installer');
  const tool = installer.findTool('homebrew');
  console.log('platforms:', tool.platforms);
"
# Expected: platforms: [ 'macos' ]
```

## Notes
- **`NONINTERACTIVE=1`** is the key to making the Homebrew install script work in an automated context. Without it, the script pauses and says "Press RETURN to continue or any other key to abort." That would hang our CLI.
- **Apple Silicon PATH quirk.** On Intel Macs, Homebrew installs to `/usr/local/bin/` which is already on the PATH by default. On Apple Silicon, it installs to `/opt/homebrew/bin/` which is NOT on the PATH by default. The install script tells the user to add a line to their shell profile, and we automate that. But the current process won't see the new PATH until the user opens a new terminal, so `commandExists('brew')` might return `false` right after install. That's why we check the known paths directly as a fallback.
- **Profile file detection.** We check `$SHELL` to decide between `.zshrc` and `.bashrc`. Since macOS Catalina (2019), the default shell is zsh, so `.zshrc` is the right choice for most macOS users. If someone is using bash on macOS, they'll get `.bashrc` instead.
- **Don't add Homebrew as a dependency for git.** Even though `install_macos` for git uses `brew install git`, the git installer checks for brew and gives a helpful error if it's missing. Making homebrew a formal dependency of git would mean `dev tools install git` on Linux tries to install homebrew first, which fails. Each macOS install function should check for brew independently and suggest installing it if missing.
