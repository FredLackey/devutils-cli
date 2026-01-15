#!/usr/bin/env node

/**
 * @fileoverview Install command - Platform-agnostic installation of development tools.
 *
 * This command handles the installation of development tools with automatic
 * dependency resolution. It performs the following steps for each technology:
 *
 * 1. Check if already installed using isInstalled() - skip if true
 * 2. Check if eligible for current platform using isEligible() - fail if false
 * 3. Resolve dependencies from installers.json
 * 4. Recursively check and install dependencies first
 * 5. Install the requested technology
 *
 * @module commands/install
 */

const { Command } = require('commander');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const os = require('../utils/common/os');

const INSTALLS_DIR = path.join(__dirname, '..', 'installs');
const INSTALLERS_JSON = path.join(INSTALLS_DIR, 'installers.json');

/**
 * Cache for loaded installer modules to avoid reloading
 * @type {Map<string, object>}
 */
const installerCache = new Map();

/**
 * Cache for installer metadata from installers.json
 * @type {Array<object>|null}
 */
let installersMetadata = null;

/**
 * Load the installers.json metadata file
 * @returns {Array<object>} Array of installer metadata objects
 */
function loadInstallersMetadata() {
  if (installersMetadata !== null) {
    return installersMetadata;
  }

  try {
    if (!fs.existsSync(INSTALLERS_JSON)) {
      console.warn('Warning: installers.json not found. Dependency resolution disabled.');
      installersMetadata = [];
      return installersMetadata;
    }
    const content = fs.readFileSync(INSTALLERS_JSON, 'utf8');
    installersMetadata = JSON.parse(content);
    return installersMetadata;
  } catch (err) {
    console.warn(`Warning: Failed to load installers.json: ${err.message}`);
    installersMetadata = [];
    return installersMetadata;
  }
}

/**
 * Get metadata for a specific installer by filename
 * @param {string} filename - The installer filename (e.g., "node.js")
 * @returns {object|null} The installer metadata or null if not found
 */
function getInstallerMetadata(filename) {
  const metadata = loadInstallersMetadata();
  return metadata.find(m => m.filename === filename) || null;
}

/**
 * Load an installer module by name
 * @param {string} name - Name of the installer (without .js extension)
 * @returns {object|null} The installer module or null if not found
 */
function loadInstaller(name) {
  const filename = `${name}.js`;

  // Check cache first
  if (installerCache.has(filename)) {
    return installerCache.get(filename);
  }

  const scriptPath = path.join(INSTALLS_DIR, filename);

  if (!fs.existsSync(scriptPath)) {
    return null;
  }

  try {
    const installer = require(scriptPath);
    installerCache.set(filename, installer);
    return installer;
  } catch (err) {
    console.error(`Error loading installer ${name}: ${err.message}`);
    return null;
  }
}

/**
 * Get list of available install scripts
 * @returns {string[]} Array of install script names (without .js extension)
 */
function getAvailableInstalls() {
  try {
    if (!fs.existsSync(INSTALLS_DIR)) {
      return [];
    }
    return fs.readdirSync(INSTALLS_DIR)
      .filter(file => file.endsWith('.js'))
      .map(file => file.replace('.js', ''))
      .sort();
  } catch {
    return [];
  }
}

/**
 * Prompt user for confirmation
 * @param {string} question - Question to ask
 * @returns {Promise<boolean>}
 */
function confirm(question) {
  return new Promise(resolve => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    rl.question(`${question} (y/n): `, answer => {
      rl.close();
      resolve(answer.toLowerCase().startsWith('y'));
    });
  });
}

/**
 * Check if a technology is installed
 * @param {string} name - Name of the technology (without .js extension)
 * @returns {Promise<boolean>} True if installed, false otherwise
 */
async function checkIsInstalled(name) {
  const installer = loadInstaller(name);

  if (!installer) {
    return false;
  }

  // Check if installer has isInstalled function
  if (typeof installer.isInstalled !== 'function') {
    // If no isInstalled function, assume not installed (will try to install)
    return false;
  }

  try {
    // isInstalled may be sync or async
    const result = installer.isInstalled();
    if (result instanceof Promise) {
      return await result;
    }
    return result;
  } catch (err) {
    // If check fails, assume not installed
    return false;
  }
}

/**
 * Check if a technology is eligible for the current platform
 * @param {string} name - Name of the technology (without .js extension)
 * @returns {boolean} True if eligible, false otherwise
 */
