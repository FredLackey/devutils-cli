#!/usr/bin/env node

/**
 * Systemd Service Management Utilities
 *
 * Linux-specific utilities for managing systemd services.
 */

const shell = require('../common/shell');

/**
 * Checks if systemd is the init system
 * @returns {boolean}
 */
function isSystemdAvailable() {
  // Check if systemctl exists and systemd is running
  if (!shell.commandExists('systemctl')) {
    return false;
  }

  // Verify systemd is actually running (not just installed)
  const result = shell.execSync('systemctl is-system-running 2>/dev/null');
  // Valid responses include: running, degraded, maintenance, initializing
  return result !== '' && !result.includes('offline');
}

/**
 * Checks if a systemd service is active (running)
 * @param {string} service - The service name
 * @returns {Promise<boolean>}
 */
async function isServiceRunning(service) {
  if (!isSystemdAvailable()) {
    return false;
  }

  const result = await shell.exec(`systemctl is-active ${service}`);
  return result.stdout.trim() === 'active';
}

/**
 * Checks if a service is enabled (starts on boot)
 * @param {string} service - The service name
 * @returns {Promise<boolean>}
 */
async function isServiceEnabled(service) {
  if (!isSystemdAvailable()) {
    return false;
  }

  const result = await shell.exec(`systemctl is-enabled ${service}`);
  return result.stdout.trim() === 'enabled';
}

/**
 * Starts a systemd service
 * @param {string} service - The service name
 * @returns {Promise<{ success: boolean, output: string }>}
 */
async function startService(service) {
  if (!isSystemdAvailable()) {
    return {
      success: false,
      output: 'systemd is not available'
    };
  }

  const result = await shell.exec(`sudo systemctl start ${service}`);
  return {
    success: result.code === 0,
    output: result.stdout || result.stderr
  };
}

/**
 * Stops a systemd service
 * @param {string} service - The service name
 * @returns {Promise<{ success: boolean, output: string }>}
 */
async function stopService(service) {
  if (!isSystemdAvailable()) {
    return {
      success: false,
      output: 'systemd is not available'
    };
  }

  const result = await shell.exec(`sudo systemctl stop ${service}`);
  return {
    success: result.code === 0,
    output: result.stdout || result.stderr
  };
}

/**
 * Restarts a systemd service
 * @param {string} service - The service name
 * @returns {Promise<{ success: boolean, output: string }>}
 */
async function restartService(service) {
  if (!isSystemdAvailable()) {
    return {
      success: false,
      output: 'systemd is not available'
    };
  }

  const result = await shell.exec(`sudo systemctl restart ${service}`);
  return {
    success: result.code === 0,
    output: result.stdout || result.stderr
  };
}

/**
 * Reloads a systemd service configuration
 * @param {string} service - The service name
 * @returns {Promise<{ success: boolean, output: string }>}
 */
async function reloadService(service) {
  if (!isSystemdAvailable()) {
    return {
      success: false,
      output: 'systemd is not available'
    };
  }

  const result = await shell.exec(`sudo systemctl reload ${service}`);
  return {
    success: result.code === 0,
    output: result.stdout || result.stderr
  };
}

/**
 * Enables a service to start on boot
 * @param {string} service - The service name
 * @param {Object} [options] - Options
 * @param {boolean} [options.now=false] - Also start the service immediately
 * @returns {Promise<{ success: boolean, output: string }>}
 */
async function enableService(service, options = {}) {
  if (!isSystemdAvailable()) {
    return {
      success: false,
      output: 'systemd is not available'
    };
  }

  const nowFlag = options.now ? ' --now' : '';
  const result = await shell.exec(`sudo systemctl enable${nowFlag} ${service}`);
  return {
    success: result.code === 0,
    output: result.stdout || result.stderr
  };
}

/**
 * Disables a service from starting on boot
 * @param {string} service - The service name
 * @param {Object} [options] - Options
 * @param {boolean} [options.now=false] - Also stop the service immediately
 * @returns {Promise<{ success: boolean, output: string }>}
 */
async function disableService(service, options = {}) {
  if (!isSystemdAvailable()) {
    return {
      success: false,
      output: 'systemd is not available'
    };
  }

  const nowFlag = options.now ? ' --now' : '';
  const result = await shell.exec(`sudo systemctl disable${nowFlag} ${service}`);
  return {
    success: result.code === 0,
    output: result.stdout || result.stderr
  };
}

/**
 * Gets the status of a service
 * @param {string} service - The service name
 * @returns {Promise<string|null>}
 */
async function getServiceStatus(service) {
  if (!isSystemdAvailable()) {
    return null;
  }

  const result = await shell.exec(`systemctl status ${service}`);
  return result.stdout || result.stderr;
}

/**
 * Lists all running services
 * @returns {Promise<string[]>}
 */
async function listRunningServices() {
  if (!isSystemdAvailable()) {
    return [];
  }

  const result = await shell.exec('systemctl list-units --type=service --state=running --no-pager --plain');
  if (result.code !== 0) {
    return [];
  }

  return result.stdout
    .split('\n')
    .filter(Boolean)
    .slice(0, -1) // Remove summary line
    .map((line) => {
      const parts = line.trim().split(/\s+/);
      return parts[0] ? parts[0].replace('.service', '') : '';
    })
    .filter(Boolean);
}

/**
 * Reloads the systemd daemon (after unit file changes)
 * @returns {Promise<{ success: boolean, output: string }>}
 */
async function daemonReload() {
  if (!isSystemdAvailable()) {
    return {
      success: false,
      output: 'systemd is not available'
    };
  }

  const result = await shell.exec('sudo systemctl daemon-reload');
  return {
    success: result.code === 0,
    output: result.stdout || result.stderr
  };
}

/**
 * Checks if a service exists
 * @param {string} service - The service name
 * @returns {Promise<boolean>}
 */
async function serviceExists(service) {
  if (!isSystemdAvailable()) {
    return false;
  }

  const result = await shell.exec(`systemctl cat ${service} 2>/dev/null`);
  return result.code === 0;
}

/**
 * Gets the logs for a service
 * @param {string} service - The service name
 * @param {Object} [options] - Options
 * @param {number} [options.lines=50] - Number of lines to retrieve
 * @param {boolean} [options.follow=false] - Follow the logs (not recommended for programmatic use)
 * @returns {Promise<string|null>}
 */
async function getServiceLogs(service, options = {}) {
  if (!shell.commandExists('journalctl')) {
    return null;
  }

  const lines = options.lines || 50;
  const result = await shell.exec(`journalctl -u ${service} -n ${lines} --no-pager`);
  return result.code === 0 ? result.stdout : null;
}

module.exports = {
  isSystemdAvailable,
  isServiceRunning,
  isServiceEnabled,
  startService,
  stopService,
  restartService,
  reloadService,
  enableService,
  disableService,
  getServiceStatus,
  listRunningServices,
  daemonReload,
  serviceExists,
  getServiceLogs
};
