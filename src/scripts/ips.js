#!/usr/bin/env node

/**
 * ips - Scan local network for active IP addresses using nmap
 *
 * Migrated from legacy dotfiles function.
 * Original:
 *   ips(){
 *       local usage="ips [%NETWORK_BASE_IP%] [%BIT_DEPTH%] [ip-only | no-sudo]"
 *       local addr="$1";
 *       local mask="$2";
 *       ...
 *       eval "${prefix}nmap $addr/$mask -n -sP${suffix}"
 *   }
 *
 * This script scans the local network to discover active hosts using nmap.
 * It performs a ping scan (-sP or -sn) to find which IP addresses are responding.
 *
 * Usage:
 *   ips                           # Scan 192.168.1.0/24 (default)
 *   ips 10.0.0.0 16               # Scan 10.0.0.0/16
 *   ips ip-only                   # Show only IP addresses, not full report
 *   ips no-sudo                   # Run without sudo (may miss some hosts)
 *   ips 192.168.1.0 24 ip-only    # Combine options
 *   ips help                      # Show usage information
 *
 * @module scripts/ips
 */

const os = require('../utils/common/os');
const { execSync, spawnSync } = require('child_process');

// Default network configuration
const DEFAULT_IP = '192.168.1.0';
const DEFAULT_MASK = 24;
const MIN_MASK = 4;
const MAX_MASK = 30;

/**
 * Helper function to check if a command exists on the system.
 * Uses platform-appropriate command checking.
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
 * Validates an IPv4 address format.
 * Checks if the string matches the pattern X.X.X.X where X is 0-255.
 *
 * @param {string} ip - The IP address string to validate
 * @returns {boolean} True if valid IPv4 format, false otherwise
 */
function isValidIPv4(ip) {
  if (!ip || typeof ip !== 'string') {
    return false;
  }
  // Match IPv4 pattern: four octets separated by dots
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = ip.match(ipv4Regex);
  if (!match) {
    return false;
  }
  // Check each octet is in valid range (0-255)
  for (let i = 1; i <= 4; i++) {
    const octet = parseInt(match[i], 10);
    if (octet < 0 || octet > 255) {
      return false;
    }
  }
  return true;
}

/**
 * Validates a subnet mask value.
 * Must be a number between MIN_MASK and MAX_MASK (typically 4-30).
 *
 * @param {string|number} mask - The subnet mask to validate
 * @returns {boolean} True if valid mask, false otherwise
 */
function isValidMask(mask) {
  const maskNum = parseInt(mask, 10);
  return !isNaN(maskNum) && maskNum >= MIN_MASK && maskNum <= MAX_MASK;
}

/**
 * Parses command line arguments to extract IP, mask, and options.
 * Arguments can be in any order - the function detects what each argument is.
 *
 * @param {string[]} args - Command line arguments
 * @returns {{ ip: string, mask: number, ipOnly: boolean, noSudo: boolean, help: boolean }}
 */
function parseArgs(args) {
  const result = {
    ip: DEFAULT_IP,
    mask: DEFAULT_MASK,
    ipOnly: false,
    noSudo: false,
    help: false
  };

  // Check for special flags first
  const argsString = args.join(' ').toLowerCase();
  if (argsString.includes('help') || argsString.includes('-h') || argsString.includes('--help')) {
    result.help = true;
    return result;
  }
  if (argsString.includes('ip-only')) {
    result.ipOnly = true;
  }
  if (argsString.includes('no-sudo')) {
    result.noSudo = true;
  }

  // Filter out option flags to find IP and mask
  const filteredArgs = args.filter(arg => {
    const lower = arg.toLowerCase();
    return lower !== 'ip-only' && lower !== 'no-sudo' && lower !== 'help';
  });

  // First non-flag argument should be IP address
  if (filteredArgs.length > 0) {
    const potentialIp = filteredArgs[0];
    if (isValidIPv4(potentialIp)) {
      result.ip = potentialIp;
    } else {
      console.log(`Invalid IP address supplied: ${potentialIp}. Defaulting to ${DEFAULT_IP}.`);
    }
  }

  // Second non-flag argument should be subnet mask
  if (filteredArgs.length > 1) {
    const potentialMask = filteredArgs[1];
    if (isValidMask(potentialMask)) {
      result.mask = parseInt(potentialMask, 10);
    } else {
      console.log(`Invalid mask supplied: ${potentialMask}. Defaulting to ${DEFAULT_MASK} bits.`);
    }
  }

  return result;
}