function checkIsEligible(name) {
  const installer = loadInstaller(name);

  if (!installer) {
    return false;
  }

  // Check if installer has isEligible function
  if (typeof installer.isEligible !== 'function') {
    // If no isEligible function, assume eligible (backwards compatibility)
    return true;
  }

  try {
    return installer.isEligible();
  } catch (err) {
    // If check fails, assume not eligible
    return false;
  }
}

/**
 * Get the display name for a technology from metadata
 * @param {string} filename - The installer filename
 * @returns {string} The display name or the filename without extension
 */
function getDisplayName(filename) {
  const metadata = getInstallerMetadata(filename);
  if (metadata && metadata.name) {
    return metadata.name;
  }
  return filename.replace('.js', '');
}

/**
 * Resolve dependencies for a technology, filtering by eligibility
 *
 * This function recursively resolves all dependencies for a given technology,
 * returning them in the correct installation order (dependencies first).
 *
 * @param {string} name - Name of the technology (without .js extension)
 * @param {Set<string>} visited - Set of already visited technologies (for cycle detection)
 * @param {Set<string>} installing - Set of technologies currently being resolved (for cycle detection)
 * @param {object} options - Command options
 * @returns {Promise<Array<{name: string, displayName: string}>>} Array of technologies to install in order
 */
async function resolveDependencies(name, visited = new Set(), installing = new Set(), options = {}) {
  const filename = `${name}.js`;
  const result = [];

  // Detect circular dependencies
  if (installing.has(filename)) {
    if (options.verbose) {
      console.log(`  [Skipping circular dependency: ${name}]`);
    }
    return result;
  }

  // Skip if already processed
  if (visited.has(filename)) {
    return result;
  }

  // Mark as being processed
  installing.add(filename);

  // Get metadata for this installer
  const metadata = getInstallerMetadata(filename);
  const dependencies = metadata?.depends_on || [];

  // Sort dependencies by priority (lower priority = install first)
  const sortedDeps = [...dependencies].sort((a, b) => (a.priority || 0) - (b.priority || 0));

  // Get current platform for filtering platform-specific dependencies
  const currentPlatform = os.detect().type;

  // Process each dependency
  for (const dep of sortedDeps) {
    const depName = dep.name.replace('.js', '');

    // Check if dependency is platform-specific and applies to current platform
    // If 'platforms' is not specified, the dependency applies to all platforms
    if (dep.platforms && dep.platforms.length > 0) {
      if (!dep.platforms.includes(currentPlatform)) {
        if (options.verbose) {
          console.log(`  [Skipping ${depName}: not needed on ${currentPlatform}]`);
        }
        continue;
      }
    }

    // Check if dependency is eligible for this platform
    if (!checkIsEligible(depName)) {
      if (options.verbose) {
        console.log(`  [Skipping ineligible dependency: ${depName}]`);
      }
      continue;
    }

    // Check if dependency is already installed
    const isInstalled = await checkIsInstalled(depName);
    if (isInstalled) {
      if (options.verbose) {
        console.log(`  [Dependency already installed: ${depName}]`);
      }
      visited.add(dep.name);
      continue;
    }

    // Recursively resolve this dependency's dependencies
    const subDeps = await resolveDependencies(depName, visited, installing, options);
    result.push(...subDeps);

    // Add this dependency if not already visited
    if (!visited.has(dep.name)) {
      result.push({
        name: depName,
        displayName: getDisplayName(dep.name)
      });
      visited.add(dep.name);
    }
  }

  // Mark as processed (no longer being resolved)
  installing.delete(filename);

  return result;
}

/**
 * Install a single technology
 * @param {string} name - Name of the technology to install
 * @param {object} options - Command options
 * @returns {Promise<boolean>} True if installation succeeded
 */
async function installSingle(name, options) {
  const installer = loadInstaller(name);

  if (!installer) {
    console.error(`Error: Installer for "${name}" not found.`);
    return false;
  }

  if (typeof installer.install !== 'function') {
    console.error(`Error: Installer "${name}" does not export an install() function.`);
    return false;
  }

  try {
    const installOptions = {
      dryRun: options.dryRun || false,
      verbose: options.verbose || false,
      force: options.force || false
    };

    await installer.install(installOptions);
    return true;
  } catch (err) {
    console.error(`Error installing ${name}: ${err.message}`);
    if (options.verbose) {
      console.error(err.stack);
    }
    return false;
  }
}

/**
 * List all available install scripts
 */
function listInstalls() {
  const installs = getAvailableInstalls();

  if (installs.length === 0) {
    console.log('\nNo install scripts available.');
    console.log(`Install scripts should be placed in: ${INSTALLS_DIR}\n`);
    return;
  }

  console.log('\nAvailable install scripts:');
  console.log('─'.repeat(40));

  for (const name of installs) {
    const filename = `${name}.js`;
    const displayName = getDisplayName(filename);
    const eligible = checkIsEligible(name);
    const eligibleMark = eligible ? '' : ' (not available on this platform)';
    console.log(`  ${name}${eligibleMark}`);
  }

  console.log(`\nUsage: dev install <name>`);
  console.log('');
}

