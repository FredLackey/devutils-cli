#!/usr/bin/env node

/**
 * docker-clean - Remove all Docker containers, images, and volumes
 *
 * Migrated from legacy dotfiles alias.
 * Original:
 *   docker-clean(){
 *     echo "This will remove ALL Docker containers, images, and volumes."
 *     echo "This action cannot be undone!"
 *     echo ""
 *     read -p "Are you sure you want to continue? (y/N): " -n 1 -r
 *     echo ""
 *
 *     if [[ ! $REPLY =~ ^[Yy]$ ]]; then
 *       echo "Operation cancelled."
 *       return 0
 *     fi
 *
 *     echo "Proceeding with Docker cleanup..."
 *
 *     # Delete all containers
 *     if docker ps -a -q >/dev/null 2>&1; then
 *       echo "Removing all containers..."
 *       docker rm -f $(docker ps -a -q)
 *     else
 *       echo "No containers to remove."
 *     fi
 *
 *     # Delete all images
 *     if docker images -q >/dev/null 2>&1; then
 *       echo "Removing all images..."
 *       docker images -q | xargs docker rmi -f
 *     else
 *       echo "No images to remove."
 *     fi
 *
 *     # Delete volumes
 *     if docker volume ls -q >/dev/null 2>&1; then
 *       echo "Removing all volumes..."
 *       docker volume rm $(docker volume ls -q)
 *     else
 *       echo "No volumes to remove."
 *     fi
 *
 *     echo "Docker cleanup completed."
 *   }
 *
 * This script removes ALL Docker containers, images, and volumes after
 * prompting for confirmation (unless --force is passed). This action cannot be undone.
 *
 * Usage:
 *   docker-clean            # Interactive mode - prompts for confirmation
 *   docker-clean --force    # Skip confirmation prompt
 *   docker-clean -f         # Skip confirmation prompt (short form)
 *
 * @module scripts/docker-clean
 */

const os = require('../utils/common/os');
const { execSync, spawnSync } = require('child_process');
const readline = require('readline');

/**
 * Helper function to check if a command exists on the system.
 * Used to verify Docker is installed before attempting cleanup.
 *
 * @param {string} cmd - The command name to check
 * @returns {boolean} True if the command exists, false otherwise
 */
function isCommandAvailable(cmd) {
  try {
    // Use 'which' on Unix-like systems, 'where' on Windows
    const checkCmd = process.platform === 'win32' ? `where ${cmd}` : `which ${cmd}`;
    execSync(checkCmd, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Helper function to prompt the user for confirmation.
 * Returns a promise that resolves to true if user confirms, false otherwise.
 *
 * @param {string} message - The question to ask the user
 * @returns {Promise<boolean>} True if user confirms (y/Y), false otherwise
 */
function askConfirmation(message) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question(message, (answer) => {
      rl.close();
      // Accept 'y' or 'Y' as confirmation, anything else is decline
      resolve(answer.toLowerCase() === 'y');
    });
  });
}

/**
 * Helper function to run a Docker command and return its output.
 * Uses spawnSync for better handling of command output and errors.
 *
 * @param {string[]} args - Array of arguments to pass to docker
 * @returns {{ success: boolean, output: string }} Result object with success status and output
 */
function runDockerCommand(args) {
  const result = spawnSync('docker', args, {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe']
  });

  return {
    success: result.status === 0,
    output: (result.stdout || '').trim(),
    error: (result.stderr || '').trim()
  };
}

/**
 * Pure Node.js implementation for Docker cleanup.
 *
 * Docker is a cross-platform tool that works identically on all operating systems.
 * The Docker CLI commands (docker ps, docker rm, docker rmi, docker volume) are
 * the same regardless of the underlying platform. Therefore, we use a single
 * Node.js implementation that works everywhere Docker is installed.
 *
 * This function:
 * 1. Checks if Docker is installed
 * 2. Prompts for confirmation (unless --force is passed)
 * 3. Removes all containers (stopped and running)
 * 4. Removes all images
 * 5. Removes all volumes
 *
 * @param {string[]} args - Command line arguments
 * @param {string} [args.0] - Pass "--force" or "-f" to skip confirmation
 * @returns {Promise<void>}
 */
