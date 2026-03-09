'use strict';

/**
 * Config command integration tests.
 *
 * Uses a temporary directory as HOME so that tests never read or write
 * the real user configuration. Each test group creates its own temp dir
 * and cleans it up when finished.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { test, assert, runCli } = require('./runner');

/**
 * Creates a temporary directory to use as a fake HOME.
 * @returns {string} The path to the temp directory.
 */
function makeTempHome() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'devutils-test-'));
}

/**
 * Recursively removes a directory and all of its contents.
 * Idempotent: does nothing if the path does not exist.
 * @param {string} dirPath - The directory to remove.
 */
function removeTempHome(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
}

/**
 * Seeds a minimal config.json inside the fake HOME's .devutils directory.
 * @param {string} homeDir - The fake HOME directory.
 * @param {object} [config] - The config object to write. Defaults to a minimal config.
 * @returns {string} The path to the config.json file.
 */
function seedConfig(homeDir, config) {
  const devutilsDir = path.join(homeDir, '.devutils');
  fs.mkdirSync(devutilsDir, { recursive: true });

  const defaults = {
    user: {
      name: 'Test User',
      email: 'test@example.com',
      url: '',
    },
    defaults: {
      license: 'MIT',
      packageManager: 'npm',
    },
    backup: {
      backend: 'repo',
      location: null,
    },
    profile: 'default',
  };

  const data = config || defaults;
  const configPath = path.join(devutilsDir, 'config.json');
  fs.writeFileSync(configPath, JSON.stringify(data, null, 2) + '\n');
  return configPath;
}

async function run() {
  console.log('');
  console.log('Config command tests');
  console.log('');

  // ── config show ────────────────────────────────────────────────────────

  await test('dev config show works with seeded config', () => {
    const tempHome = makeTempHome();
    try {
      seedConfig(tempHome);
      const result = runCli(['config', 'show'], { env: { HOME: tempHome } });
      assert.equal(result.exitCode, 0, 'exit code');
      assert.includes(result.stdout, 'Test User', 'stdout contains user name');
      assert.includes(result.stdout, 'test@example.com', 'stdout contains email');
    } finally {
      removeTempHome(tempHome);
    }
  });

  await test('dev config show returns error when no config exists', () => {
    const tempHome = makeTempHome();
    try {
      const result = runCli(['config', 'show'], { env: { HOME: tempHome } });
      assert.ok(result.exitCode !== 0, 'exit code is non-zero');
      assert.ok(result.stderr.length > 0, 'stderr is not empty');
    } finally {
      removeTempHome(tempHome);
    }
  });

  // ── config get ─────────────────────────────────────────────────────────

  await test('dev config get user.name returns the configured name', () => {
    const tempHome = makeTempHome();
    try {
      seedConfig(tempHome);
      const result = runCli(['config', 'get', 'user.name'], { env: { HOME: tempHome } });
      assert.equal(result.exitCode, 0, 'exit code');
      assert.includes(result.stdout, 'Test User', 'stdout contains user name');
    } finally {
      removeTempHome(tempHome);
    }
  });

  await test('dev config get user.email returns the configured email', () => {
    const tempHome = makeTempHome();
    try {
      seedConfig(tempHome);
      const result = runCli(['config', 'get', 'user.email'], { env: { HOME: tempHome } });
      assert.equal(result.exitCode, 0, 'exit code');
      assert.includes(result.stdout, 'test@example.com', 'stdout contains email');
    } finally {
      removeTempHome(tempHome);
    }
  });

  await test('dev config get returns error for missing key', () => {
    const tempHome = makeTempHome();
    try {
      seedConfig(tempHome);
      const result = runCli(['config', 'get', 'nonexistent.key'], { env: { HOME: tempHome } });
      assert.ok(result.exitCode !== 0, 'exit code is non-zero');
      assert.ok(result.stderr.length > 0, 'stderr is not empty');
    } finally {
      removeTempHome(tempHome);
    }
  });

  await test('dev config get returns error when no config exists', () => {
    const tempHome = makeTempHome();
    try {
      const result = runCli(['config', 'get', 'user.name'], { env: { HOME: tempHome } });
      assert.ok(result.exitCode !== 0, 'exit code is non-zero');
    } finally {
      removeTempHome(tempHome);
    }
  });

  // ── config init ────────────────────────────────────────────────────────

  await test('dev config init creates config in non-interactive mode', () => {
    const tempHome = makeTempHome();
    try {
      // In non-interactive mode (piped stdin), prompts return defaults.
      // We also need SHELL set so the shell config detection works, but
      // we do not need it to succeed for the test to pass.
      const result = runCli(['config', 'init'], { env: { HOME: tempHome } });
      assert.equal(result.exitCode, 0, 'exit code');

      // Verify the config file was created
      const configPath = path.join(tempHome, '.devutils', 'config.json');
      assert.ok(fs.existsSync(configPath), 'config.json was created');

      // Verify the config has the expected structure
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      assert.ok(config.user !== undefined, 'config has user section');
      assert.ok(config.defaults !== undefined, 'config has defaults section');
      assert.ok(config.profile !== undefined, 'config has profile field');
    } finally {
      removeTempHome(tempHome);
    }
  });

  await test('dev config init is idempotent (skips if already configured)', () => {
    const tempHome = makeTempHome();
    try {
      seedConfig(tempHome);
      const result = runCli(['config', 'init'], { env: { HOME: tempHome } });
      assert.equal(result.exitCode, 0, 'exit code');
      // Should tell the user it is already configured
      assert.includes(result.stdout, 'already configured', 'stdout says already configured');
    } finally {
      removeTempHome(tempHome);
    }
  });

  await test('dev config init --force re-runs setup', () => {
    const tempHome = makeTempHome();
    try {
      seedConfig(tempHome, { user: { name: 'Old User' }, defaults: {}, profile: 'old' });
      const result = runCli(['config', 'init', '--force'], { env: { HOME: tempHome } });
      assert.equal(result.exitCode, 0, 'exit code');

      // Config should be overwritten with defaults (non-interactive mode)
      const configPath = path.join(tempHome, '.devutils', 'config.json');
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      assert.equal(config.profile, 'default', 'profile reset to default');
    } finally {
      removeTempHome(tempHome);
    }
  });
}

module.exports = { run };
