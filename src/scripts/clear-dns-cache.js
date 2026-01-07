#!/usr/bin/env node

/**
 * clear-dns-cache - Flush the system's DNS cache to force fresh DNS lookups
 *
 * Migrated from legacy dotfiles alias.
 * Original: alias clear-dns-cache="sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder"
 *
 * DNS caching improves performance but can cause issues when DNS records change.
 * This script flushes the local DNS cache, forcing the system to perform fresh
 * lookups for all domain names. Common use cases include:
 * - After changing DNS servers
 * - When DNS records have been updated but old values are still cached
 * - Troubleshooting DNS resolution issues
 * - After modifying /etc/hosts file
 *
 * Note: This operation typically requires administrator/root privileges because
 * the DNS cache is a system-level resource.
 *
 * @module scripts/clear-dns-cache
 */

const os = require('../utils/common/os');
const { execSync } = require('child_process');

/**
 * Helper function to check if a command exists on the system.
 * Used to detect which DNS flush tools are available.
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
 * DNS cache flushing requires OS-level integration that cannot be done in pure Node.js.
 * Each platform has its own mechanism for managing DNS cache:
 * - macOS uses dscacheutil and mDNSResponder service
 * - Linux may use systemd-resolved, nscd, dnsmasq, or other resolvers
 * - Windows uses ipconfig /flushdns
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 * @throws {Error} Always throws - this function should not be called directly
 */
async function do_clear_dns_cache_nodejs(args) {
  // DNS cache flushing is inherently platform-specific and cannot be implemented
  // in pure Node.js. Each platform function contains the appropriate system call.
  throw new Error(
    'do_clear_dns_cache_nodejs should not be called directly. ' +
    'DNS cache flushing requires OS-specific commands.'
  );
}

