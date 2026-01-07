#!/usr/bin/env node

/**
 * dp - Display running Docker containers in formatted table
 *
 * Migrated from legacy dotfiles alias.
 * Original:
 *   dp() {
 *       if ! command -v docker &> /dev/null; then
 *           echo "Docker is not currently installed."
 *           return 1
 *       fi
 *       docker ps --format '{{.ID}}\t{{.Names}}\t{{.Ports}}'
 *   }
 *
 * Also found as alias:
 *   alias dp="docker ps --format '{{.ID}}\t{{.Names}}\t{{.Ports}}'"
 *
 * This script displays running Docker containers in a clean, formatted table
 * showing the container ID, name, and port mappings. It's a quick way to see
 * what containers are currently running without the extra columns of `docker ps`.
 *
 * @module scripts/dp
 */

const os = require('../utils/common/os');
const { execSync, spawnSync } = require('child_process');

/**
 * Helper function to check if a command exists on the system.
 * Used to detect if Docker is installed before attempting to use it.
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
 * Pure Node.js implementation - NOT APPLICABLE for this script.
 *
 * Docker commands require the Docker CLI, which is a system-level tool.
 * There is no pure Node.js way to query Docker containers without shelling
 * out to the Docker CLI or using a Docker SDK library.
 *
 * While Docker does have a REST API that could theoretically be called
 * via Node.js fetch(), it requires knowing the Docker socket location
 * and handling Unix socket connections, which varies by platform.
 * Using the Docker CLI is the most reliable and consistent approach.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 * @throws {Error} Always throws - this function should not be called directly
 */
async function do_dp_nodejs(args) {
  // Docker CLI interaction cannot be done in pure Node.js.
  // The Docker CLI is the standard interface for container management.
  throw new Error(
    'do_dp_nodejs should not be called directly. ' +
    'Docker CLI commands require system-level execution.'
  );
}

