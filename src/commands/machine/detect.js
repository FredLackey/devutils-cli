'use strict';

const os = require('os');
const fs = require('fs');
const path = require('path');

/**
 * Formats a byte count into a human-readable string (e.g., "16.0 GB").
 * Rounds to one decimal place for clarity.
 *
 * @param {number} bytes - The number of bytes to format.
 * @returns {string} A human-readable size string like "16.0 GB".
 */
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

const meta = {
  description: 'Detect the current machine\'s OS, architecture, package managers, and capabilities.',
  arguments: [],
  flags: []
};

/**
 * Detects the current machine's hardware and OS details, then writes
 * the profile to ~/.devutils/machines/current.json.
 *
 * Uses context.platform.detect() for OS type, then layers on hostname,
 * CPU count, memory, available package managers, and OS version info
 * from Node.js built-in modules and shell commands.
 *
 * @param {object} args - Parsed command arguments (none expected).
 * @param {object} context - The CLI context object with platform, shell, output, errors.
 */
async function run(args, context) {
  // Step 1: Get base platform detection
  const platform = context.platform.detect();

  // Step 2: Gather hardware and system info from Node.js os module
  const hostname = os.hostname();
  const cpuCount = os.cpus().length;
  const totalMemory = os.totalmem();
  const arch = os.arch();
  const osRelease = os.release();

  // Step 3: Detect which package managers are installed on this machine
  const packageManagers = [];
  const candidates = ['brew', 'apt', 'snap', 'dnf', 'yum', 'choco', 'winget', 'npm', 'yarn', 'pnpm'];

  for (const pm of candidates) {
    if (context.shell.commandExists(pm)) {
      packageManagers.push(pm);
    }
  }

  // Step 4: Get OS-specific version and name info
  let osVersion = osRelease;
  let osName = platform.type;

  try {
    if (platform.type === 'macos') {
      const result = await context.shell.exec('sw_vers -productVersion');
      if (result.exitCode === 0 && result.stdout) {
        osVersion = result.stdout.trim();
      }
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

  // Step 5: Build the machine profile object
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

  // Step 6: Write the profile to disk (idempotent — overwrites if exists)
  const MACHINES_DIR = path.join(os.homedir(), '.devutils', 'machines');
  const CURRENT_FILE = path.join(MACHINES_DIR, 'current.json');

  fs.mkdirSync(MACHINES_DIR, { recursive: true });
  fs.writeFileSync(CURRENT_FILE, JSON.stringify(machineProfile, null, 2) + '\n');

  // Step 7: Output the result
  context.output.out(machineProfile);
}

module.exports = { meta, run };
