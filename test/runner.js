'use strict';

/**
 * Simple test runner for end-to-end CLI integration tests.
 *
 * Provides:
 *   - test(name, fn)       Register and run a single test case.
 *   - assert.equal(a, b)   Strict equality check.
 *   - assert.ok(value)     Truthiness check.
 *   - assert.includes(str, substr)  Substring check.
 *   - assert.match(str, regex)      Regex match check.
 *   - runCli(args, opts)   Spawn `node src/cli.js` and return { stdout, stderr, exitCode }.
 *   - report()             Print results and return the exit code (0 = all passed, 1 = failures).
 */

const { spawnSync } = require('child_process');
const path = require('path');

// Path to the CLI entry point, resolved relative to the project root.
const CLI_PATH = path.resolve(__dirname, '..', 'src', 'cli.js');

// Counters
let passed = 0;
let failed = 0;
const failures = [];

/**
 * Runs a single test case. Catches any thrown error and records a failure.
 *
 * @param {string} name - A short description of what is being tested.
 * @param {Function} fn - The test function. May be sync or async.
 */
async function test(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  PASS  ${name}`);
  } catch (err) {
    failed++;
    const message = err && err.message ? err.message : String(err);
    failures.push({ name, message });
    console.log(`  FAIL  ${name}`);
    console.log(`        ${message}`);
  }
}

/**
 * Assertion helpers. Each one throws an Error with a descriptive message
 * when the assertion fails, which test() catches and records.
 */
const assert = {
  /**
   * Strict equality (===).
   * @param {*} actual - The value produced by the code under test.
   * @param {*} expected - The value the test expects.
   * @param {string} [label] - Optional context for the error message.
   */
  equal(actual, expected, label) {
    if (actual !== expected) {
      const prefix = label ? `${label}: ` : '';
      throw new Error(
        `${prefix}expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
      );
    }
  },

  /**
   * Truthiness check.
   * @param {*} value - The value to check.
   * @param {string} [label] - Optional context for the error message.
   */
  ok(value, label) {
    if (!value) {
      const prefix = label ? `${label}: ` : '';
      throw new Error(`${prefix}expected truthy value, got ${JSON.stringify(value)}`);
    }
  },

  /**
   * Checks that a string contains a substring.
   * @param {string} str - The string to search within.
   * @param {string} substr - The substring to look for.
   * @param {string} [label] - Optional context for the error message.
   */
  includes(str, substr, label) {
    if (typeof str !== 'string' || !str.includes(substr)) {
      const prefix = label ? `${label}: ` : '';
      throw new Error(
        `${prefix}expected string to include ${JSON.stringify(substr)}, got ${JSON.stringify(str)}`
      );
    }
  },

  /**
   * Checks that a string matches a regular expression.
   * @param {string} str - The string to test.
   * @param {RegExp} regex - The pattern to match against.
   * @param {string} [label] - Optional context for the error message.
   */
  match(str, regex, label) {
    if (typeof str !== 'string' || !regex.test(str)) {
      const prefix = label ? `${label}: ` : '';
      throw new Error(
        `${prefix}expected string to match ${regex}, got ${JSON.stringify(str)}`
      );
    }
  },
};

/**
 * Spawns `node src/cli.js` with the given arguments and returns the result.
 *
 * The environment is sanitized to remove variables that would change the
 * CLI's output-mode detection (e.g., CLAUDECODE, GEMINI_CLI, CI).
 *
 * @param {string[]} args - CLI arguments (e.g., ['version']).
 * @param {object} [opts] - Extra options.
 * @param {object} [opts.env] - Additional environment variables to merge.
 * @returns {{ stdout: string, stderr: string, exitCode: number }}
 */
function runCli(args, opts) {
  const extraEnv = (opts && opts.env) || {};

  // Start with current env, then strip variables that affect output detection.
  const env = Object.assign({}, process.env, extraEnv);
  delete env.CLAUDECODE;
  delete env.GEMINI_CLI;
  delete env.CI;
  delete env.BUILD_NUMBER;
  delete env.TF_BUILD;

  const result = spawnSync('node', [CLI_PATH].concat(args || []), {
    encoding: 'utf8',
    env: env,
    cwd: path.resolve(__dirname, '..'),
    timeout: 15000,
  });

  return {
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    exitCode: result.status === null ? 1 : result.status,
  };
}

/**
 * Prints a summary of test results and returns the appropriate exit code.
 *
 * @returns {number} 0 if all tests passed, 1 if any failed.
 */
function report() {
  const total = passed + failed;
  console.log('');
  console.log('─'.repeat(50));
  console.log(`  Results: ${passed} passed, ${failed} failed, ${total} total`);

  if (failures.length > 0) {
    console.log('');
    console.log('  Failures:');
    for (const f of failures) {
      console.log(`    - ${f.name}`);
      console.log(`      ${f.message}`);
    }
  }

  console.log('─'.repeat(50));
  return failed > 0 ? 1 : 0;
}

module.exports = { test, assert, runCli, report };