/**
 * Display running Docker containers on macOS.
 *
 * macOS uses Docker Desktop or Docker installed via Homebrew.
 * The docker CLI command works the same as on Linux.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_dp_macos(args) {
  // Check if Docker is installed
  if (!isCommandAvailable('docker')) {
    console.error('Docker is not currently installed.');
    console.error('');
    console.error('Install Docker Desktop for macOS:');
    console.error('  brew install --cask docker');
    console.error('');
    console.error('Or download from: https://www.docker.com/products/docker-desktop');
    process.exit(1);
  }

  try {
    // Execute docker ps with custom format showing ID, Name, and Ports
    // Using spawnSync for better handling of the output format
    const result = spawnSync('docker', ['ps', '--format', '{{.ID}}\t{{.Names}}\t{{.Ports}}'], {
      stdio: 'inherit',
      encoding: 'utf8'
    });

    if (result.status !== 0) {
      // If Docker daemon is not running, provide helpful message
      console.error('');
      console.error('Error: Could not connect to Docker daemon.');
      console.error('Make sure Docker Desktop is running.');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error executing docker command:', error.message);
    process.exit(1);
  }
}

/**
 * Display running Docker containers on Ubuntu.
 *
 * Ubuntu can have Docker installed via apt, snap, or Docker's official repo.
 * The docker CLI command works the same across all installation methods.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_dp_ubuntu(args) {
  // Check if Docker is installed
  if (!isCommandAvailable('docker')) {
    console.error('Docker is not currently installed.');
    console.error('');
    console.error('Install Docker on Ubuntu:');
    console.error('  sudo apt update');
    console.error('  sudo apt install docker.io');
    console.error('');
    console.error('Or use the official Docker repository:');
    console.error('  https://docs.docker.com/engine/install/ubuntu/');
    process.exit(1);
  }

  try {
    // Execute docker ps with custom format showing ID, Name, and Ports
    const result = spawnSync('docker', ['ps', '--format', '{{.ID}}\t{{.Names}}\t{{.Ports}}'], {
      stdio: 'inherit',
      encoding: 'utf8'
    });

    if (result.status !== 0) {
      // If Docker daemon is not running or user lacks permissions
      console.error('');
      console.error('Error: Could not connect to Docker daemon.');
      console.error('');
      console.error('Make sure Docker is running:');
      console.error('  sudo systemctl start docker');
      console.error('');
      console.error('To run docker without sudo, add your user to the docker group:');
      console.error('  sudo usermod -aG docker $USER');
      console.error('  (Log out and back in for this to take effect)');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error executing docker command:', error.message);
    process.exit(1);
  }
}

/**
 * Display running Docker containers on Raspberry Pi OS.
 *
 * Raspberry Pi OS is Debian-based, so Docker installation and usage
 * is similar to Ubuntu/Debian.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_dp_raspbian(args) {
  // Check if Docker is installed
  if (!isCommandAvailable('docker')) {
    console.error('Docker is not currently installed.');
    console.error('');
    console.error('Install Docker on Raspberry Pi OS:');
    console.error('  curl -fsSL https://get.docker.com -o get-docker.sh');
    console.error('  sudo sh get-docker.sh');
    console.error('  sudo usermod -aG docker $USER');
    process.exit(1);
  }

  try {
    // Execute docker ps with custom format showing ID, Name, and Ports
    const result = spawnSync('docker', ['ps', '--format', '{{.ID}}\t{{.Names}}\t{{.Ports}}'], {
      stdio: 'inherit',
      encoding: 'utf8'
    });

    if (result.status !== 0) {
      console.error('');
      console.error('Error: Could not connect to Docker daemon.');
      console.error('');
      console.error('Make sure Docker is running:');
      console.error('  sudo systemctl start docker');
      console.error('');
      console.error('To run docker without sudo, add your user to the docker group:');
      console.error('  sudo usermod -aG docker $USER');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error executing docker command:', error.message);
    process.exit(1);
  }
}

/**
 * Display running Docker containers on Amazon Linux.
 *
 * Amazon Linux typically has Docker available in its package repository.
 * It uses dnf (Amazon Linux 2023) or yum (Amazon Linux 2) for installation.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_dp_amazon_linux(args) {
  // Check if Docker is installed
  if (!isCommandAvailable('docker')) {
    console.error('Docker is not currently installed.');
    console.error('');
    console.error('Install Docker on Amazon Linux:');
    console.error('  sudo yum install docker -y');
    console.error('  sudo systemctl start docker');
    console.error('  sudo usermod -aG docker $USER');
    process.exit(1);
  }

  try {
    // Execute docker ps with custom format showing ID, Name, and Ports
    const result = spawnSync('docker', ['ps', '--format', '{{.ID}}\t{{.Names}}\t{{.Ports}}'], {
      stdio: 'inherit',
      encoding: 'utf8'
    });

    if (result.status !== 0) {
      console.error('');
      console.error('Error: Could not connect to Docker daemon.');
      console.error('');
      console.error('Make sure Docker is running:');
      console.error('  sudo systemctl start docker');
      console.error('');
      console.error('To run docker without sudo, add your user to the docker group:');
      console.error('  sudo usermod -aG docker $USER');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error executing docker command:', error.message);
    process.exit(1);
  }
}

/**
 * Display running Docker containers on Windows Command Prompt.
 *
 * Windows uses Docker Desktop, which provides the docker CLI.
 * The command syntax is the same as Unix systems.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_dp_cmd(args) {
  // Check if Docker is installed
  if (!isCommandAvailable('docker')) {
    console.error('Docker is not currently installed.');
    console.error('');
    console.error('Install Docker Desktop for Windows:');
    console.error('  winget install Docker.DockerDesktop');
    console.error('');
    console.error('Or download from: https://www.docker.com/products/docker-desktop');
    process.exit(1);
  }

  try {
    // Execute docker ps with custom format showing ID, Name, and Ports
    const result = spawnSync('docker', ['ps', '--format', '{{.ID}}\t{{.Names}}\t{{.Ports}}'], {
      stdio: 'inherit',
      encoding: 'utf8',
      shell: true  // Use shell on Windows for proper command resolution
    });

    if (result.status !== 0) {
      console.error('');
      console.error('Error: Could not connect to Docker daemon.');
      console.error('Make sure Docker Desktop is running.');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error executing docker command:', error.message);
    process.exit(1);
  }
}

/**
 * Display running Docker containers on Windows PowerShell.
 *
 * PowerShell uses the same Docker CLI as Command Prompt.
 * Docker Desktop must be running for commands to work.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_dp_powershell(args) {
  // Check if Docker is installed
  if (!isCommandAvailable('docker')) {
    console.error('Docker is not currently installed.');
    console.error('');
    console.error('Install Docker Desktop for Windows:');
    console.error('  winget install Docker.DockerDesktop');
    console.error('');
    console.error('Or download from: https://www.docker.com/products/docker-desktop');
    process.exit(1);
  }

  try {
    // Execute docker ps with custom format showing ID, Name, and Ports
    const result = spawnSync('docker', ['ps', '--format', '{{.ID}}\t{{.Names}}\t{{.Ports}}'], {
      stdio: 'inherit',
      encoding: 'utf8',
      shell: true  // Use shell on Windows for proper command resolution
    });

    if (result.status !== 0) {
      console.error('');
      console.error('Error: Could not connect to Docker daemon.');
      console.error('Make sure Docker Desktop is running.');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error executing docker command:', error.message);
    process.exit(1);
  }
}

/**
 * Display running Docker containers on Git Bash.
 *
 * Git Bash runs on Windows and can access the Docker CLI
 * provided by Docker Desktop.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_dp_gitbash(args) {
  // Check if Docker is installed
  if (!isCommandAvailable('docker')) {
    console.error('Docker is not currently installed.');
    console.error('');
    console.error('Install Docker Desktop for Windows:');
    console.error('  https://www.docker.com/products/docker-desktop');
    console.error('');
    console.error('Make sure Docker is in your PATH after installation.');
    process.exit(1);
  }

  try {
    // Execute docker ps with custom format showing ID, Name, and Ports
    const result = spawnSync('docker', ['ps', '--format', '{{.ID}}\t{{.Names}}\t{{.Ports}}'], {
      stdio: 'inherit',
      encoding: 'utf8'
    });

    if (result.status !== 0) {
      console.error('');
      console.error('Error: Could not connect to Docker daemon.');
      console.error('Make sure Docker Desktop is running.');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error executing docker command:', error.message);
    process.exit(1);
  }
}

/**
 * Main entry point - detects environment and executes appropriate implementation.
 *
 * The "dp" (Docker Process) command displays running Docker containers in a
 * formatted table showing container ID, name, and port mappings. This provides
 * a quick, clean view of what's running without the extra columns from `docker ps`.
 *
 * The output format is:
 *   CONTAINER_ID    CONTAINER_NAME    PORT_MAPPINGS
 *
 * Example output:
 *   abc123def456    my-nginx    0.0.0.0:80->80/tcp
 *   789ghi012jkl    my-redis    0.0.0.0:6379->6379/tcp
 *
 * @param {string[]} args - Command line arguments (unused, but could be extended)
 * @returns {Promise<void>}
 */
