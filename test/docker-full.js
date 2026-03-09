'use strict';

/**
 * Comprehensive end-to-end tests for the DevUtils CLI.
 *
 * Runs inside a Docker container (Ubuntu 24.04) to test every service
 * and top-level command without touching the host machine.
 *
 * Each test group uses an isolated temporary HOME directory so tests
 * never interfere with each other.
 */

const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const CLI_PATH = path.resolve(__dirname, '..', 'src', 'cli.js');
const PROJECT_ROOT = path.resolve(__dirname, '..');

// ── Test infrastructure ─────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures = [];

async function test(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  \x1b[32mPASS\x1b[0m  ${name}`);
  } catch (err) {
    failed++;
    const message = err && err.message ? err.message : String(err);
    failures.push({ name, message });
    console.log(`  \x1b[31mFAIL\x1b[0m  ${name}`);
    console.log(`        ${message}`);
  }
}

const assert = {
  equal(actual, expected, label) {
    if (actual !== expected) {
      const prefix = label ? `${label}: ` : '';
      throw new Error(`${prefix}expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
  },
  ok(value, label) {
    if (!value) {
      const prefix = label ? `${label}: ` : '';
      throw new Error(`${prefix}expected truthy value, got ${JSON.stringify(value)}`);
    }
  },
  includes(str, substr, label) {
    if (typeof str !== 'string' || !str.includes(substr)) {
      const prefix = label ? `${label}: ` : '';
      throw new Error(`${prefix}expected string to include ${JSON.stringify(substr)}, got ${JSON.stringify(str && str.substring(0, 200))}`);
    }
  },
  match(str, regex, label) {
    if (typeof str !== 'string' || !regex.test(str)) {
      const prefix = label ? `${label}: ` : '';
      throw new Error(`${prefix}expected string to match ${regex}, got ${JSON.stringify(str && str.substring(0, 200))}`);
    }
  },
  notIncludes(str, substr, label) {
    if (typeof str === 'string' && str.includes(substr)) {
      const prefix = label ? `${label}: ` : '';
      throw new Error(`${prefix}expected string NOT to include ${JSON.stringify(substr)}`);
    }
  },
};

/**
 * Run the CLI with given args and optional env overrides.
 */
function runCli(args, opts) {
  const extraEnv = (opts && opts.env) || {};
  const env = Object.assign({}, process.env, extraEnv);
  delete env.CLAUDECODE;
  delete env.GEMINI_CLI;
  delete env.CI;
  delete env.BUILD_NUMBER;
  delete env.TF_BUILD;

  const result = spawnSync('node', [CLI_PATH].concat(args || []), {
    encoding: 'utf8',
    env,
    cwd: (opts && opts.cwd) || PROJECT_ROOT,
    timeout: 15000,
  });

  return {
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    exitCode: result.status === null ? 1 : result.status,
  };
}

function makeTempHome() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'devutils-docker-'));
}

function removeTempHome(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
}

function seedConfig(homeDir, config) {
  const devutilsDir = path.join(homeDir, '.devutils');
  fs.mkdirSync(devutilsDir, { recursive: true });
  const defaults = {
    user: { name: 'Docker Test User', email: 'docker@test.com', url: '' },
    defaults: { license: 'MIT', packageManager: 'npm' },
    backup: { backend: 'repo', location: null },
    profile: 'default',
  };
  const data = config || defaults;
  fs.writeFileSync(path.join(devutilsDir, 'config.json'), JSON.stringify(data, null, 2) + '\n');
}

function seedIdentity(homeDir, name, email) {
  const devutilsDir = path.join(homeDir, '.devutils');
  const configPath = path.join(devutilsDir, 'config.json');
  let config;
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch {
    config = { user: {}, defaults: {}, profile: 'default' };
  }
  if (!Array.isArray(config.identities)) config.identities = [];
  config.identities.push({ name, email, sshKey: null, gpgKey: null, folders: [] });
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
}

// ── Test suites ─────────────────────────────────────────────────────────────

async function testVersion() {
  console.log('\n\x1b[1m[version]\x1b[0m Top-level version command\n');

  await test('dev version outputs semver-like string', () => {
    const r = runCli(['version']);
    assert.equal(r.exitCode, 0, 'exit code');
    assert.match(r.stdout.trim(), /\d+\.\d+\.\d+/, 'version format');
  });

  await test('dev --version outputs version', () => {
    const r = runCli(['--version']);
    assert.equal(r.exitCode, 0, 'exit code');
    assert.match(r.stdout.trim(), /^\d+\.\d+\.\d+/, 'version format');
  });
}

