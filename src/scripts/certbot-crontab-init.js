#!/usr/bin/env node

/**
 * certbot-crontab-init - Add certbot renewal cron job for automatic SSL certificate renewal
 *
 * Migrated from legacy dotfiles function.
 * Original:
 *   certbot-crontab-init() {
 *     local cron_line="0 12 * * * /usr/bin/certbot renew --quiet"
 *     local temp_crontab
 *     local cron_service=""
 *
 *     # Determine cron service name based on OS
 *     if [[ -f /etc/debian_version ]]; then
 *       cron_service="cron"
 *     elif [[ -f /etc/redhat-release ]]; then
 *       cron_service="crond"
 *     else
 *       cron_service="cron"
 *     fi
 *
 *     # Check if cron service is running, start/enable if not
 *     # Check if certbot renewal line already exists
 *     # Add the cron line if not present
 *   }
 *
 * This script sets up automatic SSL certificate renewal using certbot.
 * SSL certificates from Let's Encrypt expire every 90 days, so automatic
 * renewal is essential for maintaining valid HTTPS on your servers.
 *
 * The cron job runs daily at 12:00 PM and quietly renews any certificates
 * that are within 30 days of expiration.
 *
 * @module scripts/certbot-crontab-init
 */

const os = require('../utils/common/os');
const { execSync, spawnSync } = require('child_process');
const fs = require('fs');

// The cron line to add - runs daily at noon, quietly renews certificates
const CRON_LINE = '0 12 * * * /usr/bin/certbot renew --quiet';

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
 * Helper function to run a command and return success/failure.
 *
 * @param {string} cmd - The command to execute
 * @param {object} options - Options to pass to execSync
 * @returns {boolean} True if command succeeded, false otherwise
 */
function runCommand(cmd, options = {}) {
  try {
    execSync(cmd, { stdio: 'pipe', ...options });
    return true;
  } catch {
    return false;
  }
}

/**
 * Helper function to run a command and return its output.
 *
 * @param {string} cmd - The command to execute
 * @returns {{ success: boolean, output: string }} Result object with success flag and output
 */
function runCommandWithOutput(cmd) {
  try {
    const output = execSync(cmd, { stdio: 'pipe', encoding: 'utf8' });
    return { success: true, output: output.trim() };
  } catch (error) {
    return { success: false, output: '' };
  }
}

/**
 * Pure Node.js implementation - NOT FULLY APPLICABLE for this script.
 *
 * Cron job management requires OS-level tools:
 * - Linux: crontab command and systemd/init for service management
 * - macOS: launchd for scheduled tasks (different approach entirely)
 * - Windows: Task Scheduler (completely different paradigm)
 *
 * However, some validation and checks can be done in pure Node.js.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 * @throws {Error} Always throws - this function should not be called directly
 */
async function do_certbot_crontab_init_nodejs(args) {
  // Cron management is inherently platform-specific.
  // Linux uses crontab, macOS uses launchd, Windows uses Task Scheduler.
  throw new Error(
    'do_certbot_crontab_init_nodejs should not be called directly. ' +
    'Cron/scheduled task management requires OS-specific tools.'
  );
}

