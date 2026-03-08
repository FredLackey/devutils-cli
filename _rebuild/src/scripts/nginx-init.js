#!/usr/bin/env node

/**
 * nginx-init - Create nginx configuration from template
 *
 * Migrated from legacy dotfiles function.
 * Original:
 *   nginx-init() {
 *       # Initialize nginx configuration from template files.
 *       # Usage: nginx-init -d example.com -h http://127.0.0.1:3000 -f example.conf
 *       # Copies template, replaces %DOMAINS% and %HOST_URL% tokens,
 *       # writes to /etc/nginx/sites-available, optionally creates symlink
 *   }
 *
 * This script creates nginx site configuration files from templates,
 * replacing placeholder tokens with actual domain names and upstream URLs.
 * It supports:
 * - Multiple domains per configuration (-d can be used multiple times)
 * - Standard and API templates (with CORS preflight handling)
 * - Automatic symlink creation in sites-enabled
 *
 * @module scripts/nginx-init
 */

const os = require('../utils/common/os');
const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');

// Define the nginx template content directly in the script
// This ensures the script works regardless of where it's installed

/**
 * Standard nginx template for proxying requests to a backend service.
 * Uses %DOMAINS% and %HOST_URL% as placeholder tokens.
 */
const TEMPLATE_STANDARD = `server {

    server_name %DOMAINS%;
    listen 80;

    # Allow GET requests to root path
    location / {
        proxy_pass %HOST_URL%;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

}
`;

/**
 * API nginx template with CORS preflight handling.
 * Includes OPTIONS request handling for cross-origin API requests.
 * Uses %DOMAINS% and %HOST_URL% as placeholder tokens.
 */
const TEMPLATE_API = `server {

    server_name %DOMAINS%;
    listen 80;

    # Allow GET requests to root path
    location / {
        proxy_pass %HOST_URL%;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Preflight CORS requests
        if ($request_method = OPTIONS ) {
            add_header Access-Control-Allow-Origin *;
            add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
            add_header Access-Control-Allow-Headers "Content-Type";
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 204;
        }
    }

}
`;

/**
 * Display usage information and examples.
 * Shows all available options and how to use them correctly.
 */
function showUsage() {
  console.log(`nginx-init - Create nginx configuration from template

USAGE:
    nginx-init [OPTIONS]

OPTIONS:
    -a, --api       Use API template with CORS preflight handling
    -d, --domain    Domain name for server_name directive (can be used multiple times) (required)
    -h, --host      Upstream URL for proxy_pass directive (required)
    -f, --file      Output filename in /etc/nginx/sites-available (must end with .conf) (required)
    -l, --link      Create symbolic link in /etc/nginx/sites-enabled
    --help          Show this help message

EXAMPLES:
    nginx-init -d example.com -h http://127.0.0.1:3000 -f example.conf
    nginx-init -d example.com -d www.example.com -h http://127.0.0.1:3000 -f example.conf
    nginx-init --api -d api.example.com -h http://127.0.0.1:8080 -f api.conf --link

NOTE:
    This command requires sudo access to write to /etc/nginx/
    The output file will be created in /etc/nginx/sites-available/
    Use --link to also create a symlink in /etc/nginx/sites-enabled/`);
}

/**
 * Parse command line arguments into structured options.
 * Handles -a/--api, -d/--domain (multiple allowed), -h/--host, -f/--file, -l/--link flags.
 *
 * @param {string[]} args - Raw command line arguments
 * @returns {{ useApi: boolean, domains: string[], host: string, filename: string, createLink: boolean, help: boolean, error: string|null }}
 */