async function testHelp() {
  console.log('\n\x1b[1m[help]\x1b[0m Top-level help command\n');

  await test('dev help shows services', () => {
    const r = runCli(['help']);
    assert.equal(r.exitCode, 0, 'exit code');
    for (const svc of ['config', 'machine', 'identity', 'tools', 'ignore', 'util', 'alias', 'auth', 'api', 'ai', 'search']) {
      assert.includes(r.stdout, svc, `help lists ${svc}`);
    }
  });

  await test('dev --help shows usage and services', () => {
    const r = runCli(['--help']);
    assert.equal(r.exitCode, 0, 'exit code');
    assert.includes(r.stdout, 'Usage:', 'contains Usage');
    assert.includes(r.stdout, 'Services:', 'contains Services');
  });

  await test('dev (no args) shows help', () => {
    const r = runCli([]);
    assert.equal(r.exitCode, 0, 'exit code');
    assert.includes(r.stdout, 'Usage:', 'contains Usage');
  });
}

async function testUnknownCommand() {
  console.log('\n\x1b[1m[errors]\x1b[0m Unknown command handling\n');

  await test('unknown command returns non-zero exit code', () => {
    const r = runCli(['nonexistent-command-xyz']);
    assert.ok(r.exitCode !== 0, 'non-zero exit');
  });

  await test('unknown command mentions the command name in stderr', () => {
    const r = runCli(['nonexistent-command-xyz']);
    assert.includes(r.stderr, 'nonexistent-command-xyz', 'stderr mentions command');
  });

  await test('unknown service method returns error', () => {
    const r = runCli(['config', 'nonexistent-method-xyz']);
    assert.ok(r.exitCode !== 0, 'non-zero exit');
  });
}

async function testSchema() {
  console.log('\n\x1b[1m[schema]\x1b[0m Schema introspection\n');

  await test('dev schema lists all services', () => {
    const r = runCli(['schema']);
    assert.equal(r.exitCode, 0, 'exit code');
    assert.includes(r.stdout, 'config', 'has config');
    assert.includes(r.stdout, 'machine', 'has machine');
    assert.includes(r.stdout, 'identity', 'has identity');
    assert.includes(r.stdout, 'tools', 'has tools');
    assert.includes(r.stdout, 'ignore', 'has ignore');
    assert.includes(r.stdout, 'util', 'has util');
    assert.includes(r.stdout, 'alias', 'has alias');
    assert.includes(r.stdout, 'auth', 'has auth');
    assert.includes(r.stdout, 'api', 'has api');
    assert.includes(r.stdout, 'ai', 'has ai');
    assert.includes(r.stdout, 'search', 'has search');
  });

  await test('dev schema config resolves service', () => {
    const r = runCli(['schema', 'config']);
    assert.equal(r.exitCode, 0, 'exit code');
    assert.includes(r.stdout, 'config', 'mentions config');
  });

  await test('dev schema config.init resolves command', () => {
    const r = runCli(['schema', 'config.init']);
    assert.equal(r.exitCode, 0, 'exit code');
    assert.includes(r.stdout, 'init', 'mentions init');
  });

  await test('dev schema nonexistent returns error', () => {
    const r = runCli(['schema', 'nonexistent']);
    assert.ok(r.exitCode !== 0 || r.stderr.length > 0 || r.stdout.includes('No command found'), 'signals error');
  });
}

async function testServiceListing() {
  console.log('\n\x1b[1m[services]\x1b[0m Service listing (no method)\n');

  const services = ['config', 'machine', 'identity', 'tools', 'ignore', 'util', 'alias', 'auth', 'api', 'ai', 'search'];
  for (const svc of services) {
    await test(`dev ${svc} (no method) lists available methods`, () => {
      const r = runCli([svc]);
      assert.equal(r.exitCode, 0, 'exit code');
      assert.ok(r.stdout.length > 0, 'has output');
    });
  }
}

