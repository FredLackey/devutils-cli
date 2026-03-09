'use strict';

/**
 * Core CLI integration tests.
 *
 * Verifies that top-level commands (version, help, schema) produce the
 * expected output and exit codes, and that unknown commands fail properly.
 */

const { test, assert, runCli } = require('./runner');

async function run() {
  console.log('');
  console.log('Core CLI tests');
  console.log('');

  // ── version ────────────────────────────────────────────────────────────

  await test('dev version outputs a valid semver-like string', () => {
    const result = runCli(['version']);
    assert.equal(result.exitCode, 0, 'exit code');
    // The output is JSON because stdout is piped (detected as "pipe" caller).
    // The version command in non-json mode uses output.info() which writes plain text.
    // In pipe mode, format is json, so it goes through output.out() which writes JSON.
    // Either way, the version string should appear somewhere in stdout.
    assert.match(result.stdout.trim(), /\d+\.\d+\.\d+/, 'version format');
  });

  await test('dev --version outputs version', () => {
    const result = runCli(['--version']);
    assert.equal(result.exitCode, 0, 'exit code');
    // --version is handled directly in cli.js main() with console.log(pkg.version)
    assert.match(result.stdout.trim(), /^\d+\.\d+\.\d+$/, 'version format');
  });

  // ── help ───────────────────────────────────────────────────────────────

  await test('dev help lists registered services', () => {
    const result = runCli(['help']);
    assert.equal(result.exitCode, 0, 'exit code');
    assert.ok(result.stdout.length > 0, 'stdout is not empty');
  });

  await test('dev help includes "config"', () => {
    const result = runCli(['help']);
    assert.includes(result.stdout, 'config', 'stdout contains config');
  });

  await test('dev help includes "machine"', () => {
    const result = runCli(['help']);
    assert.includes(result.stdout, 'machine', 'stdout contains machine');
  });

  await test('dev help includes "identity"', () => {
    const result = runCli(['help']);
    assert.includes(result.stdout, 'identity', 'stdout contains identity');
  });

  await test('dev help includes "tools"', () => {
    const result = runCli(['help']);
    assert.includes(result.stdout, 'tools', 'stdout contains tools');
  });

  await test('dev help includes "ignore"', () => {
    const result = runCli(['help']);
    assert.includes(result.stdout, 'ignore', 'stdout contains ignore');
  });

  await test('dev help includes "util"', () => {
    const result = runCli(['help']);
    assert.includes(result.stdout, 'util', 'stdout contains util');
  });

  await test('dev --help shows help', () => {
    const result = runCli(['--help']);
    assert.equal(result.exitCode, 0, 'exit code');
    assert.includes(result.stdout, 'Usage:', 'stdout contains Usage:');
    assert.includes(result.stdout, 'Services:', 'stdout contains Services:');
  });

  // ── unknown command ────────────────────────────────────────────────────

  await test('unknown command returns non-zero exit code', () => {
    const result = runCli(['nonexistent-command-xyz']);
    assert.ok(result.exitCode !== 0, 'exit code is non-zero');
  });

  await test('unknown command writes error to stderr', () => {
    const result = runCli(['nonexistent-command-xyz']);
    assert.ok(result.stderr.length > 0, 'stderr is not empty');
    assert.includes(result.stderr, 'nonexistent-command-xyz', 'stderr mentions the command');
  });

  // ── config (no method) ────────────────────────────────────────────────

  await test('dev config (no method) lists available methods', () => {
    const result = runCli(['config']);
    assert.equal(result.exitCode, 0, 'exit code');
    assert.includes(result.stdout, 'config', 'stdout mentions config');
    // Should list methods like init, show, get, set, etc.
    assert.includes(result.stdout, 'init', 'stdout lists init method');
    assert.includes(result.stdout, 'show', 'stdout lists show method');
    assert.includes(result.stdout, 'get', 'stdout lists get method');
  });

  // ── schema ─────────────────────────────────────────────────────────────

  await test('dev schema lists services', () => {
    const result = runCli(['schema']);
    assert.equal(result.exitCode, 0, 'exit code');
    assert.ok(result.stdout.length > 0, 'stdout is not empty');
    // Schema output should reference the known services
    assert.includes(result.stdout, 'config', 'stdout contains config');
  });
}

module.exports = { run };