/**
 * Flush DNS cache on macOS.
 *
 * macOS uses two components for DNS caching:
 * 1. dscacheutil: The Directory Service cache utility
 * 2. mDNSResponder: The multicast DNS responder daemon
 *
 * Both must be flushed to completely clear the DNS cache.
 * The killall -HUP command sends a hang-up signal to mDNSResponder,
 * which causes it to flush its cache without restarting.
 *
 * Note: Requires sudo/administrator privileges.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_clear_dns_cache_macos(args) {
  console.log('Flushing DNS cache on macOS...');
  console.log('Note: This operation requires administrator privileges.');
  console.log('');

  try {
    // Flush the Directory Service cache
    // This clears cached DNS lookups stored by the system
    console.log('Flushing dscacheutil...');
    execSync('sudo dscacheutil -flushcache', { stdio: 'inherit' });

    // Send HUP signal to mDNSResponder to flush its cache
    // mDNSResponder handles multicast DNS and unicast DNS caching
    console.log('Reloading mDNSResponder...');
    execSync('sudo killall -HUP mDNSResponder', { stdio: 'inherit' });

    console.log('');
    console.log('DNS cache cleared successfully.');
  } catch (error) {
    console.error('');
    console.error('Error: Failed to flush DNS cache.');
    console.error('Make sure you have administrator privileges.');
    console.error('');
    console.error('You can also try running these commands manually:');
    console.error('  sudo dscacheutil -flushcache');
    console.error('  sudo killall -HUP mDNSResponder');
    process.exit(1);
  }
}

/**
 * Flush DNS cache on Ubuntu.
 *
 * Ubuntu's DNS caching depends on the system configuration:
 * - systemd-resolved: Modern Ubuntu default (18.04+)
 * - nscd: Name Service Cache Daemon (if installed)
 * - dnsmasq: Lightweight DNS forwarder (sometimes used)
 *
 * This function tries multiple approaches to ensure the cache is cleared.
 *
 * Note: Requires sudo/root privileges for most operations.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_clear_dns_cache_ubuntu(args) {
  console.log('Flushing DNS cache on Ubuntu...');
  console.log('Note: This operation may require administrator privileges.');
  console.log('');

  let flushed = false;

  // Try systemd-resolved (modern Ubuntu default)
  // systemd-resolved is the default DNS resolver since Ubuntu 18.04
  if (isCommandAvailable('systemd-resolve') || isCommandAvailable('resolvectl')) {
    try {
      // resolvectl is the newer command name (Ubuntu 20.04+)
      // systemd-resolve is the older name but still works
      const cmd = isCommandAvailable('resolvectl')
        ? 'sudo resolvectl flush-caches'
        : 'sudo systemd-resolve --flush-caches';

      console.log('Flushing systemd-resolved cache...');
      execSync(cmd, { stdio: 'inherit' });
      flushed = true;
      console.log('systemd-resolved cache flushed.');
    } catch (error) {
      console.log('Note: systemd-resolved flush failed or not active.');
    }
  }

  // Try nscd (Name Service Cache Daemon)
  // Some systems use nscd for caching DNS and other name service lookups
  if (isCommandAvailable('nscd')) {
    try {
      console.log('Restarting nscd...');
      execSync('sudo systemctl restart nscd', { stdio: 'inherit' });
      flushed = true;
      console.log('nscd restarted.');
    } catch (error) {
      // nscd might not be running, try alternative method
      try {
        execSync('sudo nscd -i hosts', { stdio: 'inherit' });
        flushed = true;
        console.log('nscd hosts cache invalidated.');
      } catch {
        console.log('Note: nscd flush failed or not active.');
      }
    }
  }

  // Try dnsmasq (if installed and running)
  // dnsmasq is a lightweight DNS forwarder used on some systems
  if (isCommandAvailable('dnsmasq')) {
    try {
      console.log('Restarting dnsmasq...');
      execSync('sudo systemctl restart dnsmasq', { stdio: 'inherit' });
      flushed = true;
      console.log('dnsmasq restarted.');
    } catch {
      console.log('Note: dnsmasq restart failed or not active.');
    }
  }

  console.log('');

  if (flushed) {
    console.log('DNS cache cleared successfully.');
  } else {
    console.log('Warning: Could not find a running DNS cache service.');
    console.log('');
    console.log('Common DNS caching services on Ubuntu:');
    console.log('  - systemd-resolved (default on Ubuntu 18.04+)');
    console.log('  - nscd (Name Service Cache Daemon)');
    console.log('  - dnsmasq');
    console.log('');
    console.log('If you are using a different DNS resolver, consult its documentation.');
  }
}

/**
 * Flush DNS cache on Raspberry Pi OS.
 *
 * Raspberry Pi OS is Debian-based and typically uses systemd-resolved
 * or does not have DNS caching enabled by default. This function tries
 * the same approaches as Ubuntu.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_clear_dns_cache_raspbian(args) {
  console.log('Flushing DNS cache on Raspberry Pi OS...');
  console.log('Note: This operation may require administrator privileges.');
  console.log('');

  let flushed = false;

  // Try systemd-resolved
  if (isCommandAvailable('systemd-resolve') || isCommandAvailable('resolvectl')) {
    try {
      const cmd = isCommandAvailable('resolvectl')
        ? 'sudo resolvectl flush-caches'
        : 'sudo systemd-resolve --flush-caches';

      console.log('Flushing systemd-resolved cache...');
      execSync(cmd, { stdio: 'inherit' });
      flushed = true;
      console.log('systemd-resolved cache flushed.');
    } catch (error) {
      console.log('Note: systemd-resolved flush failed or not active.');
    }
  }

  // Try nscd
  if (isCommandAvailable('nscd')) {
    try {
      console.log('Restarting nscd...');
      execSync('sudo systemctl restart nscd', { stdio: 'inherit' });
      flushed = true;
      console.log('nscd restarted.');
    } catch {
      try {
        execSync('sudo nscd -i hosts', { stdio: 'inherit' });
        flushed = true;
        console.log('nscd hosts cache invalidated.');
      } catch {
        console.log('Note: nscd flush failed or not active.');
      }
    }
  }

  // Try dnsmasq (sometimes used on Raspberry Pi for network configurations)
  if (isCommandAvailable('dnsmasq')) {
    try {
      console.log('Restarting dnsmasq...');
      execSync('sudo systemctl restart dnsmasq', { stdio: 'inherit' });
      flushed = true;
      console.log('dnsmasq restarted.');
    } catch {
      console.log('Note: dnsmasq restart failed or not active.');
    }
  }

  console.log('');

  if (flushed) {
    console.log('DNS cache cleared successfully.');
  } else {
    console.log('Note: Raspberry Pi OS may not have DNS caching enabled by default.');
    console.log('');
    console.log('If you have installed a DNS caching service, try:');
    console.log('  - sudo systemctl restart systemd-resolved');
    console.log('  - sudo systemctl restart nscd');
    console.log('  - sudo systemctl restart dnsmasq');
  }
}

/**
 * Flush DNS cache on Amazon Linux.
 *
 * Amazon Linux is RHEL-based and typically uses nscd or systemd-resolved
 * for DNS caching. This function tries multiple approaches.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_clear_dns_cache_amazon_linux(args) {
  console.log('Flushing DNS cache on Amazon Linux...');
  console.log('Note: This operation may require administrator privileges.');
  console.log('');

  let flushed = false;

  // Try systemd-resolved (Amazon Linux 2023+)
  if (isCommandAvailable('systemd-resolve') || isCommandAvailable('resolvectl')) {
    try {
      const cmd = isCommandAvailable('resolvectl')
        ? 'sudo resolvectl flush-caches'
        : 'sudo systemd-resolve --flush-caches';

      console.log('Flushing systemd-resolved cache...');
      execSync(cmd, { stdio: 'inherit' });
      flushed = true;
      console.log('systemd-resolved cache flushed.');
    } catch (error) {
      console.log('Note: systemd-resolved flush failed or not active.');
    }
  }

  // Try nscd (common on RHEL-based systems)
  if (isCommandAvailable('nscd')) {
    try {
      console.log('Restarting nscd...');
      execSync('sudo systemctl restart nscd', { stdio: 'inherit' });
      flushed = true;
      console.log('nscd restarted.');
    } catch {
      try {
        // Fallback to service command for older systems
        execSync('sudo service nscd restart', { stdio: 'inherit' });
        flushed = true;
        console.log('nscd restarted.');
      } catch {
        try {
          execSync('sudo nscd -i hosts', { stdio: 'inherit' });
          flushed = true;
          console.log('nscd hosts cache invalidated.');
        } catch {
          console.log('Note: nscd flush failed or not active.');
        }
      }
    }
  }

  // Try dnsmasq
  if (isCommandAvailable('dnsmasq')) {
    try {
      console.log('Restarting dnsmasq...');
      execSync('sudo systemctl restart dnsmasq', { stdio: 'inherit' });
      flushed = true;
      console.log('dnsmasq restarted.');
    } catch {
      console.log('Note: dnsmasq restart failed or not active.');
    }
  }

  console.log('');

  if (flushed) {
    console.log('DNS cache cleared successfully.');
  } else {
    console.log('Warning: Could not find a running DNS cache service.');
    console.log('');
    console.log('Amazon Linux may not have DNS caching enabled by default.');
    console.log('If you have installed a DNS caching service, try:');
    console.log('  - sudo systemctl restart nscd');
    console.log('  - sudo systemctl restart systemd-resolved');
  }
}

/**
 * Flush DNS cache on Windows using Command Prompt.
 *
 * Windows uses the DNS Client service for caching DNS lookups.
 * The ipconfig /flushdns command clears the DNS resolver cache.
 *
 * Note: May require administrator privileges on some Windows configurations.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_clear_dns_cache_cmd(args) {
  console.log('Flushing DNS cache on Windows...');
  console.log('');

  try {
    // ipconfig /flushdns is the standard Windows command to flush DNS cache
    // This clears the DNS client resolver cache
    execSync('ipconfig /flushdns', { stdio: 'inherit' });

    console.log('');
    console.log('DNS cache cleared successfully.');
  } catch (error) {
    console.error('');
    console.error('Error: Failed to flush DNS cache.');
    console.error('');
    console.error('Try running this command in an Administrator command prompt:');
    console.error('  ipconfig /flushdns');
    console.error('');
    console.error('You may also need to restart the DNS Client service:');
    console.error('  net stop dnscache && net start dnscache');
    process.exit(1);
  }
}

/**
 * Flush DNS cache on Windows using PowerShell.
 *
 * PowerShell provides the Clear-DnsClientCache cmdlet which is the
 * modern way to flush DNS cache on Windows. Falls back to ipconfig
 * if the cmdlet is not available.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_clear_dns_cache_powershell(args) {
  console.log('Flushing DNS cache on Windows...');
  console.log('');

  try {
    // Try the PowerShell cmdlet first (more modern approach)
    // Clear-DnsClientCache is available on Windows 8/Server 2012 and later
    execSync('powershell -Command "Clear-DnsClientCache"', { stdio: 'inherit' });

    console.log('');
    console.log('DNS cache cleared successfully.');
  } catch (error) {
    // Fall back to ipconfig if PowerShell cmdlet fails
    try {
      console.log('PowerShell cmdlet failed, trying ipconfig...');
      execSync('ipconfig /flushdns', { stdio: 'inherit' });

      console.log('');
      console.log('DNS cache cleared successfully.');
    } catch (fallbackError) {
      console.error('');
      console.error('Error: Failed to flush DNS cache.');
      console.error('');
      console.error('Try running PowerShell as Administrator and use:');
      console.error('  Clear-DnsClientCache');
      console.error('');
      console.error('Or in Command Prompt as Administrator:');
      console.error('  ipconfig /flushdns');
      process.exit(1);
    }
  }
}

/**
 * Flush DNS cache from Git Bash on Windows.
 *
 * Git Bash runs on Windows, so we use the Windows ipconfig command.
 * The command is available in Git Bash's PATH.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_clear_dns_cache_gitbash(args) {
  console.log('Flushing DNS cache on Windows (via Git Bash)...');
  console.log('');

  try {
    // ipconfig is available in Git Bash on Windows
    execSync('ipconfig /flushdns', { stdio: 'inherit' });

    console.log('');
    console.log('DNS cache cleared successfully.');
  } catch (error) {
    console.error('');
    console.error('Error: Failed to flush DNS cache.');
    console.error('');
    console.error('Try opening Git Bash as Administrator and run:');
    console.error('  ipconfig /flushdns');
    console.error('');
    console.error('Or open an Administrator Command Prompt and run:');
    console.error('  ipconfig /flushdns');
    process.exit(1);
  }
}

/**
 * Main entry point - detects environment and executes appropriate implementation.
 *
 * The "clear-dns-cache" command flushes the system's DNS resolver cache,
 * forcing fresh DNS lookups for all domain names. This is useful when:
 * - DNS records have been updated but old values are still cached
 * - After changing DNS server settings
 * - Troubleshooting DNS resolution problems
 * - After modifying /etc/hosts or similar local DNS files
 *
 * The behavior varies by platform because each OS uses different DNS
 * caching mechanisms:
 * - macOS: dscacheutil and mDNSResponder
 * - Linux: systemd-resolved, nscd, or dnsmasq
 * - Windows: DNS Client service (ipconfig /flushdns)
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_clear_dns_cache(args) {
  const platform = os.detect();

  const handlers = {
    'macos': do_clear_dns_cache_macos,
    'ubuntu': do_clear_dns_cache_ubuntu,
    'debian': do_clear_dns_cache_ubuntu,
    'raspbian': do_clear_dns_cache_raspbian,
    'amazon_linux': do_clear_dns_cache_amazon_linux,
    'rhel': do_clear_dns_cache_amazon_linux,
    'fedora': do_clear_dns_cache_ubuntu,
    'linux': do_clear_dns_cache_ubuntu,
    'wsl': do_clear_dns_cache_ubuntu,
    'cmd': do_clear_dns_cache_cmd,
    'windows': do_clear_dns_cache_cmd,
    'powershell': do_clear_dns_cache_powershell,
    'gitbash': do_clear_dns_cache_gitbash
  };

  const handler = handlers[platform.type];
  if (!handler) {
    console.error(`Platform '${platform.type}' is not supported for this command.`);
    console.error('');
    console.error('Supported platforms:');
    console.error('  - macOS');
    console.error('  - Ubuntu, Debian, and other Linux distributions');
    console.error('  - Raspberry Pi OS');
    console.error('  - Amazon Linux and RHEL-based distributions');
    console.error('  - Windows (CMD, PowerShell, Git Bash)');
    process.exit(1);
  }

  await handler(args);
}

module.exports = {
  main: do_clear_dns_cache,
  do_clear_dns_cache,
  do_clear_dns_cache_nodejs,
  do_clear_dns_cache_macos,
  do_clear_dns_cache_ubuntu,
  do_clear_dns_cache_raspbian,
  do_clear_dns_cache_amazon_linux,
  do_clear_dns_cache_cmd,
  do_clear_dns_cache_powershell,
  do_clear_dns_cache_gitbash
};

if (require.main === module) {
  do_clear_dns_cache(process.argv.slice(2));
}