/**
 * Displays usage information for the ips command.
 */
function showUsage() {
  console.log('ips - Scan local network for active IP addresses');
  console.log('');
  console.log('Usage: ips [NETWORK_BASE_IP] [BIT_DEPTH] [OPTIONS]');
  console.log('');
  console.log('Arguments:');
  console.log('  NETWORK_BASE_IP    Network address to scan (default: 192.168.1.0)');
  console.log('  BIT_DEPTH          Subnet mask in CIDR notation, 4-30 (default: 24)');
  console.log('');
  console.log('Options:');
  console.log('  ip-only            Show only IP addresses, not full nmap report');
  console.log('  no-sudo            Run without sudo (may miss some hosts)');
  console.log('  help, -h, --help   Show this help message');
  console.log('');
  console.log('Examples:');
  console.log('  ips                           # Scan 192.168.1.0/24 with sudo');
  console.log('  ips 10.0.0.0 16               # Scan 10.0.0.0/16 with sudo');
  console.log('  ips ip-only                   # Scan default network, show only IPs');
  console.log('  ips no-sudo                   # Scan without sudo (less accurate)');
  console.log('  ips 192.168.1.0 24 ip-only    # Combine options');
  console.log('');
  console.log('Note: nmap must be installed. Without sudo, some hosts may not be detected.');
}

/**
 * Extracts IP addresses from nmap output.
 * Parses lines containing "Nmap scan report for X.X.X.X" and extracts the IP.
 *
 * @param {string} output - Raw nmap output
 * @returns {string[]} Array of IP addresses found
 */