async function testConfig() {
  console.log('\n\x1b[1m[config]\x1b[0m Config service\n');

  await test('dev config init creates config in non-interactive mode', () => {
    const h = makeTempHome();
    try {
      const r = runCli(['config', 'init'], { env: { HOME: h } });
      assert.equal(r.exitCode, 0, 'exit code');
      const p = path.join(h, '.devutils', 'config.json');
      assert.ok(fs.existsSync(p), 'config.json created');
      const c = JSON.parse(fs.readFileSync(p, 'utf8'));
      assert.ok(c.user !== undefined, 'has user');
      assert.ok(c.defaults !== undefined, 'has defaults');
      assert.ok(c.profile !== undefined, 'has profile');
    } finally { removeTempHome(h); }
  });

  await test('dev config init is idempotent', () => {
    const h = makeTempHome();
    try {
      seedConfig(h);
      const r = runCli(['config', 'init'], { env: { HOME: h } });
      assert.equal(r.exitCode, 0, 'exit code');
      assert.includes(r.stdout, 'already configured', 'reports existing');
    } finally { removeTempHome(h); }
  });

  await test('dev config init --force overwrites', () => {
    const h = makeTempHome();
    try {
      seedConfig(h, { user: { name: 'Old' }, defaults: {}, profile: 'old' });
      const r = runCli(['config', 'init', '--force'], { env: { HOME: h } });
      assert.equal(r.exitCode, 0, 'exit code');
      const c = JSON.parse(fs.readFileSync(path.join(h, '.devutils', 'config.json'), 'utf8'));
      assert.equal(c.profile, 'default', 'profile reset');
    } finally { removeTempHome(h); }
  });

  await test('dev config show with seeded config', () => {
    const h = makeTempHome();
    try {
      seedConfig(h);
      const r = runCli(['config', 'show'], { env: { HOME: h } });
      assert.equal(r.exitCode, 0, 'exit code');
      assert.includes(r.stdout, 'Docker Test User', 'has name');
      assert.includes(r.stdout, 'docker@test.com', 'has email');
    } finally { removeTempHome(h); }
  });

  await test('dev config show without config errors', () => {
    const h = makeTempHome();
    try {
      const r = runCli(['config', 'show'], { env: { HOME: h } });
      assert.ok(r.exitCode !== 0, 'non-zero exit');
    } finally { removeTempHome(h); }
  });

  await test('dev config get user.name', () => {
    const h = makeTempHome();
    try {
      seedConfig(h);
      const r = runCli(['config', 'get', 'user.name'], { env: { HOME: h } });
      assert.equal(r.exitCode, 0, 'exit code');
      assert.includes(r.stdout, 'Docker Test User', 'returns name');
    } finally { removeTempHome(h); }
  });

  await test('dev config get nonexistent.key errors', () => {
    const h = makeTempHome();
    try {
      seedConfig(h);
      const r = runCli(['config', 'get', 'nonexistent.key'], { env: { HOME: h } });
      assert.ok(r.exitCode !== 0, 'non-zero exit');
    } finally { removeTempHome(h); }
  });

  await test('dev config set user.email updates config', () => {
    const h = makeTempHome();
    try {
      seedConfig(h);
      const r = runCli(['config', 'set', 'user.email', 'new@test.com'], { env: { HOME: h } });
      assert.equal(r.exitCode, 0, 'exit code');
      const c = JSON.parse(fs.readFileSync(path.join(h, '.devutils', 'config.json'), 'utf8'));
      assert.equal(c.user.email, 'new@test.com', 'email updated');
    } finally { removeTempHome(h); }
  });

  await test('dev config reset resets to defaults', () => {
    const h = makeTempHome();
    try {
      seedConfig(h, { user: { name: 'Custom' }, defaults: { license: 'GPL' }, profile: 'custom' });
      const r = runCli(['config', 'reset'], { env: { HOME: h } });
      assert.equal(r.exitCode, 0, 'exit code');
    } finally { removeTempHome(h); }
  });
}

async function testMachine() {
  console.log('\n\x1b[1m[machine]\x1b[0m Machine profiles\n');

  await test('dev machine detect gathers system info', () => {
    const h = makeTempHome();
    try {
      seedConfig(h);
      const r = runCli(['machine', 'detect'], { env: { HOME: h } });
      assert.equal(r.exitCode, 0, 'exit code');
      assert.includes(r.stdout, 'hostname', 'has hostname');
      assert.includes(r.stdout, 'arch', 'has arch');
      // Verify file was written
      const p = path.join(h, '.devutils', 'machines', 'current.json');
      assert.ok(fs.existsSync(p), 'current.json created');
    } finally { removeTempHome(h); }
  });

  await test('dev machine show displays detected profile', () => {
    const h = makeTempHome();
    try {
      seedConfig(h);
      runCli(['machine', 'detect'], { env: { HOME: h } });
      const r = runCli(['machine', 'show'], { env: { HOME: h } });
      assert.equal(r.exitCode, 0, 'exit code');
      assert.includes(r.stdout, 'hostname', 'has hostname');
    } finally { removeTempHome(h); }
  });

  await test('dev machine show without detect errors', () => {
    const h = makeTempHome();
    try {
      seedConfig(h);
      const r = runCli(['machine', 'show'], { env: { HOME: h } });
      assert.ok(r.exitCode !== 0, 'non-zero exit');
    } finally { removeTempHome(h); }
  });

  await test('dev machine list shows profiles', () => {
    const h = makeTempHome();
    try {
      seedConfig(h);
      runCli(['machine', 'detect'], { env: { HOME: h } });
      const r = runCli(['machine', 'list'], { env: { HOME: h } });
      assert.equal(r.exitCode, 0, 'exit code');
    } finally { removeTempHome(h); }
  });

  await test('dev machine set updates a profile value', () => {
    const h = makeTempHome();
    try {
      seedConfig(h);
      runCli(['machine', 'detect'], { env: { HOME: h } });
      const r = runCli(['machine', 'set', 'hostname', 'test-box'], { env: { HOME: h } });
      assert.equal(r.exitCode, 0, 'exit code');
      const p = path.join(h, '.devutils', 'machines', 'current.json');
      const c = JSON.parse(fs.readFileSync(p, 'utf8'));
      assert.equal(c.hostname, 'test-box', 'hostname updated');
    } finally { removeTempHome(h); }
  });
}

