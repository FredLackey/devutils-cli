# Story 004: Node.js Installer

## Goal
Create `src/installers/node.js` to install Node.js on all six platforms. On Unix-like systems (macOS, Ubuntu, Raspbian, Amazon Linux), we install nvm first and then use it to install Node LTS. On Windows, we use Chocolatey or winget. On Git Bash, we guide the user to a manual download. This installer is more complex than git because it has a dependency (git, which nvm uses to clone its repo) and involves a two-step process on most platforms.

## Prerequisites
- 006-tools/003 (git installer -- nvm requires git to clone its repository)

## Background
Node Version Manager (nvm) is the standard way to install Node.js on Unix systems. It lets you switch between Node versions per project, which is important for a developer tools CLI. We don't want to install Node directly via apt or brew because that gives you a single system-wide version that's hard to change.

Here's the flow on Unix:
1. Check if nvm is already installed (look for the `NVM_DIR` environment variable or the `~/.nvm` directory).
2. If not, install nvm using its official install script (which downloads via curl or wget).
3. Source nvm into the current shell session.
4. Run `nvm install --lts` to get the latest long-term-support version.
5. Run `nvm alias default lts/*` so it's the default in new shells.

On Windows, nvm-windows exists but it's a different tool with different behavior. It's simpler to just install Node directly via Chocolatey or winget.

The registry entry for node (from story 001) lists git as a dependency. The installer framework will make sure git is installed before calling the node installer.

## Technique

### Step 1: Create `src/installers/node.js`

Start from `_template.js` and implement each function.

**`isInstalled(context)`**

Check if `node` is on the PATH:

```javascript
async function isInstalled(context) {
  return context.shell.commandExists('node');
}
```

**`getVersion(context)`**

```javascript
async function getVersion(context) {
  try {
    const result = await context.shell.exec('node --version');
    // Output looks like: "v20.11.0"
    const match = result.stdout.trim().match(/v?(\d+\.\d+\.\d+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}
```

**Helper: `isNvmInstalled(context)`**

This is an internal helper (not exported) that checks if nvm is available. nvm is a shell function, not a binary, so `which nvm` won't find it. Instead, check for the `~/.nvm` directory:

```javascript
const path = require('path');
const fs = require('fs');
const os = require('os');

function isNvmInstalled() {
  const nvmDir = process.env.NVM_DIR || path.join(os.homedir(), '.nvm');
  return fs.existsSync(path.join(nvmDir, 'nvm.sh'));
}
```

**Helper: `installNvm(context)`**

Another internal helper that installs nvm. Uses the official install script:

```javascript
async function installNvm(context) {
  // The official nvm install script. It clones the nvm repo (which is why git is a dependency)
  // and sets up the shell integration.
  await context.shell.exec(
    'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash'
  );
}
```

Note the pinned version (`v0.40.1`). Don't use `master` -- that's unpredictable. Check the nvm GitHub releases page for the latest stable version when implementing.

**Helper: `sourceNvm()`**

After installing nvm, you need to source it in the current process. Since we're running in Node.js (not bash), we can't literally `source` the script. Instead, we set the environment variables that nvm uses and prepend its bin directory to PATH:

```javascript
function getNvmDir() {
  return process.env.NVM_DIR || path.join(os.homedir(), '.nvm');
}

function buildNvmCommand(command) {
  // Wraps a command so nvm is available in the subshell
  const nvmDir = getNvmDir();
  return `export NVM_DIR="${nvmDir}" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" && ${command}`;
}
```

Use `buildNvmCommand()` to wrap any nvm commands before passing them to `context.shell.exec()`.

**`install_macos(context)`**

```javascript
async function install_macos(context) {
  if (!isNvmInstalled()) {
    context.output.info('Installing nvm...');
    await installNvm(context);
  }

  context.output.info('Installing Node.js LTS via nvm...');
  await context.shell.exec(buildNvmCommand('nvm install --lts'));
  await context.shell.exec(buildNvmCommand('nvm alias default lts/*'));
  context.output.success('Node.js LTS installed via nvm.');
}
```

**`install_ubuntu(context)` and `install_raspbian(context)`**

Same as macOS. nvm works identically on all Unix-like systems. You could have them both call a shared internal function:

```javascript
async function installViaUnixNvm(context) {
  // Ensure curl is available (needed to download the nvm install script)
  if (!context.shell.commandExists('curl')) {
    context.output.info('Installing curl...');
    await context.shell.exec('sudo apt-get update && sudo apt-get install -y curl');
  }

  if (!isNvmInstalled()) {
    context.output.info('Installing nvm...');
    await installNvm(context);
  }

  context.output.info('Installing Node.js LTS via nvm...');
  await context.shell.exec(buildNvmCommand('nvm install --lts'));
  await context.shell.exec(buildNvmCommand('nvm alias default lts/*'));
  context.output.success('Node.js LTS installed via nvm.');
}

async function install_ubuntu(context) {
  await installViaUnixNvm(context);
}