/**
 * Add certbot renewal cron job on macOS.
 *
 * macOS uses launchd instead of cron for scheduled tasks. While cron is available
 * on macOS, launchd is the preferred and more reliable mechanism. This function
 * creates a launchd plist file for certbot renewal.
 *
 * Alternatively, if certbot was installed via Homebrew, it may already have
 * set up automatic renewal.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_certbot_crontab_init_macos(args) {
  // Check if certbot is installed
  if (!isCommandAvailable('certbot')) {
    console.error('Error: certbot is not installed.');
    console.error('Install it with: brew install certbot');
    process.exit(1);
  }

  console.log('Setting up certbot automatic renewal on macOS...');
  console.log('');

  // On macOS, we can use either cron or launchd
  // Cron is simpler and works similarly to Linux, so we'll use that
  // for consistency with the original function

  // Check if cron entry already exists
  const { success: hasCrontab, output: currentCrontab } = runCommandWithOutput('crontab -l');

  if (hasCrontab && currentCrontab.includes('/usr/local/bin/certbot renew') ||
      hasCrontab && currentCrontab.includes('certbot renew')) {
    console.log('Certbot renewal cron job already exists.');
    console.log('');
    console.log('Current crontab entries containing "certbot":');
    const certbotLines = currentCrontab.split('\n').filter(line => line.includes('certbot'));
    certbotLines.forEach(line => console.log(`  ${line}`));
    return;
  }

  // macOS certbot is typically installed via Homebrew at /usr/local/bin or /opt/homebrew/bin
  let certbotPath = '/usr/local/bin/certbot';
  if (!fs.existsSync(certbotPath)) {
    certbotPath = '/opt/homebrew/bin/certbot';
  }
  if (!fs.existsSync(certbotPath)) {
    // Fall back to whichever certbot is in PATH
    const whichResult = runCommandWithOutput('which certbot');
    if (whichResult.success) {
      certbotPath = whichResult.output;
    }
  }

  const macosCronLine = `0 12 * * * ${certbotPath} renew --quiet`;

  console.log('Adding certbot renewal cron job...');

  // Add to crontab
  const newCrontab = hasCrontab && currentCrontab
    ? `${currentCrontab}\n${macosCronLine}`
    : macosCronLine;

  try {
    // Write new crontab via pipe
    const result = spawnSync('crontab', ['-'], {
      input: newCrontab + '\n',
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });

    if (result.status !== 0) {
      throw new Error(result.stderr || 'Failed to update crontab');
    }

    console.log('Certbot renewal cron job added successfully!');
    console.log(`Added: ${macosCronLine}`);
    console.log('');
    console.log('This will automatically renew SSL certificates daily at 12:00 PM.');
    console.log('You can view your current crontab with: crontab -l');
  } catch (error) {
    console.error('Failed to add certbot renewal cron job.');
    console.error(error.message);
    process.exit(1);
  }
}

/**
 * Add certbot renewal cron job on Ubuntu.
 *
 * Ubuntu uses the "cron" service name and apt package manager.
 * This function:
 * 1. Checks if the cron service is running, starts/enables it if not
 * 2. Checks if the certbot renewal cron entry already exists
 * 3. Adds the cron entry if not present
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_certbot_crontab_init_ubuntu(args) {
  await setupCronJobLinux('cron');
}

/**
 * Add certbot renewal cron job on Raspberry Pi OS.
 *
 * Raspberry Pi OS is Debian-based, so it uses the same "cron" service name
 * as Ubuntu/Debian.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_certbot_crontab_init_raspbian(args) {
  await setupCronJobLinux('cron');
}

/**
 * Add certbot renewal cron job on Amazon Linux.
 *
 * Amazon Linux is RHEL-based and uses "crond" as the service name.
 * Uses dnf or yum for package management.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_certbot_crontab_init_amazon_linux(args) {
  await setupCronJobLinux('crond');
}

/**
 * Common Linux implementation for setting up the certbot cron job.
 * Handles both Debian-based (cron) and RHEL-based (crond) systems.
 *
 * @param {string} cronServiceName - The name of the cron service ('cron' or 'crond')
 * @returns {Promise<void>}
 */