async function testIgnore() {
  console.log('\n\x1b[1m[ignore]\x1b[0m Gitignore patterns\n');

  await test('dev ignore list shows available technologies', () => {
    const r = runCli(['ignore', 'list']);
    assert.equal(r.exitCode, 0, 'exit code');
    assert.includes(r.stdout, 'node', 'has node');
  });

  await test('dev ignore add node creates .gitignore with patterns', () => {
    const h = makeTempHome();
    const workDir = path.join(h, 'project');
    fs.mkdirSync(workDir, { recursive: true });
    try {
      const r = runCli(['ignore', 'add', 'node', '--path', workDir], { env: { HOME: h } });
      assert.equal(r.exitCode, 0, 'exit code');
      const gi = fs.readFileSync(path.join(workDir, '.gitignore'), 'utf8');
      assert.includes(gi, 'node_modules', 'has node_modules pattern');
    } finally { removeTempHome(h); }
  });

  await test('dev ignore add is idempotent', () => {
    const h = makeTempHome();
    const workDir = path.join(h, 'project');
    fs.mkdirSync(workDir, { recursive: true });
    try {
      runCli(['ignore', 'add', 'node', '--path', workDir], { env: { HOME: h } });
      runCli(['ignore', 'add', 'node', '--path', workDir], { env: { HOME: h } });
      const gi = fs.readFileSync(path.join(workDir, '.gitignore'), 'utf8');
      // Count marker occurrences -- should be exactly 1
      const markers = gi.match(/# >>> devutils:node/g) || [];
      assert.equal(markers.length, 1, 'exactly one section');
    } finally { removeTempHome(h); }
  });

  await test('dev ignore add multiple technologies', () => {
    const h = makeTempHome();
    const workDir = path.join(h, 'project');
    fs.mkdirSync(workDir, { recursive: true });
    try {
      runCli(['ignore', 'add', 'node', '--path', workDir], { env: { HOME: h } });
      runCli(['ignore', 'add', 'macos', '--path', workDir], { env: { HOME: h } });
      const gi = fs.readFileSync(path.join(workDir, '.gitignore'), 'utf8');
      assert.includes(gi, 'node_modules', 'has node');
      assert.includes(gi, '.DS_Store', 'has macos');
    } finally { removeTempHome(h); }
  });

  await test('dev ignore remove removes a section', () => {
    const h = makeTempHome();
    const workDir = path.join(h, 'project');
    fs.mkdirSync(workDir, { recursive: true });
    try {
      runCli(['ignore', 'add', 'node', '--path', workDir], { env: { HOME: h } });
      runCli(['ignore', 'add', 'macos', '--path', workDir], { env: { HOME: h } });
      runCli(['ignore', 'remove', 'node', '--path', workDir], { env: { HOME: h } });
      const gi = fs.readFileSync(path.join(workDir, '.gitignore'), 'utf8');
      assert.notIncludes(gi, 'node_modules', 'node patterns removed');
      assert.includes(gi, '.DS_Store', 'macos patterns still there');
    } finally { removeTempHome(h); }
  });

  await test('dev ignore show lists managed sections', () => {
    const h = makeTempHome();
    const workDir = path.join(h, 'project');
    fs.mkdirSync(workDir, { recursive: true });
    try {
      runCli(['ignore', 'add', 'node', '--path', workDir], { env: { HOME: h } });
      const r = runCli(['ignore', 'show', '--path', workDir], { env: { HOME: h } });
      assert.equal(r.exitCode, 0, 'exit code');
      assert.includes(r.stdout, 'node', 'shows node section');
    } finally { removeTempHome(h); }
  });

  await test('dev ignore add unknown technology errors', () => {
    const r = runCli(['ignore', 'add', 'nonexistent-tech-xyz']);
    assert.ok(r.exitCode !== 0, 'non-zero exit');
  });
}

async function testTools() {
  console.log('\n\x1b[1m[tools]\x1b[0m Tool management\n');

  await test('dev tools list shows available tools', () => {
    const r = runCli(['tools', 'list']);
    assert.equal(r.exitCode, 0, 'exit code');
    assert.includes(r.stdout, 'git', 'has git');
    assert.includes(r.stdout, 'node', 'has node');
  });

  await test('dev tools check git reports installed', () => {
    const r = runCli(['tools', 'check', 'git']);
    assert.equal(r.exitCode, 0, 'exit code');
    // Git is installed in the Docker container
    assert.includes(r.stdout, 'git', 'mentions git');
  });

  await test('dev tools check node reports installed', () => {
    const r = runCli(['tools', 'check', 'node']);
    assert.equal(r.exitCode, 0, 'exit code');
    assert.includes(r.stdout, 'node', 'mentions node');
  });

  await test('dev tools search git finds results', () => {
    const r = runCli(['tools', 'search', 'git']);
    assert.equal(r.exitCode, 0, 'exit code');
    assert.includes(r.stdout, 'git', 'found git');
  });

  await test('dev tools search nonexistent finds nothing', () => {
    const r = runCli(['tools', 'search', 'zzzzz']);
    assert.equal(r.exitCode, 0, 'exit code');
  });

  await test('dev tools install git --dry-run', () => {
    const r = runCli(['tools', 'install', 'git', '--dry-run']);
    assert.equal(r.exitCode, 0, 'exit code');
  });
}

async function testIdentity() {
  console.log('\n\x1b[1m[identity]\x1b[0m Git identity management\n');

  await test('dev identity add creates an identity', () => {
    const h = makeTempHome();
    try {
      seedConfig(h);
      const r = runCli(['identity', 'add', 'work', '--email', 'work@test.com'], { env: { HOME: h } });
      assert.equal(r.exitCode, 0, 'exit code');
      const c = JSON.parse(fs.readFileSync(path.join(h, '.devutils', 'config.json'), 'utf8'));
      assert.ok(Array.isArray(c.identities) && c.identities.some(id => id.name === 'work'), 'identity exists');
    } finally { removeTempHome(h); }
  });

  await test('dev identity list shows identities', () => {
    const h = makeTempHome();
    try {
      seedConfig(h);
      seedIdentity(h, 'personal', 'me@test.com');
      const r = runCli(['identity', 'list'], { env: { HOME: h } });
      assert.equal(r.exitCode, 0, 'exit code');
      assert.includes(r.stdout, 'personal', 'lists personal');
    } finally { removeTempHome(h); }
  });

  await test('dev identity show displays identity details', () => {
    const h = makeTempHome();
    try {
      seedConfig(h);
      seedIdentity(h, 'personal', 'me@test.com');
      const r = runCli(['identity', 'show', 'personal'], { env: { HOME: h } });
      assert.equal(r.exitCode, 0, 'exit code');
      assert.includes(r.stdout, 'me@test.com', 'shows email');
    } finally { removeTempHome(h); }
  });

  await test('dev identity add rejects invalid name', () => {
    const h = makeTempHome();
    try {
      seedConfig(h);
      const r = runCli(['identity', 'add', 'INVALID NAME', '--email', 'x@test.com'], { env: { HOME: h } });
      assert.ok(r.exitCode !== 0, 'non-zero exit');
    } finally { removeTempHome(h); }
  });

  await test('dev identity remove deletes an identity', () => {
    const h = makeTempHome();
    try {
      seedConfig(h);
      seedIdentity(h, 'temp', 'temp@test.com');
      const r = runCli(['identity', 'remove', 'temp', '--confirm'], { env: { HOME: h } });
      assert.equal(r.exitCode, 0, 'exit code');
      const c = JSON.parse(fs.readFileSync(path.join(h, '.devutils', 'config.json'), 'utf8'));
      assert.ok(!Array.isArray(c.identities) || !c.identities.some(id => id.name === 'temp'), 'identity removed');
    } finally { removeTempHome(h); }
  });
}

async function testUtil() {
  console.log('\n\x1b[1m[util]\x1b[0m Utility functions\n');

  await test('dev util list shows built-in utilities', () => {
    const r = runCli(['util', 'list']);
    assert.equal(r.exitCode, 0, 'exit code');
    assert.includes(r.stdout, 'git-status', 'has git-status');
    assert.includes(r.stdout, 'clone', 'has clone');
    assert.includes(r.stdout, 'git-push', 'has git-push');
  });

  await test('dev util show git-status displays meta', () => {
    const r = runCli(['util', 'show', 'git-status']);
    assert.equal(r.exitCode, 0, 'exit code');
    assert.includes(r.stdout, 'git-status', 'mentions name');
  });

  await test('dev util show nonexistent errors', () => {
    const r = runCli(['util', 'show', 'nonexistent-util-xyz']);
    assert.ok(r.exitCode !== 0, 'non-zero exit');
  });
}

async function testAlias() {
  console.log('\n\x1b[1m[alias]\x1b[0m Shorthand commands\n');

  await test('dev alias list with no aliases', () => {
    const h = makeTempHome();
    try {
      seedConfig(h);
      const r = runCli(['alias', 'list'], { env: { HOME: h } });
      assert.equal(r.exitCode, 0, 'exit code');
    } finally { removeTempHome(h); }
  });

  await test('dev alias add creates an alias', () => {
    const h = makeTempHome();
    try {
      seedConfig(h);
      const r = runCli(['alias', 'add', 'gs', 'dev', 'util', 'run', 'git-status'], { env: { HOME: h } });
      assert.equal(r.exitCode, 0, 'exit code');
      const aliases = JSON.parse(fs.readFileSync(path.join(h, '.devutils', 'aliases.json'), 'utf8'));
      assert.ok(aliases.gs, 'alias exists');
    } finally { removeTempHome(h); }
  });

  await test('dev alias list shows added alias', () => {
    const h = makeTempHome();
    try {
      seedConfig(h);
      runCli(['alias', 'add', 'gs', 'dev', 'util', 'run', 'git-status'], { env: { HOME: h } });
      const r = runCli(['alias', 'list'], { env: { HOME: h } });
      assert.equal(r.exitCode, 0, 'exit code');
      assert.includes(r.stdout, 'gs', 'lists gs');
    } finally { removeTempHome(h); }
  });

  await test('dev alias add rejects invalid name', () => {
    const h = makeTempHome();
    try {
      seedConfig(h);
      const r = runCli(['alias', 'add', 'INVALID.name', 'echo', 'hi'], { env: { HOME: h } });
      assert.ok(r.exitCode !== 0 || r.stderr.length > 0 || r.stdout.includes('Invalid'), 'rejects bad name');
    } finally { removeTempHome(h); }
  });

  await test('dev alias sync regenerates wrappers', () => {
    const h = makeTempHome();
    try {
      seedConfig(h);
      runCli(['alias', 'add', 'gs', 'dev', 'util', 'run', 'git-status'], { env: { HOME: h } });
      const r = runCli(['alias', 'sync'], { env: { HOME: h } });
      assert.equal(r.exitCode, 0, 'exit code');
      // Check that wrapper script exists
      const binDir = path.join(h, '.devutils', 'bin');
      assert.ok(fs.existsSync(path.join(binDir, 'gs')), 'wrapper script exists');
    } finally { removeTempHome(h); }
  });

  await test('dev alias remove deletes an alias', () => {
    const h = makeTempHome();
    try {
      seedConfig(h);
      runCli(['alias', 'add', 'gs', 'dev', 'util', 'run', 'git-status'], { env: { HOME: h } });
      const r = runCli(['alias', 'remove', 'gs', '--confirm'], { env: { HOME: h } });
      assert.equal(r.exitCode, 0, 'exit code');
      const aliases = JSON.parse(fs.readFileSync(path.join(h, '.devutils', 'aliases.json'), 'utf8'));
      assert.ok(!aliases.gs, 'alias removed');
    } finally { removeTempHome(h); }
  });
}

async function testAuth() {
  console.log('\n\x1b[1m[auth]\x1b[0m Authentication (non-interactive checks)\n');

  await test('dev auth list with no credentials', () => {
    const h = makeTempHome();
    try {
      seedConfig(h);
      const r = runCli(['auth', 'list'], { env: { HOME: h } });
      assert.equal(r.exitCode, 0, 'exit code');
    } finally { removeTempHome(h); }
  });

  await test('dev auth status for unknown service errors', () => {
    const h = makeTempHome();
    try {
      seedConfig(h);
      const r = runCli(['auth', 'status', 'nonexistent-svc-xyz'], { env: { HOME: h } });
      assert.ok(r.exitCode !== 0 || r.stdout.includes('Unknown') || r.stderr.length > 0, 'signals error');
    } finally { removeTempHome(h); }
  });

  await test('dev auth logout when not logged in', () => {
    const h = makeTempHome();
    try {
      seedConfig(h);
      const r = runCli(['auth', 'logout', 'google'], { env: { HOME: h } });
      // Should handle gracefully -- not crash
      assert.equal(r.exitCode, 0, 'exit code');
    } finally { removeTempHome(h); }
  });
}

async function testApi() {
  console.log('\n\x1b[1m[api]\x1b[0m API plugin system (no network)\n');

  await test('dev api list with no plugins installed', () => {
    const h = makeTempHome();
    try {
      seedConfig(h);
      const r = runCli(['api', 'list'], { env: { HOME: h } });
      assert.equal(r.exitCode, 0, 'exit code');
    } finally { removeTempHome(h); }
  });

  await test('dev api disable nonexistent errors gracefully', () => {
    const h = makeTempHome();
    try {
      seedConfig(h);
      const r = runCli(['api', 'disable', 'nonexistent-plugin-xyz'], { env: { HOME: h } });
      assert.ok(r.exitCode !== 0 || r.stderr.length > 0 || r.stdout.includes('not installed'), 'signals error');
    } finally { removeTempHome(h); }
  });
}

async function testAi() {
  console.log('\n\x1b[1m[ai]\x1b[0m AI launcher (no AI tools installed)\n');

  await test('dev ai list shows known tools', () => {
    const r = runCli(['ai', 'list']);
    assert.equal(r.exitCode, 0, 'exit code');
    assert.includes(r.stdout, 'claude', 'lists claude');
    assert.includes(r.stdout, 'gemini', 'lists gemini');
  });

  await test('dev ai show claude displays config', () => {
    const r = runCli(['ai', 'show', 'claude']);
    assert.equal(r.exitCode, 0, 'exit code');
    assert.includes(r.stdout, 'claude', 'mentions claude');
  });

  await test('dev ai set claude mode danger writes config', () => {
    const h = makeTempHome();
    try {
      const r = runCli(['ai', 'set', 'claude', 'mode', 'danger'], { env: { HOME: h } });
      assert.equal(r.exitCode, 0, 'exit code');
      const c = JSON.parse(fs.readFileSync(path.join(h, '.devutils', 'ai.json'), 'utf8'));
      assert.equal(c.claude.mode, 'danger', 'mode set');
    } finally { removeTempHome(h); }
  });

  await test('dev ai set claude model sonnet writes config', () => {
    const h = makeTempHome();
    try {
      const r = runCli(['ai', 'set', 'claude', 'model', 'sonnet'], { env: { HOME: h } });
      assert.equal(r.exitCode, 0, 'exit code');
      const c = JSON.parse(fs.readFileSync(path.join(h, '.devutils', 'ai.json'), 'utf8'));
      assert.equal(c.claude.model, 'sonnet', 'model set');
    } finally { removeTempHome(h); }
  });

  await test('dev ai set claude mode invalid errors', () => {
    const h = makeTempHome();
    try {
      const r = runCli(['ai', 'set', 'claude', 'mode', 'invalid-mode'], { env: { HOME: h } });
      // Should not crash, should report unknown mode
      assert.ok(r.stdout.includes('Unknown mode') || r.stderr.length > 0, 'reports invalid mode');
    } finally { removeTempHome(h); }
  });

  await test('dev ai launch nonexistent errors', () => {
    const r = runCli(['ai', 'launch', 'nonexistent-tool-xyz']);
    // Should report unknown tool, not crash
    assert.ok(r.stdout.includes('Unknown') || r.stderr.length > 0, 'reports unknown tool');
  });
}

async function testSearch() {
  console.log('\n\x1b[1m[search]\x1b[0m QMD search (qmd not installed)\n');

  await test('dev search status reports QMD not installed', () => {
    const r = runCli(['search', 'status']);
    // QMD is not installed in the Docker container, should handle gracefully
    assert.ok(r.exitCode !== 0 || r.stdout.includes('not installed') || r.stderr.includes('not installed'), 'reports missing');
  });

  await test('dev search query without QMD errors gracefully', () => {
    const r = runCli(['search', 'query', 'test']);
    assert.ok(r.exitCode !== 0 || r.stdout.includes('not installed') || r.stderr.includes('not installed'), 'reports missing');
  });
}

async function testStatus() {
  console.log('\n\x1b[1m[status]\x1b[0m Overall status check\n');

  await test('dev status runs without crashing (no config)', () => {
    const h = makeTempHome();
    try {
      const r = runCli(['status'], { env: { HOME: h } });
      // May succeed or fail depending on what it checks, but should not crash
      assert.ok(r.exitCode === 0 || r.exitCode === 1, 'exits cleanly');
    } finally { removeTempHome(h); }
  });

  await test('dev status with seeded config', () => {
    const h = makeTempHome();
    try {
      seedConfig(h);
      const r = runCli(['status'], { env: { HOME: h } });
      assert.equal(r.exitCode, 0, 'exit code');
    } finally { removeTempHome(h); }
  });
}

async function testUpdate() {
  console.log('\n\x1b[1m[update]\x1b[0m Self-update (check only)\n');

  await test('dev update --check runs without crashing', () => {
    const r = runCli(['update', '--check']);
    // May fail due to network, but should not crash
    assert.ok(r.exitCode === 0 || r.exitCode === 1, 'exits cleanly');
  });
}

async function testConfigExportImport() {
  console.log('\n\x1b[1m[config export/import]\x1b[0m File-based export and import\n');

  await test('dev config export --file creates a portable bundle', () => {
    const h = makeTempHome();
    try {
      seedConfig(h);
      const exportPath = path.join(h, 'backup.json');
      const r = runCli(['config', 'export', '--file', exportPath], { env: { HOME: h } });
      assert.equal(r.exitCode, 0, 'exit code');
      assert.ok(fs.existsSync(exportPath), 'backup file created');
      const bundle = JSON.parse(fs.readFileSync(exportPath, 'utf8'));
      assert.ok(bundle.config, 'has config');
      assert.ok(bundle.exportedAt, 'has timestamp');
    } finally { removeTempHome(h); }
  });

  await test('dev config import --file restores from bundle', () => {
    const h = makeTempHome();
    try {
      // Create and export a config
      seedConfig(h, {
        user: { name: 'Export Test', email: 'export@test.com', url: '' },
        defaults: { license: 'MIT', packageManager: 'npm' },
        profile: 'exported',
      });
      const exportPath = path.join(h, 'backup.json');
      runCli(['config', 'export', '--file', exportPath], { env: { HOME: h } });

      // Wipe the config
      fs.unlinkSync(path.join(h, '.devutils', 'config.json'));

      // Import from the file
      // Need to temporarily re-create a minimal config for the import command to read backup settings,
      // but --file mode doesn't need that. Let's test:
      const r = runCli(['config', 'import', '--file', exportPath], { env: { HOME: h } });
      assert.equal(r.exitCode, 0, 'exit code');

      // Verify restored
      const c = JSON.parse(fs.readFileSync(path.join(h, '.devutils', 'config.json'), 'utf8'));
      assert.equal(c.user.name, 'Export Test', 'name restored');
      assert.equal(c.profile, 'exported', 'profile restored');
    } finally { removeTempHome(h); }
  });
}

async function testPlatformDetection() {
  console.log('\n\x1b[1m[platform]\x1b[0m Platform detection on Ubuntu 24\n');

  await test('dev machine detect identifies Ubuntu', () => {
    const h = makeTempHome();
    try {
      seedConfig(h);
      const r = runCli(['machine', 'detect'], { env: { HOME: h } });
      assert.equal(r.exitCode, 0, 'exit code');
      assert.includes(r.stdout, 'ubuntu', 'detects ubuntu');
    } finally { removeTempHome(h); }
  });
}

async function testGlobalInstall() {
  console.log('\n\x1b[1m[global install]\x1b[0m npm link simulation\n');

  await test('CLI entry point is executable', () => {
    const r = spawnSync('node', [CLI_PATH, '--version'], { encoding: 'utf8', timeout: 5000 });
    assert.equal(r.status, 0, 'exit code');
    assert.match(r.stdout.trim(), /^\d+\.\d+\.\d+/, 'version format');
  });

  await test('bin entry resolves correctly', () => {
    const pkg = require(path.join(PROJECT_ROOT, 'package.json'));
    assert.ok(pkg.bin && pkg.bin.dev, 'has bin.dev');
    const binPath = path.resolve(PROJECT_ROOT, pkg.bin.dev);
    assert.ok(fs.existsSync(binPath), 'bin target exists');
  });
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('='.repeat(60));
  console.log('  DevUtils CLI - Docker Integration Tests (Ubuntu 24.04)');
  console.log('='.repeat(60));

  await testVersion();
  await testHelp();
  await testUnknownCommand();
  await testSchema();
  await testServiceListing();
  await testConfig();
  await testMachine();
  await testIgnore();
  await testTools();
  await testIdentity();
  await testUtil();
  await testAlias();
  await testAuth();
  await testApi();
  await testAi();
  await testSearch();
  await testStatus();
  await testUpdate();
  await testConfigExportImport();
  await testPlatformDetection();
  await testGlobalInstall();

  // ── Report ──────────────────────────────────────────────────────────────
  const total = passed + failed;
  console.log('\n' + '='.repeat(60));
  console.log(`  Results: \x1b[32m${passed} passed\x1b[0m, \x1b[31m${failed} failed\x1b[0m, ${total} total`);

  if (failures.length > 0) {
    console.log('\n  Failures:');
    for (const f of failures) {
      console.log(`    \x1b[31m-\x1b[0m ${f.name}`);
      console.log(`      ${f.message}`);
    }
  }

  console.log('='.repeat(60));
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Test runner crashed:', err);
  process.exit(1);
});
