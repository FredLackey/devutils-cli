# Story 001: Platform Detection

## Goal
Build the OS and architecture detection layer that everything else in DevUtils sits on top of. When any command, installer, or utility needs to know "what machine am I running on?", it calls `platform.detect()` and gets back a clean object with the OS type, CPU architecture, and the right package manager. Without this, nothing platform-specific can work.

## Prerequisites
- None. This is the first foundation story.

## Background
DevUtils supports six platforms: macOS, Ubuntu, Raspberry Pi OS (Raspbian), Amazon Linux, Windows, and Git Bash (on Windows). Each platform has different package managers and different ways to detect whether an app is installed.

The legacy code in `_rebuild/src/utils/common/os.js` has a working `detect()` function that reads `process.platform`, checks `/etc/os-release` on Linux, and returns `{ type, packageManager, distro }`. The new version keeps the same idea but adds `arch` (CPU architecture) and moves platform-specific helpers into separate files under `src/lib/platforms/`.

The main `platform.js` module is the public API. It calls into the platform-specific files (like `platforms/macos.js`) for anything that varies by OS. Other modules should never import a platform file directly -- they always go through `platform.js`.

Reference: `research/proposed/proposed-package-structure.md` lines 362-420.

## Technique

### Step 1: Build the six platform helper files

Each file in `src/lib/platforms/` exports a set of helper functions specific to that platform. Start with these exports in every platform file:

- `name` - a string constant: `'macos'`, `'ubuntu'`, `'raspbian'`, `'amazon-linux'`, `'windows'`, or `'gitbash'`
- `packageManager` - the default package manager string: `'brew'`, `'apt'`, `'dnf'`, `'choco'`, etc.
- `isInstalled(binary)` - checks if a given binary is available on this platform (use `child_process.execSync` with `which` on unix, `where` on windows, wrapped in try/catch)
- `getAppPaths()` - returns an array of common application directories for this platform (e.g., `/Applications` on macOS, `C:\\Program Files` on Windows)

Keep each file short. The goal right now is to establish the pattern and the interface. Later stories will add more helpers to these files as needed.

Here are the platform-specific details:

**macos.js**: Package manager is `'brew'`. Use `which` for binary detection. App paths: `['/Applications', '/usr/local/bin', path.join(os.homedir(), 'Applications')]`.

**ubuntu.js**: Package manager is `'apt'`. Use `which` for binary detection. App paths: `['/usr/bin', '/usr/local/bin', '/snap/bin']`. Note that Snap is also available but `apt` is the primary manager.

**raspbian.js**: Same as ubuntu for now. Package manager is `'apt'`. Same binary detection. Same app paths. Raspbian is Debian-based, so most things work the same as Ubuntu. Having it as a separate file lets us add ARM-specific behavior later.

**amazon-linux.js**: Package manager is `'dnf'` (falls back to `'yum'` on older versions, but default to `'dnf'`). Use `which` for binary detection. App paths: `['/usr/bin', '/usr/local/bin']`.

**windows.js**: Package manager is `'choco'` (Chocolatey). Use `where` instead of `which` for binary detection. App paths: `[process.env.ProgramFiles, process.env['ProgramFiles(x86)'], process.env.LOCALAPPDATA].filter(Boolean)`. The `filter(Boolean)` removes undefined entries in case those env vars aren't set.

