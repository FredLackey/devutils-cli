# Story 001: Machine Detect and Machine Show

## Goal

Implement `src/commands/machine/detect.js` and `src/commands/machine/show.js`. `detect` gathers information about the current machine — operating system, version, CPU architecture, available package managers, hostname, CPU count, and total memory — and writes it to `~/.devutils/machines/current.json`. `show` reads that file and displays it. These commands give DevUtils awareness of what machine it is running on, which is essential for platform-specific behavior in later stories (tool installation, utility scripts, identity management).

## Prerequisites

- 001-foundation/008 (CLI router — context object must be built and dispatching must work)
- 002-config/001 (config init — `~/.devutils/` directory and `machines/` subdirectory must exist)

## Background

DevUtils supports multiple platforms: macOS, Ubuntu, Raspberry Pi OS, Amazon Linux, Windows, and Git Bash. Different platforms have different package managers, different paths, and different capabilities. The `lib/platform.js` module handles detecting which platform the CLI is running on. The `machine detect` command uses that module and adds more detail: not just "what OS" but also hostname, CPU count, memory, what package managers are actually available, and the specific OS version.

The machine profile is stored at `~/.devutils/machines/current.json`. This path is documented in `research/proposed/proposed-package-structure.md` (the "User Data Directory" section). The file represents the machine DevUtils is currently running on. In a future story (when backup/sync is built), multiple machine profiles from different computers will be visible through `dev machine list`.

For command syntax, see `research/proposed/proposed-command-syntax.md` lines 273-281.

## Technique

### machine/detect.js

#### Step 1: Fill in the meta object

```javascript
const meta = {
  description: 'Detect the current machine\'s OS, architecture, package managers, and capabilities.',
  arguments: [],
  flags: []
};
```

No flags needed. This command always detects the current machine.

#### Step 2: Use lib/platform.js for OS detection

The CLI router passes the platform module itself as `context.platform`. Call `context.platform.detect()` to get the detection result — an object with `{ type, arch, packageManager }`. Use this as the foundation, then layer on additional data from Node.js built-in modules.

```javascript
const os = require('os');
const fs = require('fs');
const path = require('path');
```

```javascript
async function run(args, context) {
  const platform = context.platform.detect();
```

#### Step 3: Gather machine details

Use Node.js `os` module for hardware and system info. Use `context.shell` to check for available package managers.

```javascript
  const hostname = os.hostname();
  const cpuCount = os.cpus().length;
  const totalMemory = os.totalmem();
  const arch = os.arch();           // 'x64', 'arm64', etc.
  const osType = os.type();         // 'Darwin', 'Linux', 'Windows_NT'
  const osRelease = os.release();   // Kernel version string
```

#### Step 4: Detect available package managers

Check which package managers are actually installed on this machine. Use `context.shell.commandExists()` to test each one. Only test the ones relevant to the detected platform, but also check for universal ones.

```javascript
  const packageManagers = [];
  const candidates = ['brew', 'apt', 'snap', 'dnf', 'yum', 'choco', 'winget', 'npm', 'yarn', 'pnpm'];

  for (const pm of candidates) {
    if (await context.shell.commandExists(pm)) {
      packageManagers.push(pm);
    }
  }
```

#### Step 5: Get OS-specific version info

On macOS, run `sw_vers -productVersion` to get something like "14.2.1". On Linux, read `/etc/os-release` for the distribution name and version. On Windows, use the os release string. Wrap these in try/catch blocks — if a command fails, just leave the version as the generic `os.release()` value.

```javascript
  let osVersion = osRelease;
  let osName = platform.type;

  try {
    if (platform.type === 'macos') {
      const result = await context.shell.exec('sw_vers -productVersion');
      osVersion = result.stdout.trim();
      osName = 'macOS';
    } else if (['ubuntu', 'raspbian', 'amazon-linux'].includes(platform.type)) {
      const releaseFile = fs.readFileSync('/etc/os-release', 'utf8');
      const nameMatch = releaseFile.match(/^PRETTY_NAME="?(.+?)"?$/m);
      if (nameMatch) {
        osName = nameMatch[1];
      }
      const versionMatch = releaseFile.match(/^VERSION_ID="?(.+?)"?$/m);
      if (versionMatch) {
        osVersion = versionMatch[1];
      }
    }
  } catch (err) {
    // Keep defaults if detection fails
  }
```

#### Step 6: Build the machine profile object

```javascript
  const machineProfile = {
    hostname: hostname,
    os: {
      type: platform.type,
      name: osName,
      version: osVersion,
      kernel: osRelease
    },
    arch: arch,
    cpu: {
      count: cpuCount,
      model: os.cpus()[0] ? os.cpus()[0].model : 'unknown'
    },
    memory: {
      total: totalMemory,
      totalHuman: formatBytes(totalMemory)
    },
    packageManagers: packageManagers,
    detectedAt: new Date().toISOString()
  };
```