async function setupCronJobLinux(cronServiceName) {
  // Check if certbot is installed
  if (!isCommandAvailable('certbot')) {
    console.error('Error: certbot is not installed.');
    console.error('');
    if (cronServiceName === 'cron') {
      console.error('Install it with: sudo apt install certbot python3-certbot-nginx');
    } else {
      console.error('Install it with: sudo dnf install certbot python3-certbot-nginx');
      console.error('            or: sudo yum install certbot python3-certbot-nginx');
    }
    process.exit(1);
  }

  // Check if crontab command is available
  if (!isCommandAvailable('crontab')) {
    console.error('Error: crontab command not found.');
    console.error('');
    if (cronServiceName === 'cron') {
      console.error('Install it with: sudo apt install cron');
    } else {
      console.error('Install it with: sudo dnf install cronie');
      console.error('            or: sudo yum install cronie');
    }
    process.exit(1);
  }

  // Check if systemctl is available (for service management)
  const hasSystemctl = isCommandAvailable('systemctl');

  console.log('Checking cron service status...');

  // Check if cron service is running
  let cronRunning = false;
  if (hasSystemctl) {
    cronRunning = runCommand(`systemctl is-active --quiet ${cronServiceName}`);
  }

  if (!cronRunning && hasSystemctl) {
    console.log(`Cron service (${cronServiceName}) is not running.`);
    console.log('Attempting to start and enable cron service...');
    console.log('');
    console.log('This requires sudo access to manage the cron service.');

    // Try to start the cron service
    const startCmd = `sudo systemctl start ${cronServiceName}`;
    const enableCmd = `sudo systemctl enable ${cronServiceName}`;

    if (runCommand(startCmd, { stdio: 'inherit' }) &&
        runCommand(enableCmd, { stdio: 'inherit' })) {
      console.log('Cron service started and enabled successfully.');
    } else {
      console.error('Failed to start cron service.');
      console.error(`Please start the cron service manually: sudo systemctl start ${cronServiceName}`);
      process.exit(1);
    }
  } else if (hasSystemctl) {
    console.log(`Cron service (${cronServiceName}) is running.`);
  } else {
    console.log('Note: systemctl not available. Assuming cron is managed differently on this system.');
  }

  console.log('');
  console.log('Checking for existing certbot renewal cron job...');

  // Get current crontab
  const { success: hasCrontab, output: currentCrontab } = runCommandWithOutput('crontab -l 2>/dev/null');

  // Check if the certbot renewal line already exists
  if (hasCrontab && currentCrontab.includes('/usr/bin/certbot renew --quiet')) {
    console.log('Certbot renewal cron job already exists.');
    console.log('');
    console.log('Current crontab entries containing "certbot":');
    const certbotLines = currentCrontab.split('\n').filter(line => line.includes('certbot'));
    certbotLines.forEach(line => console.log(`  ${line}`));
    return;
  }

  console.log('Adding certbot renewal cron job...');

  // Build new crontab content
  const newCrontab = hasCrontab && currentCrontab
    ? `${currentCrontab}\n${CRON_LINE}`
    : CRON_LINE;

  try {
    // Write new crontab via pipe to crontab -
    const result = spawnSync('crontab', ['-'], {
      input: newCrontab + '\n',
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });

    if (result.status !== 0) {
      throw new Error(result.stderr || 'Failed to update crontab');
    }

    console.log('');
    console.log('Certbot renewal cron job added successfully!');
    console.log(`Added: ${CRON_LINE}`);
    console.log('');
    console.log('This will automatically renew SSL certificates daily at 12:00 PM.');
    console.log('You can view your current crontab with: crontab -l');
  } catch (error) {
    console.error('Failed to add certbot renewal cron job.');
    console.error(error.message);
    process.exit(1);
  }
}

