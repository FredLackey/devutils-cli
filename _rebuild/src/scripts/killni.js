#!/usr/bin/env node

/**
 * killni - Kill Node Inspector processes
 *
 * Migrated from legacy dotfiles alias.
 * Original:
 *   killni() {
 *       killni_target='node --debug-brk'
 *       ps -ef | grep "$killni_target" | grep -v grep | awk '{print $2}' | xargs kill -9
 *   }
 *
 * This script finds and forcibly terminates all Node.js processes that were
 * started with the --debug-brk flag. This flag was used by the legacy Node
 * Inspector debugger to pause execution at the first line of code, waiting
 * for a debugger to attach.
 *
 * Note: The --debug-brk flag is deprecated in modern Node.js versions.
 * Modern Node.js uses --inspect and --inspect-brk instead. This script
 * kills processes using either the legacy or modern debug flags.
 *
 * @module scripts/killni
 */

const os = require('../utils/common/os');
const { execSync, spawnSync } = require('child_process');

/**
 * Helper function to check if a command exists on the system.
 *
 * @param {string} cmd - The command name to check
 * @returns {boolean} True if the command exists, false otherwise
 */
function isCommandAvailable(cmd) {
  try {
    const checkCmd = process.platform === 'win32' ? `where ${cmd}` : `which ${cmd}`;
    execSync(checkCmd, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Pure Node.js implementation that cannot be used for this script.
 *
 * Process enumeration and forceful termination require OS-level commands.
 * Node.js can only terminate processes it has a reference to (via child_process),
 * and process.kill() requires knowing the PID in advance. Enumerating all
 * system processes cannot be done reliably with pure Node.js across platforms.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 * @throws {Error} Always throws - this function should not be called directly
 */
async function do_killni_nodejs(args) {
  // Process enumeration requires OS-specific commands:
  // - Unix: ps -ef, pgrep, or reading /proc
  // - Windows: tasklist, wmic, or Get-Process
  // There is no cross-platform pure Node.js way to enumerate all processes.
  throw new Error(
    'do_killni_nodejs should not be called directly. ' +
    'Process enumeration and termination require OS-specific commands.'
  );
}

/**
 * Kill Node Inspector processes on macOS.
 *
 * Uses the native 'ps' and 'grep' commands to find processes, then sends
 * SIGKILL (-9) to forcibly terminate them. This matches the original
 * dotfiles behavior.
 *
 * Searches for both legacy (--debug-brk) and modern (--inspect-brk) flags.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_killni_macos(args) {
  // Patterns to search for - both legacy and modern debug flags
  const patterns = ['--debug-brk', '--inspect-brk', '--debug', '--inspect'];
  let totalKilled = 0;

  for (const pattern of patterns) {
    try {
      // Get list of PIDs matching the pattern
      // Using pgrep if available (cleaner), otherwise fall back to ps | grep
      let pids = [];

      if (isCommandAvailable('pgrep')) {
        // pgrep -f searches the full command line
        // pgrep returns non-zero if no processes found, which is not an error for us
        try {
          const result = execSync(`pgrep -f "${pattern}"`, { encoding: 'utf8' });
          pids = result.trim().split('\n').filter(pid => pid.length > 0);
        } catch {
          // No processes found - this is fine, continue to next pattern
          pids = [];
        }
      } else {
        // Fallback to ps | grep approach (original dotfiles method)
        try {
          const psOutput = execSync(
            `ps -ef | grep "${pattern}" | grep -v grep | awk '{print $2}'`,
            { encoding: 'utf8' }
          );
          pids = psOutput.trim().split('\n').filter(pid => pid.length > 0);
        } catch {
          pids = [];
        }
      }

      // Kill each process found
      for (const pid of pids) {
        // Skip our own process
        if (parseInt(pid, 10) === process.pid) {
          continue;
        }

        try {
          // Use kill -9 for forceful termination (matches original alias)
          execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
          console.log(`Killed process ${pid} (matched: ${pattern})`);
          totalKilled++;
        } catch {
          // Process may have already exited - this is fine
        }
      }
    } catch (error) {
      // Error searching for this pattern - continue to next
      continue;
    }
  }

  if (totalKilled === 0) {
    console.log('No Node Inspector processes found.');
  } else {
    console.log(`Total processes killed: ${totalKilled}`);
  }
}

/**
 * Kill Node Inspector processes on Ubuntu.
 *
 * Uses pgrep/pkill or ps/grep approach depending on what's available.
 * Linux typically has these tools installed by default.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_killni_ubuntu(args) {
  // Ubuntu typically has pgrep/pkill available
  const patterns = ['--debug-brk', '--inspect-brk', '--debug', '--inspect'];
  let totalKilled = 0;

  for (const pattern of patterns) {
    try {
      let pids = [];

      // Try pgrep first (cleaner)
      if (isCommandAvailable('pgrep')) {
        try {
          const result = execSync(`pgrep -f "${pattern}"`, { encoding: 'utf8' });
          pids = result.trim().split('\n').filter(pid => pid.length > 0);
        } catch {
          pids = [];
        }
      } else {
        // Fallback to ps | grep (original approach)
        try {
          const psOutput = execSync(
            `ps -ef | grep "${pattern}" | grep -v grep | awk '{print $2}'`,
            { encoding: 'utf8' }
          );
          pids = psOutput.trim().split('\n').filter(pid => pid.length > 0);
        } catch {
          pids = [];
        }
      }

      for (const pid of pids) {
        if (parseInt(pid, 10) === process.pid) {
          continue;
        }

        try {
          execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
          console.log(`Killed process ${pid} (matched: ${pattern})`);
          totalKilled++;
        } catch {
          // Process may have already exited
        }
      }
    } catch {
      continue;
    }
  }

  if (totalKilled === 0) {
    console.log('No Node Inspector processes found.');
  } else {
    console.log(`Total processes killed: ${totalKilled}`);
  }
}

/**
 * Kill Node Inspector processes on Raspberry Pi OS.
 *
 * Raspberry Pi OS is Debian-based and has the same tools available as Ubuntu.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_killni_raspbian(args) {
  // Raspbian has the same tools as Ubuntu/Debian
  return do_killni_ubuntu(args);
}

/**
 * Kill Node Inspector processes on Amazon Linux.
 *
 * Amazon Linux (RHEL-based) has similar process tools to Ubuntu.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_killni_amazon_linux(args) {
  // Amazon Linux has pgrep/ps available
  return do_killni_ubuntu(args);
}

/**
 * Kill Node Inspector processes on Windows using Command Prompt.
 *
 * Windows uses different tools for process management:
 * - tasklist: List running processes
 * - taskkill: Terminate processes
 * - wmic: Windows Management Instrumentation (more detailed process info)
 *
 * We use wmic to get the command line of each node process, then taskkill
 * to terminate matching processes.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_killni_cmd(args) {
  const patterns = ['--debug-brk', '--inspect-brk', '--debug', '--inspect'];
  let totalKilled = 0;

  try {
    // Get all node.exe processes with their command lines using wmic
    // wmic output format: CommandLine=..., ProcessId=...
    let wmicOutput;
    try {
      wmicOutput = execSync(
        'wmic process where "name=\'node.exe\'" get CommandLine,ProcessId /format:csv',
        { encoding: 'utf8' }
      );
    } catch {
      // No node processes found or wmic failed
      console.log('No Node Inspector processes found.');
      return;
    }

    // Parse wmic CSV output
    // Format: Node,CommandLine,ProcessId (header on first non-empty line)
    const lines = wmicOutput.trim().split('\n').filter(line => line.trim().length > 0);

    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // CSV format: ComputerName,CommandLine,ProcessId
      // CommandLine may contain commas, so we need to be careful
      const parts = line.split(',');
      if (parts.length < 3) continue;

      // ProcessId is the last element
      const pid = parts[parts.length - 1].trim();
      // CommandLine is everything between first comma and last comma
      const commandLine = parts.slice(1, -1).join(',');

      // Check if this process matches any of our patterns
      for (const pattern of patterns) {
        if (commandLine.includes(pattern)) {
          // Skip our own process
          if (parseInt(pid, 10) === process.pid) {
            continue;
          }

          try {
            // Use taskkill with /F for forceful termination (like kill -9)
            execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
            console.log(`Killed process ${pid} (matched: ${pattern})`);
            totalKilled++;
          } catch {
            // Process may have already exited
          }
          break; // Don't count same process multiple times
        }
      }
    }
  } catch (error) {
    // wmic or taskkill not available - try alternative approach
    console.error('Error: Could not enumerate processes.');
    console.error('This script requires wmic and taskkill commands.');
    process.exit(1);
  }

  if (totalKilled === 0) {
    console.log('No Node Inspector processes found.');
  } else {
    console.log(`Total processes killed: ${totalKilled}`);
  }
}

/**
 * Kill Node Inspector processes on Windows using PowerShell.
 *
 * PowerShell provides Get-Process and Stop-Process cmdlets which are more
 * powerful than the CMD equivalents. We can filter processes by command line
 * using Get-WmiObject or Get-CimInstance.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_killni_powershell(args) {
  const patterns = ['--debug-brk', '--inspect-brk', '--debug', '--inspect'];
  let totalKilled = 0;

  try {
    // Use Get-CimInstance (modern) or Get-WmiObject (legacy) to get process command lines
    // This PowerShell command returns JSON for easier parsing
    const psCommand = `
      Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
      Select-Object ProcessId, CommandLine |
      ConvertTo-Json -Compress
    `.replace(/\n/g, ' ');

    let output;
    try {
      output = execSync(`powershell -Command "${psCommand}"`, { encoding: 'utf8' });
    } catch {
      console.log('No Node Inspector processes found.');
      return;
    }

    // Parse JSON output
    let processes;
    try {
      const parsed = JSON.parse(output.trim());
      // PowerShell returns single object (not array) if only one process
      processes = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      console.log('No Node Inspector processes found.');
      return;
    }

    for (const proc of processes) {
      if (!proc || !proc.ProcessId || !proc.CommandLine) continue;

      const pid = proc.ProcessId;
      const commandLine = proc.CommandLine;

      for (const pattern of patterns) {
        if (commandLine.includes(pattern)) {
          if (pid === process.pid) {
            continue;
          }

          try {
            // Stop-Process -Force is equivalent to kill -9
            execSync(`powershell -Command "Stop-Process -Id ${pid} -Force"`, { stdio: 'ignore' });
            console.log(`Killed process ${pid} (matched: ${pattern})`);
            totalKilled++;
          } catch {
            // Process may have already exited
          }
          break;
        }
      }
    }
  } catch (error) {
    console.error('Error: Could not enumerate processes.');
    console.error('This script requires PowerShell with Get-CimInstance cmdlet.');
    process.exit(1);
  }

  if (totalKilled === 0) {
    console.log('No Node Inspector processes found.');
  } else {
    console.log(`Total processes killed: ${totalKilled}`);
  }
}

/**
 * Kill Node Inspector processes from Git Bash on Windows.
 *
 * Git Bash provides Unix-like commands (ps, grep, awk) but they may behave
 * differently than on true Unix systems. We try the Unix approach first,
 * then fall back to Windows commands if needed.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_killni_gitbash(args) {
  const patterns = ['--debug-brk', '--inspect-brk', '--debug', '--inspect'];
  let totalKilled = 0;

  // In Git Bash, we can try Unix-style commands first
  // If that fails, fall back to Windows commands
  let useUnixStyle = true;

  for (const pattern of patterns) {
    try {
      let pids = [];

      if (useUnixStyle) {
        // Try Unix-style approach (ps in Git Bash)
        try {
          const psOutput = execSync(
            `ps -ef | grep "${pattern}" | grep -v grep | awk '{print $2}'`,
            { encoding: 'utf8', shell: '/bin/bash' }
          );
          pids = psOutput.trim().split('\n').filter(pid => pid.length > 0);
        } catch {
          // Unix-style failed, switch to Windows
          useUnixStyle = false;
        }
      }

      if (!useUnixStyle || pids.length === 0) {
        // Use Windows tasklist/wmic approach
        try {
          const wmicOutput = execSync(
            'wmic process where "name=\'node.exe\'" get CommandLine,ProcessId /format:csv',
            { encoding: 'utf8' }
          );

          const lines = wmicOutput.trim().split('\n').filter(line => line.trim().length > 0);
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const parts = line.split(',');
            if (parts.length < 3) continue;

            const pid = parts[parts.length - 1].trim();
            const commandLine = parts.slice(1, -1).join(',');

            if (commandLine.includes(pattern)) {
              if (!pids.includes(pid)) {
                pids.push(pid);
              }
            }
          }
        } catch {
          // Neither approach worked
          continue;
        }
      }

      for (const pid of pids) {
        if (parseInt(pid, 10) === process.pid) {
          continue;
        }

        try {
          // In Git Bash, try kill first (Unix-style)
          if (useUnixStyle) {
            execSync(`kill -9 ${pid}`, { stdio: 'ignore', shell: '/bin/bash' });
          } else {
            // Fall back to taskkill
            execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
          }
          console.log(`Killed process ${pid} (matched: ${pattern})`);
          totalKilled++;
        } catch {
          // Try the other approach
          try {
            if (useUnixStyle) {
              execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
            } else {
              execSync(`kill -9 ${pid}`, { stdio: 'ignore', shell: '/bin/bash' });
            }
            console.log(`Killed process ${pid} (matched: ${pattern})`);
            totalKilled++;
          } catch {
            // Process may have already exited
          }
        }
      }
    } catch {
      continue;
    }
  }

  if (totalKilled === 0) {
    console.log('No Node Inspector processes found.');
  } else {
    console.log(`Total processes killed: ${totalKilled}`);
  }
}

/**
 * Main entry point - detects environment and executes appropriate implementation.
 *
 * The "killni" (Kill Node Inspector) command finds and forcibly terminates all
 * Node.js processes that are running with debug flags (--debug-brk, --inspect-brk,
 * --debug, --inspect). This is useful when:
 *
 * - A debugging session is stuck or unresponsive
 * - Multiple debug sessions were accidentally started
 * - You need to clean up orphaned Node Inspector processes
 * - Port conflicts occur because a debug port is still in use
 *
 * The script searches for both legacy (--debug, --debug-brk) and modern
 * (--inspect, --inspect-brk) debug flags to cover all Node.js versions.
 *
 * WARNING: This command forcibly kills processes (SIGKILL / taskkill /F).
 * Any unsaved work in the terminated processes will be lost.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_killni(args) {
  const platform = os.detect();

  const handlers = {
    'macos': do_killni_macos,
    'ubuntu': do_killni_ubuntu,
    'debian': do_killni_ubuntu,
    'raspbian': do_killni_raspbian,
    'amazon_linux': do_killni_amazon_linux,
    'rhel': do_killni_amazon_linux,
    'fedora': do_killni_ubuntu,
    'linux': do_killni_ubuntu,
    'wsl': do_killni_ubuntu,
    'cmd': do_killni_cmd,
    'windows': do_killni_cmd,
    'powershell': do_killni_powershell,
    'gitbash': do_killni_gitbash
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
  main: do_killni,
  do_killni,
  do_killni_nodejs,
  do_killni_macos,
  do_killni_ubuntu,
  do_killni_raspbian,
  do_killni_amazon_linux,
  do_killni_cmd,
  do_killni_powershell,
  do_killni_gitbash
};

if (require.main === module) {
  do_killni(process.argv.slice(2));
}
