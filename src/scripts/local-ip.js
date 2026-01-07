#!/usr/bin/env node

/**
 * local-ip - Display the local network IP address of this machine
 *
 * Migrated from legacy dotfiles alias.
 * Original aliases:
 *   macOS:   alias local-ip="ipconfig getifaddr en1"
 *   Ubuntu:  alias local-ip='hostname -I | awk '{print $1}''
 *   Raspbian: alias local-ip='hostname -I | awk '{print $1}''
 *
 * This script displays the primary local/private IP address of the machine.
 * It finds the first non-internal IPv4 address from the network interfaces.
 * This is useful for quickly determining what IP address other devices on
 * the local network can use to connect to this machine.
 *
 * Usage:
 *   local-ip              # Display the primary local IP address
 *   local-ip --all        # Display all local IP addresses
 *   local-ip --help       # Show help information
 *
 * @module scripts/local-ip
 */

const osUtils = require('../utils/common/os');
const os = require('os');

/**
 * Retrieves all non-internal IPv4 addresses from network interfaces.
 *
 * This function uses Node.js's built-in os.networkInterfaces() API to
 * enumerate all network interfaces and filter for:
 * - IPv4 addresses (not IPv6)
 * - Non-internal addresses (not loopback 127.x.x.x)
 *
 * @returns {Array<{name: string, address: string}>} Array of interface names and their IP addresses
 */
function getLocalIPv4Addresses() {
  const interfaces = os.networkInterfaces();
  const results = [];

  // Iterate through each network interface (eth0, en0, wlan0, etc.)
  for (const [interfaceName, interfaceInfoList] of Object.entries(interfaces)) {
    // Each interface can have multiple addresses (IPv4, IPv6, etc.)
    for (const info of interfaceInfoList) {
      // We want IPv4 addresses that are not internal (not loopback)
      // info.family can be 'IPv4' or 4 depending on Node.js version
      const isIPv4 = info.family === 'IPv4' || info.family === 4;
      const isExternal = !info.internal;

      if (isIPv4 && isExternal) {
        results.push({
          name: interfaceName,
          address: info.address
        });
      }
    }
  }

  return results;
}

/**
 * Gets the primary local IP address (first non-internal IPv4 address found).
 *
 * The "primary" address is typically the first one returned by the OS,
 * which is usually the main network interface (Ethernet or WiFi).
 *
 * @returns {string|null} The primary local IP address, or null if none found
 */
function getPrimaryLocalIP() {
  const addresses = getLocalIPv4Addresses();
  return addresses.length > 0 ? addresses[0].address : null;
}

/**
 * Displays help information for the local-ip command.
 */
function showHelp() {
  console.log('local-ip - Display the local network IP address');
  console.log('');
  console.log('Usage: local-ip [OPTIONS]');
  console.log('');
  console.log('Options:');
  console.log('  --all, -a     Show all local IP addresses with interface names');
  console.log('  --help, -h    Show this help message');
  console.log('');
  console.log('Examples:');
  console.log('  local-ip              # Display primary local IP address');
  console.log('  local-ip --all        # Display all local IP addresses');
  console.log('');
  console.log('This command displays the local/private IP address that other devices');
  console.log('on the same network can use to connect to this machine.');
}