/**
 * Run an install with dependency resolution
 * @param {string} name - Name of the install script
 * @param {object} options - Command options
 */
async function runInstall(name, options) {
  if (!name) {
    console.error('\nError: No package specified.');
    console.log('Usage: dev install <name>');
    console.log('Run `dev install --list` to see available options.\n');
    process.exit(1);
  }

  const scriptPath = path.join(INSTALLS_DIR, `${name}.js`);
  const filename = `${name}.js`;

  // Check if install script exists
  if (!fs.existsSync(scriptPath)) {
    console.error(`\nError: Unknown package "${name}".`);
    console.log('Run `dev install --list` to see available options.\n');
    process.exit(1);
  }

  // Get display name for output
  const displayName = getDisplayName(filename);

  console.log(`\nChecking ${displayName}...`);

  // Step 1: Check if already installed
  const isInstalled = await checkIsInstalled(name);
  if (isInstalled) {
    console.log(`${displayName} is already installed.`);
    return;
  }

  // Step 2: Check if eligible for this platform
  const isEligible = checkIsEligible(name);
  if (!isEligible) {
    console.log(`${displayName} is not available for this platform.`);
    return;
  }

  // Step 3: Resolve dependencies
  if (options.verbose) {
    console.log(`Resolving dependencies for ${displayName}...`);
  }

  const dependencies = await resolveDependencies(name, new Set(), new Set(), options);

  // Build the full installation list (dependencies + target)
  const toInstall = [
    ...dependencies,
    { name, displayName }
  ];

  // Remove duplicates while preserving order
  const seen = new Set();
  const uniqueToInstall = toInstall.filter(item => {
    if (seen.has(item.name)) {
      return false;
    }
    seen.add(item.name);
    return true;
  });

  // Show what will be installed
  if (uniqueToInstall.length > 1) {
    console.log(`\nThe following will be installed:`);
    for (const item of uniqueToInstall) {
      console.log(`  - ${item.displayName}`);
    }
    console.log('');
  } else {
    console.log(`\nPreparing to install: ${displayName}`);
  }

  if (options.dryRun) {
    console.log('[Dry run mode - no changes will be made]\n');
  }

  // Confirm installation (unless --force)
  if (!options.force) {
    const shouldProceed = await confirm('Proceed with installation?');
    if (!shouldProceed) {
      console.log('Installation cancelled.');
      return;
    }
  }

  // Install each technology in order
  let successCount = 0;
  let failCount = 0;

  for (const item of uniqueToInstall) {
    console.log(`\n${'─'.repeat(50)}`);
    console.log(`Installing ${item.displayName}...`);
    console.log('─'.repeat(50));

    if (options.verbose) {
      console.log(`Script: ${path.join(INSTALLS_DIR, `${item.name}.js`)}`);
    }

    const success = await installSingle(item.name, options);

    if (success) {
      successCount++;
      if (!options.dryRun) {
        console.log(`${item.displayName} installed successfully.`);
      }
    } else {
      failCount++;
      console.error(`Failed to install ${item.displayName}.`);

      // Ask if user wants to continue on failure (unless --force)
      if (!options.force && uniqueToInstall.indexOf(item) < uniqueToInstall.length - 1) {
        const shouldContinue = await confirm('Continue with remaining installations?');
        if (!shouldContinue) {
          console.log('Installation cancelled.');
          break;
        }
      }
    }
  }

  // Summary
  console.log(`\n${'─'.repeat(50)}`);
  console.log('Installation Summary:');
  console.log(`  Successful: ${successCount}`);
  if (failCount > 0) {
    console.log(`  Failed: ${failCount}`);
  }
  console.log('');
}

/**
 * Handle the install command
 * @param {string} name - Package name to install
 * @param {object} options - Command options
 */
async function handleInstall(name, options) {
  if (options.list) {
    listInstalls();
    return;
  }

  await runInstall(name, options);
}

// Create and configure the command
const install = new Command('install')
  .description('Platform-agnostic installation of development tools with automatic dependency resolution')
  .argument('[name]', 'Name of the package to install')
  .option('--list', 'List all available install scripts')
  .option('--dry-run', 'Show what would be executed without running')
  .option('--force', 'Skip confirmation prompts')
  .option('--verbose', 'Show detailed output during installation')
  .action(handleInstall);

module.exports = install;