async function do_docker_clean_nodejs(args) {
  // Check if Docker is installed
  if (!isCommandAvailable('docker')) {
    console.error('Error: Docker is not installed or not in PATH.');
    console.error('');
    console.error('Install Docker:');
    console.error('  macOS:   brew install --cask docker');
    console.error('  Ubuntu:  sudo apt install docker.io');
    console.error('  Windows: winget install Docker.DockerDesktop');
    process.exit(1);
  }

  // Check if Docker daemon is running
  const dockerInfo = runDockerCommand(['info']);
  if (!dockerInfo.success) {
    console.error('Error: Docker daemon is not running.');
    console.error('');
    console.error('Please start Docker:');
    console.error('  macOS:   Open Docker Desktop application');
    console.error('  Linux:   sudo systemctl start docker');
    console.error('  Windows: Start Docker Desktop from Start menu');
    process.exit(1);
  }

  // Check for --force or -f flag to skip confirmation
  const forceMode = args.includes('--force') || args.includes('-f');

  // Display warning and ask for confirmation (unless force mode)
  console.log('This will remove ALL Docker containers, images, and volumes.');
  console.log('This action cannot be undone!');
  console.log('');

  if (!forceMode) {
    const confirmed = await askConfirmation('Are you sure you want to continue? (y/N): ');
    console.log('');

    if (!confirmed) {
      console.log('Operation cancelled.');
      return;
    }
  } else {
    console.log('Running in force mode - skipping confirmation.');
    console.log('');
  }

  console.log('Proceeding with Docker cleanup...');
  console.log('');

  // --- Step 1: Remove all containers ---
  const containers = runDockerCommand(['ps', '-a', '-q']);

  if (containers.success && containers.output) {
    // There are containers to remove
    const containerIds = containers.output.split('\n').filter(id => id.length > 0);
    console.log(`Removing ${containerIds.length} container(s)...`);

    // Remove containers one by one to show progress and handle errors gracefully
    for (const containerId of containerIds) {
      const removeResult = runDockerCommand(['rm', '-f', containerId]);
      if (removeResult.success) {
        console.log(`  Removed container: ${containerId.substring(0, 12)}`);
      } else {
        console.log(`  Warning: Could not remove container ${containerId.substring(0, 12)}: ${removeResult.error}`);
      }
    }
    console.log('');
  } else {
    console.log('No containers to remove.');
    console.log('');
  }

  // --- Step 2: Remove all images ---
  const images = runDockerCommand(['images', '-q']);

  if (images.success && images.output) {
    // There are images to remove
    // Note: images -q may return duplicate IDs, so we deduplicate
    const imageIds = [...new Set(images.output.split('\n').filter(id => id.length > 0))];
    console.log(`Removing ${imageIds.length} image(s)...`);

    // Remove images one by one
    for (const imageId of imageIds) {
      const removeResult = runDockerCommand(['rmi', '-f', imageId]);
      if (removeResult.success) {
        console.log(`  Removed image: ${imageId.substring(0, 12)}`);
      } else {
        // Images may fail to remove if they're parent images; this is expected
        console.log(`  Warning: Could not remove image ${imageId.substring(0, 12)}: ${removeResult.error}`);
      }
    }
    console.log('');
  } else {
    console.log('No images to remove.');
    console.log('');
  }

  // --- Step 3: Remove all volumes ---
  const volumes = runDockerCommand(['volume', 'ls', '-q']);

  if (volumes.success && volumes.output) {
    // There are volumes to remove
    const volumeNames = volumes.output.split('\n').filter(name => name.length > 0);
    console.log(`Removing ${volumeNames.length} volume(s)...`);

    // Remove volumes one by one
    for (const volumeName of volumeNames) {
      const removeResult = runDockerCommand(['volume', 'rm', volumeName]);
      if (removeResult.success) {
        console.log(`  Removed volume: ${volumeName}`);
      } else {
        console.log(`  Warning: Could not remove volume ${volumeName}: ${removeResult.error}`);
      }
    }
    console.log('');
  } else {
    console.log('No volumes to remove.');
    console.log('');
  }

  console.log('Docker cleanup completed.');
}