async function install_raspbian(context) {
  await installViaUnixNvm(context);
}
```

The extra `curl` check is for minimal Ubuntu/Raspbian installs that might not have curl preinstalled.

**`install_amazon_linux(context)`**

Amazon Linux also supports nvm, but some teams prefer the system package. Use nvm for consistency:

```javascript
async function install_amazon_linux(context) {
  // Ensure curl is available
  if (!context.shell.commandExists('curl')) {
    const hasDnf = context.shell.commandExists('dnf');
    if (hasDnf) {
      await context.shell.exec('sudo dnf install -y curl');
    } else {
      await context.shell.exec('sudo yum install -y curl');
    }
  }

  if (!isNvmInstalled()) {
    context.output.info('Installing nvm...');
    await installNvm(context);
  }

  context.output.info('Installing Node.js LTS via nvm...');
  await context.shell.exec(buildNvmCommand('nvm install --lts'));
  await context.shell.exec(buildNvmCommand('nvm alias default lts/*'));
  context.output.success('Node.js LTS installed via nvm.');
}
```

**`install_windows(context)`**

On Windows, skip nvm and install Node directly. nvm-windows is a completely different tool from Unix nvm and has its own quirks. A direct install is simpler and more reliable.

```javascript
async function install_windows(context) {
  const hasChoco = context.shell.commandExists('choco');
  const hasWinget = context.shell.commandExists('winget');

  if (hasChoco) {
    await context.shell.exec('choco install nodejs-lts -y');
  } else if (hasWinget) {
    await context.shell.exec(
      'winget install --id OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements'
    );
  } else {
    throw new Error(
      'Neither Chocolatey nor winget is available. Install one of them first, or download Node.js from https://nodejs.org'
    );
  }
}
```

**`install_gitbash(context)`**

Git Bash runs on Windows but doesn't have its own package manager. If Node is already installed on the Windows host, it's available in Git Bash too. If not, tell the user to install it through Windows.

```javascript
async function install_gitbash(context) {
  if (await isInstalled(context)) {
    context.output.info('Node.js is already available in Git Bash.');
    return;
  }

  throw new Error(
    'Node.js must be installed on the Windows host. Download from https://nodejs.org or run the installer from a Windows shell.'
  );
}
```

### Step 2: Verify the registry entry

Confirm that `registry.json` has the node entry from story 001:

```json
{
  "name": "node",
  "description": "JavaScript runtime (installed via nvm on Unix)",
  "platforms": ["macos", "ubuntu", "raspbian", "amazon-linux", "windows", "gitbash"],
  "dependencies": ["git"],
  "desktop": false,
  "installer": "node.js"
}
```

The `dependencies: ["git"]` is the key part. The framework will install git first if it's missing.

## Files to Create or Modify
- `src/installers/node.js` -- The Node.js installer (new file)
- `src/installers/registry.json` -- Verify node entry is correct (no changes expected)

## Acceptance Criteria
- [ ] `src/installers/node.js` exists and exports `isInstalled`, `install`, `getVersion`, and all six `install_<platform>` functions
- [ ] `isInstalled()` returns `true` on a system with Node.js
- [ ] `getVersion()` returns a version string like `'20.11.0'`
- [ ] `install_macos()` installs nvm first (if missing), then Node LTS via nvm
- [ ] `install_ubuntu()` and `install_raspbian()` install curl if missing, then nvm, then Node LTS
- [ ] `install_amazon_linux()` installs curl if missing, then nvm, then Node LTS
- [ ] `install_windows()` uses choco or winget to install Node LTS directly
- [ ] `install_gitbash()` checks the Windows host for Node and gives a clear message if not found
- [ ] The nvm install script version is pinned (not using `master` or `latest`)
- [ ] nvm commands are wrapped to source nvm in the subshell before running
- [ ] Running the installer when Node is already installed does nothing (idempotent)
- [ ] The framework resolves the git dependency before running this installer

## Testing

```bash
# Test isInstalled (Node should be available since you're running this via node)
node -e "
  const nd = require('./src/installers/node');
  const context = { shell: { commandExists: (cmd) => { try { require('child_process').execSync('which ' + cmd, { stdio: 'ignore' }); return true; } catch { return false; } } } };
  nd.isInstalled(context).then(r => console.log('installed:', r));
"
# Expected: installed: true

# Test getVersion
node -e "
  const nd = require('./src/installers/node');
  const context = { shell: { exec: async (cmd) => { const r = require('child_process').execSync(cmd).toString(); return { stdout: r }; } } };
  nd.getVersion(context).then(v => console.log('version:', v));
"
# Expected: version: 20.x.x (or whatever Node version you're on)

# Test dependency resolution through the framework
node -e "
  const installer = require('./src/lib/installer');
  console.log(installer.resolveDependencies('node'));
"
# Expected: [ 'git', 'node' ]

# Test module exports
node -e "
  const nd = require('./src/installers/node');
  console.log('exports:', Object.keys(nd));
"
# Expected: exports: [ 'isInstalled', 'install', 'getVersion', 'install_macos', ... ]
```

## Notes
- **nvm is a shell function, not a binary.** This is the biggest gotcha. You can't check for nvm with `which nvm`. You need to check for the `~/.nvm/nvm.sh` file. And you can't call `nvm install` directly from `context.shell.exec()` -- you need to source the nvm script in the same subshell first, which is what `buildNvmCommand()` does.
- **The nvm install script modifies shell profiles.** It appends sourcing lines to `~/.bashrc`, `~/.zshrc`, or `~/.profile`. This is expected behavior and means nvm will be available in new terminal sessions automatically.
- **Don't install nvm-windows.** It's a completely different tool maintained by a different team. It doesn't have feature parity with Unix nvm. A direct Node install via choco/winget is more reliable on Windows.
- **Pin the nvm version.** The install script URL includes a version tag. Using `master` instead of a tagged version means the install could break if the nvm team pushes a bad commit. Always pin to a specific release.
- **ARM support on Raspbian.** nvm handles ARM architecture automatically. It will download the correct Node binary for the Raspberry Pi's ARM CPU. No special handling needed.
- **This installer is a good test of the dependency chain.** When you run `dev tools install node`, the framework should install git first (if missing) and then call the node installer. Verify this flow works end to end.