function parseArgs(args) {
  const result = {
    useApi: false,
    domains: [],
    host: '',
    filename: '',
    createLink: false,
    help: false,
    error: null
  };

  let i = 0;
  while (i < args.length) {
    const arg = args[i];

    if (arg === '--help') {
      result.help = true;
      return result;
    }

    if (arg === '-a' || arg === '--api') {
      result.useApi = true;
      i += 1;
      continue;
    }

    if (arg === '-l' || arg === '--link') {
      result.createLink = true;
      i += 1;
      continue;
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

    if (arg === '-h' || arg === '--host') {
      // Check if next argument exists and is not another flag
      if (i + 1 >= args.length || args[i + 1].startsWith('-')) {
        result.error = 'Host URL value required after -h/--host';
        return result;
      }
      result.host = args[i + 1];
      i += 2;
      continue;
    }

    if (arg === '-f' || arg === '--file') {
      // Check if next argument exists and is not another flag
      if (i + 1 >= args.length || args[i + 1].startsWith('-')) {
        result.error = 'Filename value required after -f/--file';
        return result;
      }
      result.filename = args[i + 1];
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
 * Check if a command exists on the system.
 * Uses 'which' on Unix-like systems to locate executables.
 *
 * @param {string} cmd - The command name to check
 * @returns {boolean} True if the command exists in PATH
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
 * Writing to /etc/nginx/ requires sudo access which cannot be done
 * in pure Node.js. Each platform function handles the sudo elevation
 * using OS-specific commands.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 * @throws {Error} Always throws - this function should not be called directly
 */
async function do_nginx_init_nodejs(args) {
  throw new Error(
    'do_nginx_init_nodejs should not be called directly. ' +
    'Writing to /etc/nginx/ requires sudo access which is OS-specific.'
  );
}

/**
 * Core implementation for creating nginx configuration.
 * This function contains the shared logic for all Unix-like platforms.
 * It handles argument parsing, validation, template processing, and file writing.
 *
 * @param {string[]} args - Command line arguments
 * @param {string} sitesAvailable - Path to nginx sites-available directory
 * @param {string} sitesEnabled - Path to nginx sites-enabled directory
 * @returns {Promise<void>}
 */
async function createNginxConfig(args, sitesAvailable, sitesEnabled) {
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

  if (!options.host) {
    console.error('Error: Host URL is required (-h or --host)');
    showUsage();
    process.exit(1);
  }

  if (!options.filename) {
    console.error('Error: Filename is required (-f or --file)');
    showUsage();
    process.exit(1);
  }

  // Validate filename ends with .conf
  if (!options.filename.endsWith('.conf')) {
    console.error('Error: Filename must end with .conf');
    process.exit(1);
  }

  // Check if sites-available directory exists
  if (!fs.existsSync(sitesAvailable)) {
    console.error(`Error: Directory ${sitesAvailable} does not exist`);
    console.error('');
    console.error('Make sure nginx is installed:');
    console.error('  Ubuntu/Debian: sudo apt install nginx');
    console.error('  macOS:         brew install nginx');
    console.error('  Amazon Linux:  sudo dnf install nginx');
    process.exit(1);
  }

  // Check sudo access
  console.log('This command requires sudo access to write to /etc/nginx/');
  if (!checkSudoAccess()) {
    console.error('Error: sudo authentication failed');
    process.exit(1);
  }

  // Select template
  const templateContent = options.useApi ? TEMPLATE_API : TEMPLATE_STANDARD;
  const templateName = options.useApi ? 'API template (with CORS)' : 'Standard template';

  // Join domains into a single string for server_name directive
  const domainString = options.domains.join(' ');

  // Perform token replacement
  const configContent = templateContent
    .replace(/%DOMAINS%/g, domainString)
    .replace(/%HOST_URL%/g, options.host);

  // Create output file path
  const outputFile = path.join(sitesAvailable, options.filename);

  // Check if output file already exists
  if (fs.existsSync(outputFile)) {
    console.log(`Warning: File ${outputFile} already exists and will be overwritten`);
  }

  // Display what we're about to do
  console.log('');
  console.log('Creating nginx configuration...');
  console.log(`  Template: ${templateName}`);
  console.log(`  Domains:  ${domainString}`);
  console.log(`  Host:     ${options.host}`);
  console.log(`  Output:   ${outputFile}`);
  console.log('');

  // Write configuration file using sudo tee
  // We use a temporary file and sudo mv because direct sudo write is tricky in Node.js
  try {
    // Create a temporary file with the config content
    const tmpFile = path.join('/tmp', `nginx-config-${Date.now()}.conf`);
    fs.writeFileSync(tmpFile, configContent, 'utf8');

    // Use sudo to copy the file to the destination
    execSync(`sudo cp "${tmpFile}" "${outputFile}"`, { stdio: 'inherit' });

    // Clean up temporary file
    fs.unlinkSync(tmpFile);

    console.log('Configuration file created successfully');
  } catch (error) {
    console.error('Failed to create configuration file');
    console.error(error.message);
    process.exit(1);
  }

  // Create symbolic link if requested
  if (options.createLink) {
    // Check if sites-enabled directory exists
    if (!fs.existsSync(sitesEnabled)) {
      console.error(`Error: Directory ${sitesEnabled} does not exist`);
      process.exit(1);
    }

    const linkPath = path.join(sitesEnabled, options.filename);

    // Remove existing link if it exists
    try {
      const linkStats = fs.lstatSync(linkPath);
      if (linkStats.isSymbolicLink()) {
        execSync(`sudo rm "${linkPath}"`, { stdio: 'inherit' });
        console.log('Removed existing symbolic link');
      }
    } catch {
      // Link doesn't exist, which is fine
    }

    // Create new symbolic link
    try {
      execSync(`sudo ln -s "${outputFile}" "${linkPath}"`, { stdio: 'inherit' });
      console.log(`Symbolic link created: ${linkPath}`);
    } catch (error) {
      console.error('Failed to create symbolic link');
      console.error(error.message);
      process.exit(1);
    }
  }

  console.log('');
  console.log('Done!');
  console.log('');
  console.log('Next steps:');
  console.log('  1. Test nginx configuration: sudo nginx -t');
  console.log('  2. Reload nginx:             sudo systemctl reload nginx');
  if (!options.createLink) {
    console.log(`  3. Enable site (if not using --link): sudo ln -s ${outputFile} ${sitesEnabled}/${options.filename}`);
  }
  console.log('  4. Set up SSL (optional):    certbot-init -d ' + options.domains[0] + ' -e admin@' + options.domains[0]);
}

/**
 * Create nginx configuration on macOS.
 *
 * macOS with Homebrew installs nginx to different paths than Linux.
 * The sites-available and sites-enabled directories may need to be created
 * or the configuration may go directly into /usr/local/etc/nginx/servers/.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_nginx_init_macos(args) {
  // Check for help flag first (before nginx check)
  const options = parseArgs(args);
  if (options.help || args.length === 0) {
    showUsage();
    return;
  }

  // Check if nginx is installed
  if (!isCommandAvailable('nginx')) {
    console.error('Error: nginx is not installed.');
    console.error('Install it with: brew install nginx');
    process.exit(1);
  }

  // macOS Homebrew nginx paths
  // Modern Homebrew (Apple Silicon): /opt/homebrew/etc/nginx/
  // Older Homebrew (Intel):          /usr/local/etc/nginx/
  let nginxBase = '/usr/local/etc/nginx';
  if (fs.existsSync('/opt/homebrew/etc/nginx')) {
    nginxBase = '/opt/homebrew/etc/nginx';
  }

  // Homebrew nginx uses 'servers' directory instead of sites-available/sites-enabled
  // But we can create the standard directories for compatibility
  const sitesAvailable = path.join(nginxBase, 'sites-available');
  const sitesEnabled = path.join(nginxBase, 'sites-enabled');

  // Create directories if they don't exist
  if (!fs.existsSync(sitesAvailable)) {
    console.log(`Creating ${sitesAvailable} directory...`);
    try {
      execSync(`sudo mkdir -p "${sitesAvailable}"`, { stdio: 'inherit' });
    } catch (error) {
      console.error(`Failed to create ${sitesAvailable}`);
      process.exit(1);
    }
  }

  if (!fs.existsSync(sitesEnabled)) {
    console.log(`Creating ${sitesEnabled} directory...`);
    try {
      execSync(`sudo mkdir -p "${sitesEnabled}"`, { stdio: 'inherit' });
    } catch (error) {
      console.error(`Failed to create ${sitesEnabled}`);
      process.exit(1);
    }
  }

  console.log('');
  console.log('Note: macOS nginx configuration');
  console.log(`  Base path: ${nginxBase}`);
  console.log('  You may need to include sites-enabled in your nginx.conf:');
  console.log(`    include ${sitesEnabled}/*;`);
  console.log('');

  await createNginxConfig(args, sitesAvailable, sitesEnabled);
}

/**
 * Create nginx configuration on Ubuntu.
 *
 * Ubuntu uses the standard /etc/nginx/sites-available and sites-enabled
 * directories that Debian established for nginx configuration management.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_nginx_init_ubuntu(args) {
  // Check for help flag first (before nginx check)
  const options = parseArgs(args);
  if (options.help || args.length === 0) {
    showUsage();
    return;
  }

  // Check if nginx is installed
  if (!isCommandAvailable('nginx')) {
    console.error('Error: nginx is not installed.');
    console.error('Install it with: sudo apt install nginx');
    process.exit(1);
  }

  // Standard Debian/Ubuntu nginx paths
  const sitesAvailable = '/etc/nginx/sites-available';
  const sitesEnabled = '/etc/nginx/sites-enabled';

  await createNginxConfig(args, sitesAvailable, sitesEnabled);
}

/**
 * Create nginx configuration on Raspberry Pi OS.
 *
 * Raspberry Pi OS is Debian-based and uses the same nginx paths as Ubuntu.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_nginx_init_raspbian(args) {
  // Check for help flag first (before nginx check)
  const options = parseArgs(args);
  if (options.help || args.length === 0) {
    showUsage();
    return;
  }

  // Check if nginx is installed
  if (!isCommandAvailable('nginx')) {
    console.error('Error: nginx is not installed.');
    console.error('Install it with: sudo apt install nginx');
    process.exit(1);
  }

  // Same paths as Ubuntu (Debian-based)
  const sitesAvailable = '/etc/nginx/sites-available';
  const sitesEnabled = '/etc/nginx/sites-enabled';

  await createNginxConfig(args, sitesAvailable, sitesEnabled);
}

/**
 * Create nginx configuration on Amazon Linux.
 *
 * Amazon Linux (and other RHEL-based systems) use /etc/nginx/conf.d/
 * instead of the Debian-style sites-available/sites-enabled structure.
 * Configuration files placed in conf.d are automatically included.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_nginx_init_amazon_linux(args) {
  // Check for help flag first (before nginx check)
  const options = parseArgs(args);
  if (options.help || args.length === 0) {
    showUsage();
    return;
  }

  // Check if nginx is installed
  if (!isCommandAvailable('nginx')) {
    console.error('Error: nginx is not installed.');
    console.error('Install it with: sudo dnf install nginx');
    console.error('             or: sudo yum install nginx');
    process.exit(1);
  }

  // RHEL-based systems use conf.d instead of sites-available/sites-enabled
  // Files in conf.d are automatically included by the main nginx.conf
  const confDir = '/etc/nginx/conf.d';

  // For RHEL systems, we use conf.d for both "available" and "enabled"
  // since all configs in conf.d are automatically loaded
  // We still support the --link flag but it's not strictly necessary
  console.log('');
  console.log('Note: Amazon Linux/RHEL nginx configuration');
  console.log('  Configuration files in /etc/nginx/conf.d/ are automatically included.');
  console.log('  The --link option is not required on RHEL-based systems.');
  console.log('');

  await createNginxConfig(args, confDir, confDir);
}

/**
 * nginx configuration on Windows Command Prompt.
 *
 * nginx on Windows is less common and has a different directory structure.
 * This command is primarily designed for Linux servers.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_nginx_init_cmd(args) {
  console.log('nginx-init is not fully supported on Windows.');
  console.log('');
  console.log('This command is designed for Linux servers running nginx.');
  console.log('');
  console.log('For Windows environments, consider:');
  console.log('  - Using WSL (Windows Subsystem for Linux) for a Linux-like experience');
  console.log('  - Manually editing nginx configuration files');
  console.log('  - Using IIS as the web server instead');
  console.log('');
  console.log('If nginx is installed on Windows:');
  console.log('  1. Locate your nginx installation directory');
  console.log('  2. Create configuration files in the conf/ subdirectory');
  console.log('  3. Include them in nginx.conf');
  process.exit(1);
}

/**
 * nginx configuration on Windows PowerShell.
 *
 * Same limitations as CMD - nginx on Windows is not the primary target.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_nginx_init_powershell(args) {
  // Same behavior as CMD
  return do_nginx_init_cmd(args);
}

/**
 * nginx configuration from Git Bash on Windows.
 *
 * Git Bash runs on Windows, so it has the same limitations as CMD.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_nginx_init_gitbash(args) {
  // Same behavior as CMD
  return do_nginx_init_cmd(args);
}

/**
 * Main entry point - detects environment and executes appropriate implementation.
 *
 * The nginx-init command creates nginx site configuration files from templates.
 * It automates the common task of setting up a reverse proxy configuration
 * for web applications running on local ports.
 *
 * Features:
 * - Multiple domain support (server_name directive)
 * - Standard and API templates (CORS preflight handling)
 * - Automatic symlink creation in sites-enabled
 * - Cross-platform support (Linux variants, macOS)
 *
 * This command requires:
 * - nginx installed on the system
 * - sudo access for writing to /etc/nginx/
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_nginx_init(args) {
  const platform = os.detect();

  const handlers = {
    'macos': do_nginx_init_macos,
    'ubuntu': do_nginx_init_ubuntu,
    'debian': do_nginx_init_ubuntu,
    'raspbian': do_nginx_init_raspbian,
    'amazon_linux': do_nginx_init_amazon_linux,
    'rhel': do_nginx_init_amazon_linux,
    'fedora': do_nginx_init_amazon_linux,
    'linux': do_nginx_init_ubuntu,
    'wsl': do_nginx_init_ubuntu,
    'cmd': do_nginx_init_cmd,
    'windows': do_nginx_init_cmd,
    'powershell': do_nginx_init_powershell,
    'gitbash': do_nginx_init_gitbash
  };

  const handler = handlers[platform.type];
  if (!handler) {
    console.error(`Platform '${platform.type}' is not supported for this command.`);
    console.error('');
    console.error('Supported platforms:');
    console.error('  - macOS (with Homebrew nginx)');
    console.error('  - Ubuntu, Debian (with APT)');
    console.error('  - Raspberry Pi OS (with APT)');
    console.error('  - Amazon Linux, RHEL, Fedora (with DNF/YUM)');
    console.error('');
    console.error('Windows is not fully supported - use WSL for a Linux environment.');
    process.exit(1);
  }

  await handler(args);
}

module.exports = {
  main: do_nginx_init,
  do_nginx_init,
  do_nginx_init_nodejs,
  do_nginx_init_macos,
  do_nginx_init_ubuntu,
  do_nginx_init_raspbian,
  do_nginx_init_amazon_linux,
  do_nginx_init_cmd,
  do_nginx_init_powershell,
  do_nginx_init_gitbash
};

if (require.main === module) {
  do_nginx_init(process.argv.slice(2));
}