**gitbash.js**: Package manager is `'manual'` (Git Bash doesn't have its own package manager). Use `which` for binary detection (Git Bash provides a `which` command). App paths: same as windows -- it's running on top of Windows.

### Step 2: Build `src/lib/platform.js`

This is the main module. It exports:

- `detect()` - determines the current platform and returns `{ type, arch, packageManager }`
- `getHelper()` - returns the full platform helper module for the detected platform

Here's the detection logic:

1. Read `process.platform` to get the OS family (`'darwin'`, `'win32'`, `'linux'`).
2. Read `process.arch` to get the CPU architecture (`'x64'`, `'arm64'`, etc.).
3. For `'darwin'`: type is `'macos'`, package manager is `'brew'`.
4. For `'win32'`: check if the `MSYSTEM` environment variable is set (Git Bash sets this to `'MINGW64'` or similar). If yes, type is `'gitbash'` and package manager is `'manual'`. If no, type is `'windows'` and package manager is `'choco'`.
5. For `'linux'`: read `/etc/os-release` to figure out the distro. Parse the `ID=` line. Map it to the right type:
   - `'ubuntu'` -> type `'ubuntu'`, package manager `'apt'`
   - `'raspbian'` -> type `'raspbian'`, package manager `'apt'`
   - `'amzn'` -> type `'amazon-linux'`, package manager `'dnf'` (check if `/usr/bin/dnf` exists, otherwise fall back to `'yum'`)
   - Anything else -> type `'linux'`, package manager `null` (unsupported but don't crash)
6. Return `{ type, arch, packageManager }`.

The `getHelper()` function uses the detected type to require the right file from `platforms/`. Use a lookup object:

```javascript
const helpers = {
  'macos': () => require('./platforms/macos'),
  'ubuntu': () => require('./platforms/ubuntu'),
  'raspbian': () => require('./platforms/raspbian'),
  'amazon-linux': () => require('./platforms/amazon-linux'),
  'windows': () => require('./platforms/windows'),
  'gitbash': () => require('./platforms/gitbash'),
};
```

Use lazy loading (the `() => require()` pattern) so we only load the platform file we actually need.

Cache the detection result. `detect()` should only run the detection logic once. On the second call, return the cached result. The OS doesn't change while the process is running.

### Step 3: Code style

- CommonJS modules (`require` / `module.exports`)
- 2-space indentation, LF line endings
- JSDoc comments on every exported function
- Use `'use strict';` at the top of every file
- No external dependencies -- only Node.js built-ins (`os`, `fs`, `path`, `child_process`)

## Files to Create or Modify
- `src/lib/platform.js` - Main detection module with `detect()` and `getHelper()`
- `src/lib/platforms/macos.js` - macOS-specific helpers
- `src/lib/platforms/ubuntu.js` - Ubuntu-specific helpers
- `src/lib/platforms/raspbian.js` - Raspbian-specific helpers
- `src/lib/platforms/amazon-linux.js` - Amazon Linux-specific helpers
- `src/lib/platforms/windows.js` - Windows-specific helpers
- `src/lib/platforms/gitbash.js` - Git Bash-specific helpers

## Acceptance Criteria
- [ ] `require('./src/lib/platform').detect()` returns `{ type, arch, packageManager }` on macOS
- [ ] `type` is one of `'macos'`, `'ubuntu'`, `'raspbian'`, `'amazon-linux'`, `'windows'`, `'gitbash'`
- [ ] `arch` is a string like `'x64'` or `'arm64'`
- [ ] `packageManager` is the correct value for the detected platform
- [ ] `getHelper()` returns the platform-specific helper module
- [ ] Each platform helper exports `name`, `packageManager`, `isInstalled(binary)`, and `getAppPaths()`
- [ ] Calling `detect()` multiple times returns the same cached result
- [ ] Unknown Linux distros return `{ type: 'linux', arch: '...', packageManager: null }` instead of crashing
- [ ] No external dependencies are added to package.json

## Testing

Run from the project root on macOS:

```bash
node -e "const p = require('./src/lib/platform'); console.log(p.detect())"
# Expected: { type: 'macos', arch: 'arm64', packageManager: 'brew' }
# (arch will be 'x64' on Intel Macs)

node -e "const p = require('./src/lib/platform'); const h = p.getHelper(); console.log(h.name, h.packageManager)"
# Expected: macos brew

node -e "const p = require('./src/lib/platform'); const h = p.getHelper(); console.log(h.isInstalled('node'))"
# Expected: true (assuming node is installed)

node -e "const p = require('./src/lib/platform'); const h = p.getHelper(); console.log(h.isInstalled('nonexistent-binary-xyz'))"
# Expected: false

node -e "const p = require('./src/lib/platform'); const h = p.getHelper(); console.log(h.getAppPaths())"
# Expected: ['/Applications', '/usr/local/bin', '/Users/<you>/Applications']
```

Verify caching works:

```bash
node -e "const p = require('./src/lib/platform'); const a = p.detect(); const b = p.detect(); console.log(a === b)"
# Expected: true (same object reference)
```

## Notes
- The legacy code uses `'amazon_linux'` (underscore). The new code uses `'amazon-linux'` (hyphen) to match the filename `amazon-linux.js`. Be consistent -- use hyphens everywhere in the new code.
- Git Bash detection relies on the `MSYSTEM` environment variable. If someone runs Node.js natively on Windows (not through Git Bash), `MSYSTEM` won't be set, and they'll correctly get `'windows'` as the type.
- Don't try to detect every Linux distro. We support four: Ubuntu, Raspbian, Amazon Linux, and "generic Linux" as a fallback. If someone is on Fedora or Arch, they get `type: 'linux'` and `packageManager: null`. That's fine for now.
- The `isInstalled` helper in each platform file is a quick sync check. It's meant for simple "is this binary on the PATH?" questions. More complex detection (like checking if a GUI app is installed via its `.app` bundle on macOS) will be added in later stories.
