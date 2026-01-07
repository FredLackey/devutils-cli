#!/usr/bin/env node

/**
 * certbot-init - Install SSL certificates using certbot for nginx
 *
 * Migrated from legacy dotfiles function.
 * Original:
 *   certbot-init() {
 *       # Install SSL certificates using certbot for nginx.
 *       # Usage: certbot-init -d example.com -e admin@example.com
 *       # Installs certbot if not present, then runs certbot --nginx
 *   }
 *
 * This script automates the process of obtaining and installing SSL certificates
 * from Let's Encrypt using certbot with nginx integration. It:
 * 1. Validates domain and email arguments
 * 2. Installs certbot if not already installed (using the appropriate package manager)
 * 3. Runs certbot to obtain and install SSL certificates for the specified domains
 * 4. Automatically configures nginx to use the certificates
 *
 * @module scripts/certbot-init
 */

const os = require('../utils/common/os');
const { execSync, spawnSync } = require('child_process');

/**
 * Display usage information and examples.
 * Shows all available options and how to use them correctly.
 */
function showUsage() {
  console.log(`certbot-init - Install SSL certificates using certbot for nginx

USAGE:
    certbot-init [OPTIONS]

OPTIONS:
    -d, --domain    Domain name for SSL certificate (can be used multiple times) (required)
    -e, --email     Email address for Let's Encrypt registration (required)
    -h, --help      Show this help message

EXAMPLES:
    certbot-init -d example.com -e admin@example.com
    certbot-init -d example.com -d www.example.com -e admin@example.com
    certbot-init -d api.example.com -d www.api.example.com -e webmaster@example.com

NOTE:
    This command will install certbot if not present and requires sudo access.
    It configures nginx to use the SSL certificates automatically.
    Certificates are valid for 90 days and can be renewed with 'certbot renew'.`);
}

/**
 * Parse command line arguments into structured options.
 * Handles -d/--domain (multiple allowed), -e/--email, and -h/--help flags.
 *
 * @param {string[]} args - Raw command line arguments
 * @returns {{ domains: string[], email: string, help: boolean, error: string|null }}
 */
function parseArgs(args) {
  const result = {
    domains: [],
    email: '',
    help: false,
    error: null
  };

  let i = 0;
  while (i < args.length) {
    const arg = args[i];

    if (arg === '-h' || arg === '--help') {
      result.help = true;
      return result;
    }

    if (arg === '-d' || arg === '--domain') {
      // Check if next argument exists and is not another flag
      if (i + 1 >= args.length || args[i + 1].startsWith('-')) {
        result.error = 'Domain value required after -d/--domain';
        return result;
      }
      result.domains.push(args[i + 1]);
      i += 2;
      continue;
    }

    if (arg === '-e' || arg === '--email') {
      // Check if next argument exists and is not another flag
      if (i + 1 >= args.length || args[i + 1].startsWith('-')) {
        result.error = 'Email value required after -e/--email';
        return result;
      }
      result.email = args[i + 1];
      i += 2;
      continue;
    }

    // Unknown option
    result.error = `Unknown option: ${arg}`;
    return result;
  }

  return result;
}

/**
 * Validate that an email address has a valid format.
 * Uses a basic regex that covers most common email formats.
 *
 * @param {string} email - The email address to validate
 * @returns {boolean} True if the email format is valid
 */