function extractIpsFromOutput(output) {
  const ips = [];
  const lines = output.split('\n');
  for (const line of lines) {
    // nmap outputs: "Nmap scan report for 192.168.1.1"
    // or sometimes: "Nmap scan report for hostname (192.168.1.1)"
    const reportMatch = line.match(/Nmap scan report for\s+(?:\S+\s+\()?(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
    if (reportMatch) {
      ips.push(reportMatch[1]);
    } else {
      // Simple IP on the line
      const simpleMatch = line.match(/Nmap scan report for\s+(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
      if (simpleMatch) {
        ips.push(simpleMatch[1]);
      }
    }
  }
  return ips;
}

/**
 * Pure Node.js implementation - NOT FULLY APPLICABLE for this script.
 *
 * Network scanning requires the nmap tool which is a native OS command.
 * While Node.js can do basic network operations, a full network scan
 * requires nmap's capabilities (ARP scanning, ICMP, etc.).
 *
 * This function throws an error because nmap is required for proper scanning.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 * @throws {Error} Always throws - nmap is required
 */
async function do_ips_nodejs(args) {
  throw new Error(
    'do_ips_nodejs should not be called directly. ' +
    'Network scanning requires the nmap tool which must be installed on the system.'
  );
}

/**
 * Scan local network on macOS using nmap.
 *
 * macOS requires sudo for full ARP scanning capability. Without sudo,
 * nmap falls back to TCP connect scanning which is slower and may miss hosts.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_ips_macos(args) {
  const options = parseArgs(args);

  // Show help before checking for nmap - user might just want usage info
  if (options.help) {
    showUsage();
    return;
  }

  // Check if nmap is installed
  if (!isCommandAvailable('nmap')) {
    console.error('Error: nmap is required but not installed.');
    console.error('');
    console.error('Install it with: brew install nmap');
    process.exit(1);
  }

  // Build the nmap command
  // -n: No DNS resolution (faster)
  // -sn: Ping scan (host discovery only, no port scan) - replaces deprecated -sP
  const target = `${options.ip}/${options.mask}`;
  const nmapArgs = [target, '-n', '-sn'];

  console.log(`Scanning ${target}...`);

  try {
    let result;
    if (options.noSudo) {
      // Run without sudo
      result = spawnSync('nmap', nmapArgs, { encoding: 'utf8' });
    } else {
      // Run with sudo
      result = spawnSync('sudo', ['nmap', ...nmapArgs], {
        encoding: 'utf8',
        stdio: ['inherit', 'pipe', 'pipe']
      });
    }

    if (result.error) {
      throw result.error;
    }

    const output = result.stdout || '';

    if (options.ipOnly) {
      // Extract and print only IP addresses
      const ips = extractIpsFromOutput(output);
      if (ips.length === 0) {
        console.log('No hosts found.');
      } else {
        ips.forEach(ip => console.log(ip));
      }
    } else {
      // Print full nmap output
      console.log(output);
      if (result.stderr) {
        console.error(result.stderr);
      }
    }
  } catch (error) {
    console.error('Error running nmap:', error.message);
    process.exit(1);
  }
}

/**
 * Scan local network on Ubuntu using nmap.
 *
 * Ubuntu installation typically uses apt to install nmap.
 * Sudo is recommended for ARP-based host discovery.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_ips_ubuntu(args) {
  const options = parseArgs(args);

  // Show help before checking for nmap - user might just want usage info
  if (options.help) {
    showUsage();
    return;
  }

  // Check if nmap is installed
  if (!isCommandAvailable('nmap')) {
    console.error('Error: nmap is required but not installed.');
    console.error('');
    console.error('Install it with: sudo apt install nmap');
    process.exit(1);
  }

  const target = `${options.ip}/${options.mask}`;
  const nmapArgs = [target, '-n', '-sn'];

  console.log(`Scanning ${target}...`);

  try {
    let result;
    if (options.noSudo) {
      result = spawnSync('nmap', nmapArgs, { encoding: 'utf8' });
    } else {
      result = spawnSync('sudo', ['nmap', ...nmapArgs], {
        encoding: 'utf8',
        stdio: ['inherit', 'pipe', 'pipe']
      });
    }

    if (result.error) {
      throw result.error;
    }

    const output = result.stdout || '';

    if (options.ipOnly) {
      const ips = extractIpsFromOutput(output);
      if (ips.length === 0) {
        console.log('No hosts found.');
      } else {
        ips.forEach(ip => console.log(ip));
      }
    } else {
      console.log(output);
      if (result.stderr) {
        console.error(result.stderr);
      }
    }
  } catch (error) {
    console.error('Error running nmap:', error.message);
    process.exit(1);
  }
}

/**
 * Scan local network on Raspberry Pi OS using nmap.
 *
 * Raspberry Pi OS (Raspbian) uses apt for package management.
 * This is identical to Ubuntu implementation.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_ips_raspbian(args) {
  const options = parseArgs(args);

  // Show help before checking for nmap - user might just want usage info
  if (options.help) {
    showUsage();
    return;
  }

  // Check if nmap is installed
  if (!isCommandAvailable('nmap')) {
    console.error('Error: nmap is required but not installed.');
    console.error('');
    console.error('Install it with: sudo apt install nmap');
    process.exit(1);
  }

  const target = `${options.ip}/${options.mask}`;
  const nmapArgs = [target, '-n', '-sn'];

  console.log(`Scanning ${target}...`);

  try {
    let result;
    if (options.noSudo) {
      result = spawnSync('nmap', nmapArgs, { encoding: 'utf8' });
    } else {
      result = spawnSync('sudo', ['nmap', ...nmapArgs], {
        encoding: 'utf8',
        stdio: ['inherit', 'pipe', 'pipe']
      });
    }

    if (result.error) {
      throw result.error;
    }

    const output = result.stdout || '';

    if (options.ipOnly) {
      const ips = extractIpsFromOutput(output);
      if (ips.length === 0) {
        console.log('No hosts found.');
      } else {
        ips.forEach(ip => console.log(ip));
      }
    } else {
      console.log(output);
      if (result.stderr) {
        console.error(result.stderr);
      }
    }
  } catch (error) {
    console.error('Error running nmap:', error.message);
    process.exit(1);
  }
}

/**
 * Scan local network on Amazon Linux using nmap.
 *
 * Amazon Linux uses dnf or yum for package management.
 * Network scanning from EC2 instances should respect AWS security policies.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_ips_amazon_linux(args) {
  const options = parseArgs(args);

  // Show help before checking for nmap - user might just want usage info
  if (options.help) {
    showUsage();
    return;
  }

  // Check if nmap is installed
  if (!isCommandAvailable('nmap')) {
    console.error('Error: nmap is required but not installed.');
    console.error('');
    console.error('Install it with: sudo dnf install nmap');
    console.error('           or:  sudo yum install nmap');
    process.exit(1);
  }

  const target = `${options.ip}/${options.mask}`;
  const nmapArgs = [target, '-n', '-sn'];

  console.log(`Scanning ${target}...`);
  console.log('Note: Network scanning from cloud instances should comply with provider policies.');

  try {
    let result;
    if (options.noSudo) {
      result = spawnSync('nmap', nmapArgs, { encoding: 'utf8' });
    } else {
      result = spawnSync('sudo', ['nmap', ...nmapArgs], {
        encoding: 'utf8',
        stdio: ['inherit', 'pipe', 'pipe']
      });
    }

    if (result.error) {
      throw result.error;
    }

    const output = result.stdout || '';

    if (options.ipOnly) {
      const ips = extractIpsFromOutput(output);
      if (ips.length === 0) {
        console.log('No hosts found.');
      } else {
        ips.forEach(ip => console.log(ip));
      }
    } else {
      console.log(output);
      if (result.stderr) {
        console.error(result.stderr);
      }
    }
  } catch (error) {
    console.error('Error running nmap:', error.message);
    process.exit(1);
  }
}

/**
 * Scan local network on Windows using Command Prompt.
 *
 * Windows nmap does not require sudo/elevation for basic scanning.
 * nmap for Windows can be installed from https://nmap.org/download.html
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_ips_cmd(args) {
  const options = parseArgs(args);

  // Show help before checking for nmap - user might just want usage info
  if (options.help) {
    showUsage();
    return;
  }

  // Check if nmap is installed
  if (!isCommandAvailable('nmap')) {
    console.error('Error: nmap is required but not installed.');
    console.error('');
    console.error('Download and install from: https://nmap.org/download.html');
    console.error('Or install with: winget install Nmap.Nmap');
    console.error('           or:  choco install nmap');
    process.exit(1);
  }

  const target = `${options.ip}/${options.mask}`;
  const nmapArgs = [target, '-n', '-sn'];

  console.log(`Scanning ${target}...`);

  try {
    // Windows doesn't use sudo - nmap runs with current user privileges
    // For best results, run as Administrator
    const result = spawnSync('nmap', nmapArgs, { encoding: 'utf8' });

    if (result.error) {
      throw result.error;
    }

    const output = result.stdout || '';

    if (options.ipOnly) {
      const ips = extractIpsFromOutput(output);
      if (ips.length === 0) {
        console.log('No hosts found.');
      } else {
        ips.forEach(ip => console.log(ip));
      }
    } else {
      console.log(output);
      if (result.stderr) {
        console.error(result.stderr);
      }
    }
  } catch (error) {
    console.error('Error running nmap:', error.message);
    console.error('');
    console.error('Tip: For best results, run from an elevated Command Prompt.');
    process.exit(1);
  }
}

/**
 * Scan local network on Windows using PowerShell.
 *
 * PowerShell can run nmap the same as CMD.
 * The no-sudo option is ignored on Windows.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_ips_powershell(args) {
  // Same as CMD - nmap works the same way in PowerShell
  return do_ips_cmd(args);
}

/**
 * Scan local network from Git Bash on Windows.
 *
 * Git Bash runs on Windows, so this uses the Windows nmap installation.
 * The behavior is identical to the CMD implementation.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_ips_gitbash(args) {
  // Git Bash on Windows - same as CMD
  return do_ips_cmd(args);
}

/**
 * Main entry point - detects environment and executes appropriate implementation.
 *
 * The "ips" command scans the local network for active IP addresses using nmap.
 * This is useful for network discovery, troubleshooting, and security auditing.
 *
 * Features:
 * - Configurable network address and subnet mask
 * - Option to show only IP addresses (ip-only)
 * - Option to run without sudo for faster but less accurate results
 * - Works across all major platforms
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_ips(args) {
  const platform = os.detect();

  const handlers = {
    'macos': do_ips_macos,
    'ubuntu': do_ips_ubuntu,
    'debian': do_ips_ubuntu,
    'raspbian': do_ips_raspbian,
    'amazon_linux': do_ips_amazon_linux,
    'rhel': do_ips_amazon_linux,
    'fedora': do_ips_ubuntu,
    'linux': do_ips_ubuntu,
    'wsl': do_ips_ubuntu,
    'cmd': do_ips_cmd,
    'windows': do_ips_cmd,
    'powershell': do_ips_powershell,
    'gitbash': do_ips_gitbash
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
  main: do_ips,
  do_ips,
  do_ips_nodejs,
  do_ips_macos,
  do_ips_ubuntu,
  do_ips_raspbian,
  do_ips_amazon_linux,
  do_ips_cmd,
  do_ips_powershell,
  do_ips_gitbash
};

if (require.main === module) {
  do_ips(process.argv.slice(2));
}