/**
 * Add certbot renewal scheduled task on Windows Command Prompt.
 *
 * Windows uses Task Scheduler instead of cron. However, certbot on Windows
 * typically sets up its own scheduled task during installation.
 *
 * This script is primarily designed for Linux servers where certbot is commonly
 * used with nginx. Windows is not a typical deployment target for this use case.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_certbot_crontab_init_cmd(args) {
  console.log('certbot-crontab-init is designed for Linux servers.');
  console.log('');
  console.log('Windows uses Task Scheduler instead of cron.');
  console.log('If you installed certbot on Windows, it should have');
  console.log('automatically set up a scheduled task for renewal.');
  console.log('');
  console.log('To check your scheduled tasks:');
  console.log('  schtasks /query /tn "Certbot Renew Task"');
  console.log('');
  console.log('To manually create a renewal task:');
  console.log('  schtasks /create /tn "Certbot Renew" /tr "certbot renew" /sc daily /st 12:00');
}

/**
 * Add certbot renewal scheduled task on Windows PowerShell.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_certbot_crontab_init_powershell(args) {
  console.log('certbot-crontab-init is designed for Linux servers.');
  console.log('');
  console.log('Windows uses Task Scheduler instead of cron.');
  console.log('If you installed certbot on Windows, it should have');
  console.log('automatically set up a scheduled task for renewal.');
  console.log('');
  console.log('To check your scheduled tasks in PowerShell:');
  console.log('  Get-ScheduledTask -TaskName "*Certbot*"');
  console.log('');
  console.log('To manually create a renewal task:');
  console.log('  $action = New-ScheduledTaskAction -Execute "certbot" -Argument "renew"');
  console.log('  $trigger = New-ScheduledTaskTrigger -Daily -At 12:00PM');
  console.log('  Register-ScheduledTask -Action $action -Trigger $trigger -TaskName "Certbot Renew"');
}

/**
 * Add certbot renewal cron job from Git Bash on Windows.
 *
 * Git Bash runs on Windows, which doesn't have a native cron.
 * This provides guidance on using Windows Task Scheduler instead.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_certbot_crontab_init_gitbash(args) {
  console.log('certbot-crontab-init is designed for Linux servers.');
  console.log('');
  console.log('Git Bash runs on Windows, which uses Task Scheduler instead of cron.');
  console.log('If you installed certbot on Windows, it should have');
  console.log('automatically set up a scheduled task for renewal.');
  console.log('');
  console.log('To check your scheduled tasks:');
  console.log('  schtasks.exe /query /tn "Certbot Renew Task"');
  console.log('');
  console.log('To manually create a renewal task:');
  console.log('  schtasks.exe /create /tn "Certbot Renew" /tr "certbot renew" /sc daily /st 12:00');
}

/**
 * Main entry point - detects environment and executes appropriate implementation.
 *
 * This script sets up automatic SSL certificate renewal using certbot.
 * It creates a cron job (or equivalent scheduled task) that runs daily
 * at 12:00 PM to renew any SSL certificates that are nearing expiration.
 *
 * SSL certificates from Let's Encrypt expire every 90 days. Certbot only
 * renews certificates that are within 30 days of expiration, so running
 * daily is safe and ensures certificates are always renewed in time.
 *
 * The script is idempotent - running it multiple times will not create
 * duplicate cron entries.
 *
 * @param {string[]} args - Command line arguments (unused)
 * @returns {Promise<void>}
 */
async function do_certbot_crontab_init(args) {
  const platform = os.detect();

  const handlers = {
    'macos': do_certbot_crontab_init_macos,
    'ubuntu': do_certbot_crontab_init_ubuntu,
    'debian': do_certbot_crontab_init_ubuntu,
    'raspbian': do_certbot_crontab_init_raspbian,
    'amazon_linux': do_certbot_crontab_init_amazon_linux,
    'rhel': do_certbot_crontab_init_amazon_linux,
    'fedora': do_certbot_crontab_init_ubuntu,  // Fedora uses 'crond' but same approach
    'linux': do_certbot_crontab_init_ubuntu,
    'wsl': do_certbot_crontab_init_ubuntu,
    'cmd': do_certbot_crontab_init_cmd,
    'windows': do_certbot_crontab_init_cmd,
    'powershell': do_certbot_crontab_init_powershell,
    'gitbash': do_certbot_crontab_init_gitbash
  };

  // Fedora uses 'crond' like RHEL-based systems
  if (platform.type === 'fedora') {
    await setupCronJobLinux('crond');
    return;
  }

  const handler = handlers[platform.type];
  if (!handler) {
    console.error(`Platform '${platform.type}' is not supported for this command.`);
    console.error('');
    console.error('This script is designed for Linux servers running nginx with certbot.');
    console.error('Supported platforms:');
    console.error('  - Ubuntu, Debian, and other Debian-based distributions');
    console.error('  - Amazon Linux, RHEL, Fedora, and other RHEL-based distributions');
    console.error('  - Raspberry Pi OS');
    console.error('  - macOS (limited support)');
    process.exit(1);
  }

  await handler(args);
}

module.exports = {
  main: do_certbot_crontab_init,
  do_certbot_crontab_init,
  do_certbot_crontab_init_nodejs,
  do_certbot_crontab_init_macos,
  do_certbot_crontab_init_ubuntu,
  do_certbot_crontab_init_raspbian,
  do_certbot_crontab_init_amazon_linux,
  do_certbot_crontab_init_cmd,
  do_certbot_crontab_init_powershell,
  do_certbot_crontab_init_gitbash
};

if (require.main === module) {
  do_certbot_crontab_init(process.argv.slice(2));
}