async function do_dp(args) {
  const platform = os.detect();

  const handlers = {
    'macos': do_dp_macos,
    'ubuntu': do_dp_ubuntu,
    'debian': do_dp_ubuntu,
    'raspbian': do_dp_raspbian,
    'amazon_linux': do_dp_amazon_linux,
    'rhel': do_dp_amazon_linux,
    'fedora': do_dp_ubuntu,
    'linux': do_dp_ubuntu,
    'wsl': do_dp_ubuntu,
    'cmd': do_dp_cmd,
    'windows': do_dp_cmd,
    'powershell': do_dp_powershell,
    'gitbash': do_dp_gitbash
  };

  const handler = handlers[platform.type];
  if (!handler) {
    console.error(`Platform '${platform.type}' is not supported for this command.`);
    console.error('');
    console.error('Supported platforms:');
    console.error('  - macOS');
    console.error('  - Ubuntu, Debian, and other Linux distributions');
    console.error('  - Raspberry Pi OS');
    console.error('  - Amazon Linux');
    console.error('  - Windows (CMD, PowerShell, Git Bash)');
    process.exit(1);
  }

  await handler(args);
}

module.exports = {
  main: do_dp,
  do_dp,
  do_dp_nodejs,
  do_dp_macos,
  do_dp_ubuntu,
  do_dp_raspbian,
  do_dp_amazon_linux,
  do_dp_cmd,
  do_dp_powershell,
  do_dp_gitbash
};

if (require.main === module) {
  do_dp(process.argv.slice(2));
}
