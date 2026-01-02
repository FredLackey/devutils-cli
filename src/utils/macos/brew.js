#!/usr/bin/env node

/**
 * Homebrew Package Manager Utilities
 *
 * macOS-specific utilities for interacting with Homebrew.
 */

const shell = require('../common/shell');

/**
 * Checks if Homebrew is installed and functional
 * @returns {boolean}
 */
function isInstalled() {
  return shell.commandExists('brew');
}

/**
 * Returns the installed Homebrew version
 * @returns {Promise<string|null>}
 */
async function getVersion() {
  if (!isInstalled()) {
    return null;
  }

  const result = await shell.exec('brew --version');
  if (result.code === 0) {
    // Output: "Homebrew 4.1.0"
    const match = result.stdout.match(/Homebrew\s+(\d+\.\d+\.?\d*)/);
    return match ? match[1] : null;
  }
  return null;
}

/**
 * Installs a Homebrew formula (CLI tool)
 * @param {string} formula - The formula name to install
 * @returns {Promise<{ success: boolean, output: string }>}
 */
async function install(formula) {
  if (!isInstalled()) {
    return {
      success: false,
      output: 'Homebrew is not installed'
    };
  }

  const result = await shell.exec(`brew install ${formula}`);
  return {
    success: result.code === 0,
    output: result.stdout || result.stderr
  };
}

/**
 * Installs a Homebrew cask (GUI application)
 * @param {string} cask - The cask name to install
 * @returns {Promise<{ success: boolean, output: string }>}
 */
async function installCask(cask) {
  if (!isInstalled()) {
    return {
      success: false,
      output: 'Homebrew is not installed'
    };
  }

  const result = await shell.exec(`brew install --cask ${cask}`);
  return {
    success: result.code === 0,
    output: result.stdout || result.stderr
  };
}

/**
 * Removes a Homebrew formula
 * @param {string} formula - The formula name to remove
 * @returns {Promise<{ success: boolean, output: string }>}
 */
async function uninstall(formula) {
  if (!isInstalled()) {
    return {
      success: false,
      output: 'Homebrew is not installed'
    };
  }

  const result = await shell.exec(`brew uninstall ${formula}`);
  return {
    success: result.code === 0,
    output: result.stdout || result.stderr
  };
}

/**
 * Removes a Homebrew cask
 * @param {string} cask - The cask name to remove
 * @returns {Promise<{ success: boolean, output: string }>}
 */
async function uninstallCask(cask) {
  if (!isInstalled()) {
    return {
      success: false,
      output: 'Homebrew is not installed'
    };
  }

  const result = await shell.exec(`brew uninstall --cask ${cask}`);
  return {
    success: result.code === 0,
    output: result.stdout || result.stderr
  };
}

/**
 * Checks if a specific formula is installed
 * @param {string} formula - The formula name to check
 * @returns {Promise<boolean>}
 */
async function isFormulaInstalled(formula) {
  if (!isInstalled()) {
    return false;
  }

  const result = await shell.exec(`brew list --formula ${formula}`);
  return result.code === 0;
}

/**
 * Checks if a specific cask is installed
 * @param {string} cask - The cask name to check
 * @returns {Promise<boolean>}
 */
async function isCaskInstalled(cask) {
  if (!isInstalled()) {
    return false;
  }

  const result = await shell.exec(`brew list --cask ${cask}`);
  return result.code === 0;
}

/**
 * Updates Homebrew itself and package lists
 * @returns {Promise<{ success: boolean, output: string }>}
 */
async function update() {
  if (!isInstalled()) {
    return {
      success: false,
      output: 'Homebrew is not installed'
    };
  }

  const result = await shell.exec('brew update');
  return {
    success: result.code === 0,
    output: result.stdout || result.stderr
  };
}

/**
 * Upgrades a specific formula or all outdated formulas
 * @param {string} [formula] - The formula to upgrade (all if omitted)
 * @returns {Promise<{ success: boolean, output: string }>}
 */
async function upgrade(formula) {
  if (!isInstalled()) {
    return {
      success: false,
      output: 'Homebrew is not installed'
    };
  }

  const command = formula ? `brew upgrade ${formula}` : 'brew upgrade';
  const result = await shell.exec(command);
  return {
    success: result.code === 0,
    output: result.stdout || result.stderr
  };
}

/**
 * Adds a third-party Homebrew tap
 * @param {string} repository - The tap repository (e.g., 'homebrew/cask-fonts')
 * @returns {Promise<{ success: boolean, output: string }>}
 */
async function tap(repository) {
  if (!isInstalled()) {
    return {
      success: false,
      output: 'Homebrew is not installed'
    };
  }

  const result = await shell.exec(`brew tap ${repository}`);
  return {
    success: result.code === 0,
    output: result.stdout || result.stderr
  };
}

/**
 * Searches for formulas/casks matching query
 * @param {string} query - The search query
 * @returns {Promise<{ formulas: string[], casks: string[] }>}
 */
async function search(query) {
  if (!isInstalled()) {
    return { formulas: [], casks: [] };
  }

  const result = await shell.exec(`brew search ${query}`);
  if (result.code !== 0) {
    return { formulas: [], casks: [] };
  }

  const lines = result.stdout.split('\n').filter(Boolean);
  const formulas = [];
  const casks = [];
  let inCasks = false;

  for (const line of lines) {
    if (line.includes('==> Formulae')) {
      inCasks = false;
      continue;
    }
    if (line.includes('==> Casks')) {
      inCasks = true;
      continue;
    }
    if (line.startsWith('==>')) {
      continue;
    }

    // Each line may contain multiple space-separated package names
    const packages = line.trim().split(/\s+/).filter(Boolean);
    if (inCasks) {
      casks.push(...packages);
    } else {
      formulas.push(...packages);
    }
  }

  return { formulas, casks };
}

/**
 * Gets information about a formula or cask
 * @param {string} name - The formula or cask name
 * @returns {Promise<string|null>}
 */
async function info(name) {
  if (!isInstalled()) {
    return null;
  }

  const result = await shell.exec(`brew info ${name}`);
  if (result.code === 0) {
    return result.stdout;
  }
  return null;
}

/**
 * Lists all installed formulas
 * @returns {Promise<string[]>}
 */
async function listFormulas() {
  if (!isInstalled()) {
    return [];
  }

  const result = await shell.exec('brew list --formula');
  if (result.code === 0) {
    return result.stdout.split('\n').filter(Boolean);
  }
  return [];
}

/**
 * Lists all installed casks
 * @returns {Promise<string[]>}
 */
async function listCasks() {
  if (!isInstalled()) {
    return [];
  }

  const result = await shell.exec('brew list --cask');
  if (result.code === 0) {
    return result.stdout.split('\n').filter(Boolean);
  }
  return [];
}

module.exports = {
  isInstalled,
  getVersion,
  install,
  installCask,
  uninstall,
  uninstallCask,
  isFormulaInstalled,
  isCaskInstalled,
  update,
  upgrade,
  tap,
  search,
  info,
  listFormulas,
  listCasks
};