/**
 * Pure Node.js implementation that works on any platform.
 *
 * This function uses Node.js's built-in os.networkInterfaces() API to
 * retrieve local IP addresses. This approach works identically on all
 * platforms (macOS, Linux, Windows) without needing any shell commands.
 *
 * The original shell aliases used platform-specific commands:
 * - macOS: ipconfig getifaddr en1
 * - Linux: hostname -I | awk '{print $1}'
 *
 * But Node.js provides a cross-platform API that achieves the same result
 * more reliably and without external dependencies.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_local_ip_nodejs(args) {
  // Check for help flag
  if (args.includes('--help') || args.includes('-h') || args.includes('help')) {
    showHelp();
    return;
  }

  // Check for --all flag to show all addresses
  const showAll = args.includes('--all') || args.includes('-a');

  if (showAll) {
    // Display all local IP addresses with their interface names
    const addresses = getLocalIPv4Addresses();

    if (addresses.length === 0) {
      console.log('No local IP addresses found.');
      console.log('');
      console.log('This can happen if:');
      console.log('  - No network interfaces are connected');
      console.log('  - Only loopback (127.0.0.1) is available');
      process.exit(1);
    }

    // Display each address with its interface name
    for (const { name, address } of addresses) {
      console.log(`${name}: ${address}`);
    }
  } else {
    // Display only the primary (first) local IP address
    const primaryIP = getPrimaryLocalIP();

    if (!primaryIP) {
      console.log('No local IP address found.');
      console.log('');
      console.log('This can happen if:');
      console.log('  - No network interfaces are connected');
      console.log('  - Only loopback (127.0.0.1) is available');
      process.exit(1);
    }

    // Output just the IP address (matching original alias behavior)
    console.log(primaryIP);
  }
}

/**
 * Get local IP address on macOS.
 *
 * Uses the pure Node.js implementation since os.networkInterfaces()
 * works perfectly on macOS and provides the same information as
 * the original "ipconfig getifaddr en1" command.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_local_ip_macos(args) {
  // Node.js os.networkInterfaces() works perfectly on macOS
  return do_local_ip_nodejs(args);
}

/**
 * Get local IP address on Ubuntu.
 *
 * Uses the pure Node.js implementation since os.networkInterfaces()
 * works perfectly on Ubuntu and provides the same information as
 * the original "hostname -I | awk '{print $1}'" command.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_local_ip_ubuntu(args) {
  // Node.js os.networkInterfaces() works perfectly on Ubuntu
  return do_local_ip_nodejs(args);
}

/**
 * Get local IP address on Raspberry Pi OS.
 *
 * Uses the pure Node.js implementation since os.networkInterfaces()
 * works perfectly on Raspberry Pi OS (Raspbian) and provides the
 * same information as the original hostname command.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_local_ip_raspbian(args) {
  // Node.js os.networkInterfaces() works perfectly on Raspberry Pi OS
  return do_local_ip_nodejs(args);
}

/**
 * Get local IP address on Amazon Linux.
 *
 * Uses the pure Node.js implementation since os.networkInterfaces()
 * works perfectly on Amazon Linux (EC2 instances).
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_local_ip_amazon_linux(args) {
  // Node.js os.networkInterfaces() works perfectly on Amazon Linux
  return do_local_ip_nodejs(args);
}

/**
 * Get local IP address on Windows Command Prompt.
 *
 * Uses the pure Node.js implementation since os.networkInterfaces()
 * works perfectly on Windows without needing ipconfig parsing.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_local_ip_cmd(args) {
  // Node.js os.networkInterfaces() works perfectly on Windows
  return do_local_ip_nodejs(args);
}

/**
 * Get local IP address on Windows PowerShell.
 *
 * Uses the pure Node.js implementation since os.networkInterfaces()
 * provides cross-platform network interface information.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_local_ip_powershell(args) {
  // Node.js os.networkInterfaces() works perfectly on Windows
  return do_local_ip_nodejs(args);
}

/**
 * Get local IP address in Git Bash on Windows.
 *
 * Uses the pure Node.js implementation since os.networkInterfaces()
 * provides the same information regardless of the shell being used.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_local_ip_gitbash(args) {
  // Node.js os.networkInterfaces() works perfectly in Git Bash
  return do_local_ip_nodejs(args);
}

/**
 * Main entry point - detects environment and executes appropriate implementation.
 *
 * The "local-ip" command displays the local network IP address of the machine.
 * This is useful for:
 * - Knowing what IP to share with colleagues for local development servers
 * - Configuring firewall rules
 * - Setting up network services
 * - Debugging network connectivity
 *
 * Since Node.js provides a cross-platform os.networkInterfaces() API,
 * all platforms use the same pure Node.js implementation.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_local_ip(args) {
  const platform = osUtils.detect();

  const handlers = {
    'macos': do_local_ip_macos,
    'ubuntu': do_local_ip_ubuntu,
    'debian': do_local_ip_ubuntu,
    'raspbian': do_local_ip_raspbian,
    'amazon_linux': do_local_ip_amazon_linux,
    'rhel': do_local_ip_amazon_linux,
    'fedora': do_local_ip_ubuntu,
    'linux': do_local_ip_ubuntu,
    'wsl': do_local_ip_ubuntu,
    'cmd': do_local_ip_cmd,
    'windows': do_local_ip_cmd,
    'powershell': do_local_ip_powershell,
    'gitbash': do_local_ip_gitbash
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
  main: do_local_ip,
  do_local_ip,
  do_local_ip_nodejs,
  do_local_ip_macos,
  do_local_ip_ubuntu,
  do_local_ip_raspbian,
  do_local_ip_amazon_linux,
  do_local_ip_cmd,
  do_local_ip_powershell,
  do_local_ip_gitbash
};

if (require.main === module) {
  do_local_ip(process.argv.slice(2));
}