function isValidEmail(email) {
  // Basic email validation regex
  // Matches: user@domain.tld where tld is at least 2 characters
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Check if a command exists on the system.
 * Uses 'which' on Unix-like systems to locate executables.
 *
 * @param {string} cmd - The command name to check
 * @returns {boolean} True if the command exists in PATH
 */
function isCommandAvailable(cmd) {
  try {
    execSync(`which ${cmd}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if the current user has sudo access.
 * First tries passwordless sudo, then validates sudo credentials.
 *
 * @returns {boolean} True if sudo access is available
 */
function checkSudoAccess() {
  try {
    // Try passwordless sudo first
    execSync('sudo -n true', { stdio: 'ignore' });
    console.log('Using passwordless sudo');
    return true;
  } catch {
    // Fall back to regular sudo (will prompt for password if needed)
    console.log('Authenticating with sudo...');
    try {
      // sudo -v validates the user's credentials and extends the timeout
      const result = spawnSync('sudo', ['-v'], { stdio: 'inherit' });
      return result.status === 0;
    } catch {
      return false;
    }
  }
}

/**
 * Pure Node.js implementation - NOT APPLICABLE for this script.
 *
 * Certbot SSL certificate installation requires:
 * 1. System package manager to install certbot
 * 2. Root/sudo access to modify nginx configuration
 * 3. Network access to Let's Encrypt ACME servers
 * 4. certbot command-line tool interaction
 *
 * These operations cannot be done in pure Node.js and require
 * platform-specific shell commands.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 * @throws {Error} Always throws - this function should not be called directly
 */
async function do_certbot_init_nodejs(args) {
  throw new Error(
    'do_certbot_init_nodejs should not be called directly. ' +
    'SSL certificate installation requires OS-specific package managers and sudo access.'
  );
}

/**
 * Install certbot and SSL certificates on macOS using Homebrew.
 *
 * macOS requires:
 * - Homebrew for package management
 * - nginx to be installed and running
 * - certbot and certbot-nginx plugin
 *
 * Note: macOS is typically used for development, not production servers,
 * so SSL certificates are less commonly needed. However, for local HTTPS
 * development or Mac mini servers, this is supported.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_certbot_init_macos(args) {
  // Parse and validate arguments
  const options = parseArgs(args);

  if (options.help) {
    showUsage();
    return;
  }

  if (options.error) {
    console.error(`Error: ${options.error}`);
    showUsage();
    process.exit(1);
  }

  // Show usage if no arguments provided
  if (args.length === 0) {
    showUsage();
    return;
  }

  // Validate required arguments
  if (options.domains.length === 0) {
    console.error('Error: At least one domain is required (-d or --domain)');
    showUsage();
    process.exit(1);
  }

  if (!options.email) {
    console.error('Error: Email address is required (-e or --email)');
    showUsage();
    process.exit(1);
  }

  if (!isValidEmail(options.email)) {
    console.error(`Error: Invalid email format: ${options.email}`);
    process.exit(1);
  }

  // Check for Homebrew
  if (!isCommandAvailable('brew')) {
    console.error('Error: Homebrew is required but not installed.');
    console.error('Install it from: https://brew.sh');
    process.exit(1);
  }

  // Check sudo access
  console.log('This command requires sudo access to configure SSL certificates');
  if (!checkSudoAccess()) {
    console.error('Error: sudo authentication failed');
    process.exit(1);
  }

  // Install certbot if not present
  if (!isCommandAvailable('certbot')) {
    console.log('Installing certbot...');
    try {
      execSync('brew install certbot', { stdio: 'inherit' });
      console.log('Certbot installed successfully');
    } catch (error) {
      console.error('Failed to install certbot');
      process.exit(1);
    }
  } else {
    console.log('Certbot is already installed');
  }

  // Build domain arguments for certbot
  const domainArgs = options.domains.map(d => `-d ${d}`).join(' ');

  // Display what we're about to do
  console.log('');
  console.log('Requesting SSL certificate for:');
  console.log(`  Domains: ${options.domains.join(' ')}`);
  console.log(`  Email: ${options.email}`);
  console.log('');

  // Run certbot command
  console.log('Running certbot...');
  const certbotCmd = `sudo certbot --nginx --agree-tos --no-eff-email --email ${options.email} ${domainArgs}`;

  console.log(`Executing: ${certbotCmd}`);

  try {
    execSync(certbotCmd, { stdio: 'inherit' });
    console.log('');
    console.log('SSL certificate(s) installed successfully!');
    console.log('');
    console.log('Your nginx configuration has been automatically updated.');
    console.log('You can test your SSL configuration at: https://www.ssllabs.com/ssltest/');
    console.log('');
    console.log('To renew certificates automatically, consider adding this to your crontab:');
    console.log('0 12 * * * /usr/local/bin/certbot renew --quiet');
  } catch (error) {
    console.log('');
    console.error('Failed to install SSL certificate(s)');
    console.error('Please check the error messages above and try again');
    process.exit(1);
  }
}

/**
 * Install certbot and SSL certificates on Ubuntu using APT.
 *
 * Ubuntu/Debian is the most common platform for SSL certificate installation.
 * Uses apt to install certbot and the nginx plugin, then runs certbot
 * to obtain and configure the certificates.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_certbot_init_ubuntu(args) {
  // Parse and validate arguments
  const options = parseArgs(args);

  if (options.help) {
    showUsage();
    return;
  }

  if (options.error) {
    console.error(`Error: ${options.error}`);
    showUsage();
    process.exit(1);
  }

  // Show usage if no arguments provided
  if (args.length === 0) {
    showUsage();
    return;
  }

  // Validate required arguments
  if (options.domains.length === 0) {
    console.error('Error: At least one domain is required (-d or --domain)');
    showUsage();
    process.exit(1);
  }

  if (!options.email) {
    console.error('Error: Email address is required (-e or --email)');
    showUsage();
    process.exit(1);
  }

  if (!isValidEmail(options.email)) {
    console.error(`Error: Invalid email format: ${options.email}`);
    process.exit(1);
  }

  // Check sudo access
  console.log('This command requires sudo access to install certbot and configure SSL');
  if (!checkSudoAccess()) {
    console.error('Error: sudo authentication failed');
    process.exit(1);
  }

  // Install certbot if not present
  if (!isCommandAvailable('certbot')) {
    console.log('Installing certbot...');
    try {
      execSync('sudo apt update', { stdio: 'inherit' });
      execSync('sudo apt install -y certbot python3-certbot-nginx', { stdio: 'inherit' });
      console.log('Certbot installed successfully');
    } catch (error) {
      console.error('Failed to install certbot');
      process.exit(1);
    }
  } else {
    console.log('Certbot is already installed');
  }

  // Build domain arguments for certbot
  const domainArgs = options.domains.map(d => `-d ${d}`).join(' ');

  // Display what we're about to do
  console.log('');
  console.log('Requesting SSL certificate for:');
  console.log(`  Domains: ${options.domains.join(' ')}`);
  console.log(`  Email: ${options.email}`);
  console.log('');

  // Run certbot command
  console.log('Running certbot...');
  const certbotCmd = `sudo certbot --nginx --agree-tos --no-eff-email --email ${options.email} ${domainArgs}`;

  console.log(`Executing: ${certbotCmd}`);

  try {
    execSync(certbotCmd, { stdio: 'inherit' });
    console.log('');
    console.log('SSL certificate(s) installed successfully!');
    console.log('');
    console.log('Your nginx configuration has been automatically updated.');
    console.log('You can test your SSL configuration at: https://www.ssllabs.com/ssltest/');
    console.log('');
    console.log('To renew certificates automatically, consider adding this to your crontab:');
    console.log('0 12 * * * /usr/bin/certbot renew --quiet');
  } catch (error) {
    console.log('');
    console.error('Failed to install SSL certificate(s)');
    console.error('Please check the error messages above and try again');
    process.exit(1);
  }
}

/**
 * Install certbot and SSL certificates on Raspberry Pi OS.
 *
 * Raspberry Pi OS is Debian-based, so it uses apt for package management.
 * The process is identical to Ubuntu.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_certbot_init_raspbian(args) {
  // Raspberry Pi OS uses the same package manager as Ubuntu (apt)
  // The certbot installation process is identical
  return do_certbot_init_ubuntu(args);
}

/**
 * Install certbot and SSL certificates on Amazon Linux.
 *
 * Amazon Linux uses dnf (newer versions) or yum (older versions) for
 * package management. The script detects which is available and uses
 * the appropriate one.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_certbot_init_amazon_linux(args) {
  // Parse and validate arguments
  const options = parseArgs(args);

  if (options.help) {
    showUsage();
    return;
  }

  if (options.error) {
    console.error(`Error: ${options.error}`);
    showUsage();
    process.exit(1);
  }

  // Show usage if no arguments provided
  if (args.length === 0) {
    showUsage();
    return;
  }

  // Validate required arguments
  if (options.domains.length === 0) {
    console.error('Error: At least one domain is required (-d or --domain)');
    showUsage();
    process.exit(1);
  }

  if (!options.email) {
    console.error('Error: Email address is required (-e or --email)');
    showUsage();
    process.exit(1);
  }

  if (!isValidEmail(options.email)) {
    console.error(`Error: Invalid email format: ${options.email}`);
    process.exit(1);
  }

  // Check sudo access
  console.log('This command requires sudo access to install certbot and configure SSL');
  if (!checkSudoAccess()) {
    console.error('Error: sudo authentication failed');
    process.exit(1);
  }

  // Install certbot if not present
  if (!isCommandAvailable('certbot')) {
    console.log('Installing certbot...');

    // Detect package manager (dnf or yum)
    const useDnf = isCommandAvailable('dnf');
    const packageManager = useDnf ? 'dnf' : 'yum';

    try {
      execSync(`sudo ${packageManager} install -y certbot python3-certbot-nginx`, { stdio: 'inherit' });
      console.log('Certbot installed successfully');
    } catch (error) {
      console.error('Failed to install certbot');
      console.error(`Package manager used: ${packageManager}`);
      process.exit(1);
    }
  } else {
    console.log('Certbot is already installed');
  }

  // Build domain arguments for certbot
  const domainArgs = options.domains.map(d => `-d ${d}`).join(' ');

  // Display what we're about to do
  console.log('');
  console.log('Requesting SSL certificate for:');
  console.log(`  Domains: ${options.domains.join(' ')}`);
  console.log(`  Email: ${options.email}`);
  console.log('');

  // Run certbot command
  console.log('Running certbot...');
  const certbotCmd = `sudo certbot --nginx --agree-tos --no-eff-email --email ${options.email} ${domainArgs}`;

  console.log(`Executing: ${certbotCmd}`);

  try {
    execSync(certbotCmd, { stdio: 'inherit' });
    console.log('');
    console.log('SSL certificate(s) installed successfully!');
    console.log('');
    console.log('Your nginx configuration has been automatically updated.');
    console.log('You can test your SSL configuration at: https://www.ssllabs.com/ssltest/');
    console.log('');
    console.log('To renew certificates automatically, consider adding this to your crontab:');
    console.log('0 12 * * * /usr/bin/certbot renew --quiet');
  } catch (error) {
    console.log('');
    console.error('Failed to install SSL certificate(s)');
    console.error('Please check the error messages above and try again');
    process.exit(1);
  }
}

/**
 * SSL certificate installation on Windows Command Prompt.
 *
 * Windows is not a typical platform for running nginx web servers with
 * Let's Encrypt certificates. This command is designed for Linux servers.
 *
 * For Windows development environments, consider using:
 * - WSL (Windows Subsystem for Linux) for a Linux-like environment
 * - Local development certificates with mkcert
 * - IIS with Windows ACME clients
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_certbot_init_cmd(args) {
  console.log('certbot-init is not supported on Windows.');
  console.log('');
  console.log('This command is designed for Linux servers running nginx.');
  console.log('');
  console.log('For Windows environments, consider:');
  console.log('  - Using WSL (Windows Subsystem for Linux) for a Linux-like experience');
  console.log('  - Using mkcert for local development certificates');
  console.log('  - Using IIS with win-acme for Windows server SSL');
  console.log('');
  console.log('To use certbot in WSL:');
  console.log('  1. Open WSL terminal');
  console.log('  2. Run: certbot-init -d example.com -e admin@example.com');
  process.exit(1);
}

/**
 * SSL certificate installation on Windows PowerShell.
 *
 * Same limitations as CMD - Windows is not the target platform for this tool.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_certbot_init_powershell(args) {
  // Same behavior as CMD - redirect to appropriate Windows solutions
  return do_certbot_init_cmd(args);
}

/**
 * SSL certificate installation from Git Bash on Windows.
 *
 * Git Bash runs on Windows, so it has the same limitations as CMD.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_certbot_init_gitbash(args) {
  // Same behavior as CMD - redirect to appropriate Windows solutions
  return do_certbot_init_cmd(args);
}

/**
 * Main entry point - detects environment and executes appropriate implementation.
 *
 * The certbot-init command automates SSL certificate installation using Let's Encrypt.
 * It handles:
 * - Installing certbot if not present
 * - Validating domain names and email addresses
 * - Running certbot with nginx integration
 * - Configuring automatic HTTPS in nginx
 *
 * This command requires:
 * - A Linux-based server (macOS supported but less common)
 * - nginx installed and running
 * - sudo access for certificate installation
 * - Domains pointing to the server (for ACME verification)
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_certbot_init(args) {
  const platform = os.detect();

  const handlers = {
    'macos': do_certbot_init_macos,
    'ubuntu': do_certbot_init_ubuntu,
    'debian': do_certbot_init_ubuntu,
    'raspbian': do_certbot_init_raspbian,
    'amazon_linux': do_certbot_init_amazon_linux,
    'rhel': do_certbot_init_amazon_linux,
    'fedora': do_certbot_init_amazon_linux,
    'linux': do_certbot_init_ubuntu,
    'wsl': do_certbot_init_ubuntu,
    'cmd': do_certbot_init_cmd,
    'windows': do_certbot_init_cmd,
    'powershell': do_certbot_init_powershell,
    'gitbash': do_certbot_init_gitbash
  };

  const handler = handlers[platform.type];
  if (!handler) {
    console.error(`Platform '${platform.type}' is not supported for this command.`);
    console.error('');
    console.error('Supported platforms:');
    console.error('  - macOS (with Homebrew)');
    console.error('  - Ubuntu, Debian (with APT)');
    console.error('  - Raspberry Pi OS (with APT)');
    console.error('  - Amazon Linux, RHEL, Fedora (with DNF/YUM)');
    console.error('');
    console.error('Windows is not supported - use WSL for a Linux environment.');
    process.exit(1);
  }

  await handler(args);
}

module.exports = {
  main: do_certbot_init,
  do_certbot_init,
  do_certbot_init_nodejs,
  do_certbot_init_macos,
  do_certbot_init_ubuntu,
  do_certbot_init_raspbian,
  do_certbot_init_amazon_linux,
  do_certbot_init_cmd,
  do_certbot_init_powershell,
  do_certbot_init_gitbash
};

if (require.main === module) {
  do_certbot_init(process.argv.slice(2));
}