/**
 * Remove all Docker containers, images, and volumes on macOS.
 *
 * Docker works identically on macOS as on other platforms, so this function
 * delegates to the pure Node.js implementation.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_docker_clean_macos(args) {
  return do_docker_clean_nodejs(args);
}

/**
 * Remove all Docker containers, images, and volumes on Ubuntu.
 *
 * Docker works identically on Ubuntu as on other platforms, so this function
 * delegates to the pure Node.js implementation.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_docker_clean_ubuntu(args) {
  return do_docker_clean_nodejs(args);
}

/**
 * Remove all Docker containers, images, and volumes on Raspberry Pi OS.
 *
 * Docker works identically on Raspberry Pi OS as on other platforms, so this
 * function delegates to the pure Node.js implementation.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_docker_clean_raspbian(args) {
  return do_docker_clean_nodejs(args);
}

/**
 * Remove all Docker containers, images, and volumes on Amazon Linux.
 *
 * Docker works identically on Amazon Linux as on other platforms, so this
 * function delegates to the pure Node.js implementation.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_docker_clean_amazon_linux(args) {
  return do_docker_clean_nodejs(args);
}

/**
 * Remove all Docker containers, images, and volumes on Windows Command Prompt.
 *
 * Docker works identically on Windows as on other platforms, so this function
 * delegates to the pure Node.js implementation.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_docker_clean_cmd(args) {
  return do_docker_clean_nodejs(args);
}

/**
 * Remove all Docker containers, images, and volumes on Windows PowerShell.
 *
 * Docker works identically on Windows as on other platforms, so this function
 * delegates to the pure Node.js implementation.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_docker_clean_powershell(args) {
  return do_docker_clean_nodejs(args);
}

/**
 * Remove all Docker containers, images, and volumes on Git Bash.
 *
 * Docker works identically in Git Bash as on other platforms, so this function
 * delegates to the pure Node.js implementation.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_docker_clean_gitbash(args) {
  return do_docker_clean_nodejs(args);
}

/**
 * Main entry point - detects environment and executes appropriate implementation.
 *
 * The "docker-clean" command removes ALL Docker containers, images, and volumes
 * from the system. This is useful for:
 * - Freeing up disk space consumed by Docker
 * - Starting fresh with a clean Docker environment
 * - Debugging issues by removing all cached layers and containers
 *
 * WARNING: This operation cannot be undone. All data stored in Docker volumes
 * will be permanently deleted.
 *
 * Usage:
 *   docker-clean            # Interactive mode with confirmation prompt
 *   docker-clean --force    # Skip confirmation (use with caution!)
 *   docker-clean -f         # Same as --force
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_docker_clean(args) {
  const platform = os.detect();

  const handlers = {
    'macos': do_docker_clean_macos,
    'ubuntu': do_docker_clean_ubuntu,
    'debian': do_docker_clean_ubuntu,
    'raspbian': do_docker_clean_raspbian,
    'amazon_linux': do_docker_clean_amazon_linux,
    'rhel': do_docker_clean_amazon_linux,
    'fedora': do_docker_clean_ubuntu,
    'linux': do_docker_clean_ubuntu,
    'wsl': do_docker_clean_ubuntu,
    'cmd': do_docker_clean_cmd,
    'windows': do_docker_clean_cmd,
    'powershell': do_docker_clean_powershell,
    'gitbash': do_docker_clean_gitbash
  };

  const handler = handlers[platform.type];
  if (!handler) {
    console.error(`Platform '${platform.type}' is not supported for this command.`);
    console.error('');
    console.error('Supported platforms:');
    console.error('  - macOS');
    console.error('  - Ubuntu, Debian, and other Linux distributions');
    console.error('  - Raspberry Pi OS');
    console.error('  - Amazon Linux, RHEL, Fedora');
    console.error('  - Windows (CMD, PowerShell, Git Bash)');
    process.exit(1);
  }

  await handler(args);
}

module.exports = {
  main: do_docker_clean,
  do_docker_clean,
  do_docker_clean_nodejs,
  do_docker_clean_macos,
  do_docker_clean_ubuntu,
  do_docker_clean_raspbian,
  do_docker_clean_amazon_linux,
  do_docker_clean_cmd,
  do_docker_clean_powershell,
  do_docker_clean_gitbash
};

if (require.main === module) {
  do_docker_clean(process.argv.slice(2));
}
