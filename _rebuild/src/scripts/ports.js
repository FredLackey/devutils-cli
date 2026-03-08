#!/usr/bin/env node

/**
 * ports - List open network ports and the processes using them
 *
 * Migrated from legacy dotfiles alias.
 * Original: alias ports="lsof -i -P -n"
 *
 * This script displays a list of all open network ports (TCP and UDP) along
 * with the processes that are using them. It's useful for:
 * - Finding which process is using a specific port
 * - Diagnosing "port already in use" errors
 * - Security auditing to see what's listening on the network
 * - Debugging network connectivity issues
 *
 * Usage:
 *   ports                    # Show all open ports and connections
 *   ports --listening        # Show only listening ports (servers)
 *   ports --tcp              # Show only TCP connections
 *   ports --udp              # Show only UDP connections
 *   ports <port_number>      # Filter to show only a specific port
 *   ports --help             # Show help information
 *
 * @module scripts/ports
 */

const os = require('../utils/common/os');
const { spawnSync } = require('child_process');

/**
 * Helper function to check if a command exists on the system.
 * Uses platform-appropriate command checking.
 *
 * @param {string} cmd - The command name to check
 * @returns {boolean} True if the command exists, false otherwise
 */
function isCommandAvailable(cmd) {
  try {
    const checkCmd = process.platform === 'win32' ? `where ${cmd}` : `which ${cmd}`;
    const { execSync } = require('child_process');
    execSync(checkCmd, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Parses command line arguments to determine filtering options.
 *
 * @param {string[]} args - Command line arguments
 * @returns {{ help: boolean, listening: boolean, tcp: boolean, udp: boolean, port: number|null }}
 */
function parseArgs(args) {
  const result = {
    help: false,
    listening: false,
    tcp: false,
    udp: false,
    port: null
  };

  for (const arg of args) {
    const lower = arg.toLowerCase();

    if (lower === '--help' || lower === '-h' || lower === 'help') {
      result.help = true;
    } else if (lower === '--listening' || lower === '-l') {
      result.listening = true;
    } else if (lower === '--tcp' || lower === '-t') {
      result.tcp = true;
    } else if (lower === '--udp' || lower === '-u') {
      result.udp = true;
    } else {
      // Check if it's a port number
      const portNum = parseInt(arg, 10);
      if (!isNaN(portNum) && portNum > 0 && portNum <= 65535) {
        result.port = portNum;
      }
    }
  }

  return result;
}

/**
 * Displays help information for the ports command.
 */
function showHelp() {
  console.log('ports - List open network ports and the processes using them');
  console.log('');
  console.log('Usage: ports [OPTIONS] [PORT_NUMBER]');
  console.log('');
  console.log('Options:');
  console.log('  --listening, -l   Show only listening ports (servers waiting for connections)');
  console.log('  --tcp, -t         Show only TCP connections');
  console.log('  --udp, -u         Show only UDP connections');
  console.log('  --help, -h        Show this help message');
  console.log('');
  console.log('Arguments:');
  console.log('  PORT_NUMBER       Filter results to show only a specific port (1-65535)');
  console.log('');
  console.log('Examples:');
  console.log('  ports                    # Show all open ports');
  console.log('  ports --listening        # Show only listening ports');
  console.log('  ports 3000               # Show what is using port 3000');
  console.log('  ports --tcp --listening  # Show TCP servers only');
  console.log('  ports 80                 # Check if something is using port 80');
  console.log('');
  console.log('Note: Some platforms may require elevated privileges (sudo) to see all processes.');
}

/**
 * Pure Node.js implementation - NOT FULLY APPLICABLE for this script.
 *
 * Listing open ports requires OS-level tools like lsof (macOS/Linux),
 * ss/netstat (Linux), or netstat (Windows). Node.js does not have built-in
 * APIs to enumerate system-wide network connections.
 *
 * While Node.js can check if a specific port is in use (by trying to bind),
 * it cannot list all open ports with their associated processes.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 * @throws {Error} Always throws - OS-level tools are required
 */
async function do_ports_nodejs(args) {
  throw new Error(
    'do_ports_nodejs should not be called directly. ' +
    'Listing network ports requires OS-level tools (lsof, ss, netstat).'
  );
}

/**
 * List open ports on macOS using lsof.
 *
 * The lsof command lists open files, and since network sockets are files
 * in Unix-like systems, it can show all network connections.
 *
 * lsof flags used:
 *   -i  : Select files with Internet addresses (network connections)
 *   -P  : Inhibit port number to service name conversion (show raw port numbers)
 *   -n  : Inhibit hostname resolution (show IP addresses instead of hostnames)
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_ports_macos(args) {
  const options = parseArgs(args);

  if (options.help) {
    showHelp();
    return;
  }

  // Check if lsof is available (it's built into macOS, but let's be safe)
  if (!isCommandAvailable('lsof')) {
    console.error('Error: lsof is required but not found.');
    console.error('lsof should be installed by default on macOS.');
    process.exit(1);
  }

  // Build the lsof command arguments
  // Base flags: -i (internet), -P (no port names), -n (no hostname resolution)
  const lsofArgs = ['-i', '-P', '-n'];

  // Filter by protocol (TCP or UDP)
  // If both or neither are specified, show all
  if (options.tcp && !options.udp) {
    // Replace -i with -iTCP
    lsofArgs[0] = '-iTCP';
  } else if (options.udp && !options.tcp) {
    // Replace -i with -iUDP
    lsofArgs[0] = '-iUDP';
  }

  // Filter by specific port
  if (options.port) {
    // Modify the -i flag to include port filter: -i:PORT
    lsofArgs[0] = lsofArgs[0] + ':' + options.port;
  }

  try {
    // Run lsof - may need sudo to see all processes
    const result = spawnSync('lsof', lsofArgs, {
      encoding: 'utf8',
      stdio: ['inherit', 'pipe', 'pipe']
    });

    let output = result.stdout || '';
    const stderr = result.stderr || '';

    // If no output and there's a "permission denied" hint, suggest sudo
    if (!output && stderr.includes('permission')) {
      console.log('No results found. You may need to run with sudo to see all processes:');
      console.log('  sudo ports');
      return;
    }

    // Filter for listening ports only if requested
    if (options.listening && output) {
      const lines = output.split('\n');
      const header = lines[0];
      const dataLines = lines.slice(1).filter(line => line.includes('(LISTEN)'));

      if (dataLines.length === 0) {
        console.log('No listening ports found.');
        return;
      }

      output = header + '\n' + dataLines.join('\n');
    }

    if (output.trim()) {
      console.log(output);
    } else {
      if (options.port) {
        console.log(`No connections found on port ${options.port}.`);
      } else {
        console.log('No open network connections found.');
      }
    }

    // Show any errors (except "no results" which is handled above)
    if (stderr && !stderr.includes('permission')) {
      console.error(stderr);
    }
  } catch (error) {
    console.error('Error running lsof:', error.message);
    process.exit(1);
  }
}

/**
 * List open ports on Ubuntu using ss or netstat.
 *
 * Modern Linux systems use ss (socket statistics) which is faster than netstat.
 * Falls back to netstat if ss is not available.
 *
 * ss flags used:
 *   -t  : Show TCP sockets
 *   -u  : Show UDP sockets
 *   -l  : Show listening sockets
 *   -n  : Don't resolve service names (show port numbers)
 *   -p  : Show process using the socket
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_ports_ubuntu(args) {
  const options = parseArgs(args);

  if (options.help) {
    showHelp();
    return;
  }

  // Try ss first (modern Linux), fall back to netstat
  const useSs = isCommandAvailable('ss');
  const useNetstat = !useSs && isCommandAvailable('netstat');

  if (!useSs && !useNetstat) {
    console.error('Error: Neither ss nor netstat is available.');
    console.error('');
    console.error('Install with: sudo apt install iproute2     # for ss');
    console.error('         or: sudo apt install net-tools    # for netstat');
    process.exit(1);
  }

  if (useSs) {
    // Use ss command
    const ssArgs = ['-n', '-p'];

    // Protocol filter
    if (options.tcp && !options.udp) {
      ssArgs.push('-t');
    } else if (options.udp && !options.tcp) {
      ssArgs.push('-u');
    } else {
      // Both or neither specified - show both
      ssArgs.push('-t', '-u');
    }

    // Listening only filter
    if (options.listening) {
      ssArgs.push('-l');
    } else {
      // Show all (listening and established)
      ssArgs.push('-a');
    }

    try {
      // ss may need sudo to show process names
      const result = spawnSync('ss', ssArgs, {
        encoding: 'utf8',
        stdio: ['inherit', 'pipe', 'pipe']
      });

      let output = result.stdout || '';

      // Filter by specific port if requested
      if (options.port && output) {
        const lines = output.split('\n');
        const header = lines[0];
        const dataLines = lines.slice(1).filter(line => {
          // Match port in the output (format varies: :PORT or *:PORT)
          const portPattern = new RegExp('[:*]' + options.port + '\\b');
          return portPattern.test(line);
        });

        if (dataLines.length === 0) {
          console.log(`No connections found on port ${options.port}.`);
          return;
        }

        output = header + '\n' + dataLines.join('\n');
      }

      if (output.trim()) {
        console.log(output);
      } else {
        console.log('No open network connections found.');
        console.log('');
        console.log('Tip: Run with sudo to see process names:');
        console.log('  sudo ports');
      }
    } catch (error) {
      console.error('Error running ss:', error.message);
      process.exit(1);
    }
  } else {
    // Fall back to netstat
    const netstatArgs = ['-n'];

    // Protocol filter
    if (options.tcp && !options.udp) {
      netstatArgs.push('-t');
    } else if (options.udp && !options.tcp) {
      netstatArgs.push('-u');
    } else {
      netstatArgs.push('-t', '-u');
    }

    // Listening only or all
    if (options.listening) {
      netstatArgs.push('-l');
    } else {
      netstatArgs.push('-a');
    }

    // Add -p for process info (requires sudo)
    netstatArgs.push('-p');

    try {
      const result = spawnSync('netstat', netstatArgs, {
        encoding: 'utf8',
        stdio: ['inherit', 'pipe', 'pipe']
      });

      let output = result.stdout || '';

      // Filter by specific port if requested
      if (options.port && output) {
        const lines = output.split('\n');
        const filtered = lines.filter(line => {
          // Keep header lines
          if (line.includes('Proto') || line.includes('Active')) {
            return true;
          }
          const portPattern = new RegExp('[:*]' + options.port + '\\b');
          return portPattern.test(line);
        });

        output = filtered.join('\n');
      }

      if (output.trim()) {
        console.log(output);
      } else {
        console.log('No open network connections found.');
      }
    } catch (error) {
      console.error('Error running netstat:', error.message);
      process.exit(1);
    }
  }
}

/**
 * List open ports on Raspberry Pi OS.
 *
 * Raspberry Pi OS (Raspbian) is Debian-based and uses the same tools as Ubuntu.
 * This function delegates to the Ubuntu implementation.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_ports_raspbian(args) {
  return do_ports_ubuntu(args);
}

/**
 * List open ports on Amazon Linux.
 *
 * Amazon Linux uses the same ss/netstat tools as other Linux distributions.
 * This function delegates to the Ubuntu implementation.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_ports_amazon_linux(args) {
  return do_ports_ubuntu(args);
}

/**
 * List open ports on Windows using netstat.
 *
 * Windows has a built-in netstat command that can show network connections.
 *
 * netstat flags used:
 *   -a  : Display all connections and listening ports
 *   -n  : Display addresses and port numbers in numerical form
 *   -o  : Display the owning process ID (PID)
 *   -b  : Display the executable involved (requires admin)
 *   -p  : Filter by protocol (TCP or UDP)
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_ports_cmd(args) {
  const options = parseArgs(args);

  if (options.help) {
    showHelp();
    return;
  }

  // Windows always has netstat
  const netstatArgs = ['-a', '-n', '-o'];

  // Protocol filter
  if (options.tcp && !options.udp) {
    netstatArgs.push('-p', 'TCP');
  } else if (options.udp && !options.tcp) {
    netstatArgs.push('-p', 'UDP');
  }

  try {
    const result = spawnSync('netstat', netstatArgs, {
      encoding: 'utf8',
      shell: true,
      stdio: ['inherit', 'pipe', 'pipe']
    });

    let output = result.stdout || '';

    // Filter for listening only if requested
    if (options.listening && output) {
      const lines = output.split('\n');
      const filtered = lines.filter(line => {
        // Keep header lines
        if (line.includes('Proto') || line.includes('Active') || line.trim() === '') {
          return true;
        }
        return line.includes('LISTENING');
      });
      output = filtered.join('\n');
    }

    // Filter by specific port if requested
    if (options.port && output) {
      const lines = output.split('\n');
      const filtered = lines.filter(line => {
        // Keep header lines
        if (line.includes('Proto') || line.includes('Active') || line.trim() === '') {
          return true;
        }
        // Windows shows ports as 0.0.0.0:PORT or [::]:PORT
        const portPattern = new RegExp(':' + options.port + '\\b');
        return portPattern.test(line);
      });
      output = filtered.join('\n');
    }

    if (output.trim()) {
      console.log(output);
      console.log('');
      console.log('The last column shows the Process ID (PID).');
      console.log('Use "tasklist /FI \\"PID eq <PID>\\"" to find the process name.');
    } else {
      if (options.port) {
        console.log(`No connections found on port ${options.port}.`);
      } else {
        console.log('No open network connections found.');
      }
    }
  } catch (error) {
    console.error('Error running netstat:', error.message);
    process.exit(1);
  }
}

/**
 * List open ports on Windows using PowerShell.
 *
 * PowerShell can use the Get-NetTCPConnection and Get-NetUDPEndpoint cmdlets
 * for more detailed information, but we use netstat for consistency.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_ports_powershell(args) {
  // Use the same netstat approach as CMD for consistency
  return do_ports_cmd(args);
}

/**
 * List open ports in Git Bash on Windows.
 *
 * Git Bash runs on Windows, so this uses the Windows netstat command.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_ports_gitbash(args) {
  return do_ports_cmd(args);
}

/**
 * Main entry point - detects environment and executes appropriate implementation.
 *
 * The "ports" command shows all open network ports and the processes using them.
 * This is essential for:
 * - Debugging "port already in use" errors during development
 * - Finding which process is listening on a specific port
 * - Security auditing to see what services are exposed
 * - Troubleshooting network connectivity issues
 *
 * Each platform uses different tools:
 * - macOS: lsof (list open files, including network sockets)
 * - Linux: ss (socket statistics) or netstat (fallback)
 * - Windows: netstat
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_ports(args) {
  const platform = os.detect();

  const handlers = {
    'macos': do_ports_macos,
    'ubuntu': do_ports_ubuntu,
    'debian': do_ports_ubuntu,
    'raspbian': do_ports_raspbian,
    'amazon_linux': do_ports_amazon_linux,
    'rhel': do_ports_amazon_linux,
    'fedora': do_ports_ubuntu,
    'linux': do_ports_ubuntu,
    'wsl': do_ports_ubuntu,
    'cmd': do_ports_cmd,
    'windows': do_ports_cmd,
    'powershell': do_ports_powershell,
    'gitbash': do_ports_gitbash
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
  main: do_ports,
  do_ports,
  do_ports_nodejs,
  do_ports_macos,
  do_ports_ubuntu,
  do_ports_raspbian,
  do_ports_amazon_linux,
  do_ports_cmd,
  do_ports_powershell,
  do_ports_gitbash
};

if (require.main === module) {
  do_ports(process.argv.slice(2));
}