You will need a small helper function to format bytes into a human-readable string:

```javascript
function formatBytes(bytes) {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  let value = bytes;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${value.toFixed(1)} ${units[i]}`;
}
```

Define this function at the top of the file, outside of `run()`.

#### Step 7: Write the profile to disk

```javascript
  const MACHINES_DIR = path.join(os.homedir(), '.devutils', 'machines');
  const CURRENT_FILE = path.join(MACHINES_DIR, 'current.json');

  // Ensure the directory exists (idempotent)
  fs.mkdirSync(MACHINES_DIR, { recursive: true });

  fs.writeFileSync(CURRENT_FILE, JSON.stringify(machineProfile, null, 2) + '\n');
```

#### Step 8: Output the result

```javascript
  context.output.print(machineProfile);
}
```

### machine/show.js

#### Step 1: Fill in the meta object

```javascript
const meta = {
  description: 'Display the current machine profile.',
  arguments: [],
  flags: []
};
```

#### Step 2: Read and display the machine profile

This is simple — read the file and output it. If the file does not exist, tell the user to run `dev machine detect` first.

```javascript
const fs = require('fs');
const path = require('path');
const os = require('os');

async function run(args, context) {
  const CURRENT_FILE = path.join(os.homedir(), '.devutils', 'machines', 'current.json');

  if (!fs.existsSync(CURRENT_FILE)) {
    return context.errors.exit('No machine profile found. Run "dev machine detect" first.', { code: 1 });
  }

  const raw = fs.readFileSync(CURRENT_FILE, 'utf8');
  const profile = JSON.parse(raw);

  context.output.print(profile);
}
```

That is it for show. The output module handles all the formatting.

## Files to Create or Modify

- `src/commands/machine/detect.js` — Replace the stub with the full implementation
- `src/commands/machine/show.js` — Replace the stub with the full implementation

## Acceptance Criteria

- [ ] `dev machine detect` creates `~/.devutils/machines/current.json` with the correct machine info
- [ ] The profile contains: hostname, os (type, name, version, kernel), arch, cpu (count, model), memory (total, totalHuman), packageManagers (array), detectedAt (ISO timestamp)
- [ ] Running `dev machine detect` a second time overwrites `current.json` with fresh data (idempotent)
- [ ] On macOS, `os.name` is "macOS" and `os.version` is the product version (e.g., "14.2.1")
- [ ] On Linux, `os.name` is the pretty name from `/etc/os-release` (e.g., "Ubuntu 22.04.3 LTS")
- [ ] `packageManagers` only lists package managers that are actually installed on this machine
- [ ] `dev machine show` reads `current.json` and prints it as formatted output
- [ ] `dev machine show` on a machine with no `current.json` prints an error telling the user to run `dev machine detect`
- [ ] `dev machine detect` creates the `machines/` directory if it does not exist yet
- [ ] Both commands respect the `--format` global flag

## Testing

```bash
# Run detection
dev machine detect
# Expected: JSON output with hostname, os, arch, cpu, memory, packageManagers, detectedAt

# Verify the file was created
cat ~/.devutils/machines/current.json
# Expected: Same JSON as the command output

# Show the profile
dev machine show
# Expected: Same output as detect (reads from the file)

dev machine show --format json
# Expected: JSON formatted output

# Test idempotency - run detect again
dev machine detect
# Expected: File is overwritten with fresh data. detectedAt timestamp is updated.

# Test show without detect
rm ~/.devutils/machines/current.json
dev machine show
# Expected: Error — "No machine profile found. Run dev machine detect first."

# Verify package manager detection
dev machine detect --format json | grep packageManagers
# Expected: Array containing at least one package manager (e.g., ["brew", "npm"])
```

## Notes

- The `formatBytes` helper should round to one decimal place. "16.0 GB" is clearer than "17179869184" for most people.
- Do not try to detect every possible detail about the machine. Stick to the fields listed above. More can be added later, but the initial profile should be small and useful.
- The `detectedAt` timestamp is important for knowing how stale the profile is. If a user upgrades their OS, they should re-run `dev machine detect` to update it. The timestamp makes it obvious when the last detection happened.
- `os.cpus()[0].model` can occasionally be empty or weird on some Linux systems. Default to `'unknown'` if the array is empty.
- The `context.shell.commandExists()` calls are async because they may need to shell out to `which` or `where` depending on the platform. Make sure to `await` them.
- On Windows/Git Bash, the OS version detection (the `sw_vers` and `/etc/os-release` approaches) will not work. That is fine — the `catch` block handles it, and the generic `os.release()` value is used instead. Windows-specific version detection can be added in a future story if needed.
- The `machines/` directory creation with `{ recursive: true }` makes this safe to run even if `dev config init` has not been run yet. But in practice, the CLI router should check for initialization before dispatching most commands.
