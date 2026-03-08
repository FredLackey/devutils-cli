# Story 001: End-to-End Integration Tests

## Goal

Write integration tests that verify the full CLI works end-to-end by running it as a subprocess and checking stdout, stderr, and exit codes. This is the final quality gate before publishing. Without these tests, we have no automated way to know if a change breaks something. We are not using a test framework — just Node.js built-in `assert` and `child_process`.

## Prerequisites

- All core service stories must be complete (001-foundation through 016-self-update)

## Background

The DevUtils CLI has 59 commands across 13 services plus top-level commands. We don't need to test every flag combination, but we do need to verify that each service's happy path works: the CLI routes to the right command, the command runs without crashing, and the output is structured correctly.

The test approach is simple: spawn `node src/cli.js <args>` as a child process, capture stdout and stderr, and assert on the results. This is the same way a real user (or AI agent) would call the CLI.

## Technique

### Step 1: Create the test directory

Create `test/` at the project root. One file per service, plus a runner.

### Step 2: Write a test helper

Create `test/helpers.js` with a function that spawns the CLI and returns a promise:

```javascript
const { execFile } = require('child_process');
const path = require('path');

const CLI = path.join(__dirname, '..', 'src', 'cli.js');

function run(args, opts = {}) {
  return new Promise((resolve) => {
    execFile('node', [CLI, ...args], {
      timeout: 10000,
      env: { ...process.env, ...opts.env },
      cwd: opts.cwd || process.cwd(),
    }, (error, stdout, stderr) => {
      resolve({
        exitCode: error ? error.code || 1 : 0,
        stdout: stdout.toString(),
        stderr: stderr.toString(),
      });
    });
  });
}

module.exports = { run };
```

### Step 3: Write test files

Each test file exports an async function that runs assertions. Example pattern:

```javascript
const assert = require('assert');
const { run } = require('./helpers');

async function test() {
  // dev version should output a version string
  const result = await run(['version']);
  assert.strictEqual(result.exitCode, 0);
  assert.match(result.stdout, /\d+\.\d+\.\d+/);

  // dev help should list services
  const help = await run(['help']);
  assert.strictEqual(help.exitCode, 0);
  assert.ok(help.stdout.includes('config'));
  assert.ok(help.stdout.includes('tools'));
}

module.exports = test;
```

### Step 4: Test files to create

- `test/version-help.test.js` — version outputs semver, help lists all services
- `test/config.test.js` — config show works (may need a temp HOME), config get with valid and invalid keys
- `test/machine.test.js` — machine detect runs without error, machine show outputs JSON
- `test/ignore.test.js` — ignore list shows technologies, ignore add/remove in a temp directory
- `test/tools.test.js` — tools list returns registry, tools check for a known tool (git)
- `test/identity.test.js` — identity list works (empty state), identity add and remove
- `test/util.test.js` — util list shows built-in utilities
- `test/alias.test.js` — alias list works (empty state)
- `test/status.test.js` — status returns structured output
- `test/schema.test.js` — schema with a valid path returns command info
- `test/unknown.test.js` — unknown commands return exit code 1 with error message

### Step 5: Create a test runner

Create `test/run.js` that discovers all `.test.js` files and runs them in sequence:

```javascript
const fs = require('fs');
const path = require('path');

async function main() {
  const testDir = __dirname;
  const files = fs.readdirSync(testDir)
    .filter(f => f.endsWith('.test.js'))
    .sort();

  let passed = 0;
  let failed = 0;

  for (const file of files) {
    const name = file.replace('.test.js', '');
    try {
      const testFn = require(path.join(testDir, file));
      await testFn();
      console.log(`  PASS  ${name}`);
      passed++;
    } catch (err) {
      console.error(`  FAIL  ${name}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
```

### Step 6: Update package.json

Change the test script from the placeholder to:

```json
"test": "node test/run.js"
```

### Step 7: Handle test isolation

Some tests (config, ignore, alias) modify files. Use a temporary directory as HOME for those tests so they don't touch the real `~/.devutils/`. Pass `HOME` (or `USERPROFILE` on Windows) through the env option in the helper.

## Files to Create or Modify

- `test/helpers.js` — Test runner helper (spawn CLI, capture output)
- `test/run.js` — Test discovery and execution
- `test/version-help.test.js` — Version and help command tests
- `test/config.test.js` — Config service tests
- `test/machine.test.js` — Machine service tests
- `test/ignore.test.js` — Ignore service tests (uses temp dir)
- `test/tools.test.js` — Tools service tests
- `test/identity.test.js` — Identity service tests
- `test/util.test.js` — Util service tests
- `test/alias.test.js` — Alias service tests
- `test/status.test.js` — Status command test
- `test/schema.test.js` — Schema introspection test
- `test/unknown.test.js` — Unknown command error handling
- `package.json` — Update test script

## Acceptance Criteria

- [ ] `npm test` runs all test files and reports pass/fail counts
- [ ] Every core service has at least one passing test
- [ ] Tests that modify files use a temporary directory (no side effects)
- [ ] Unknown commands return exit code 1
- [ ] `dev version` outputs a valid semver string
- [ ] `dev help` lists all registered services
- [ ] Exit code is 0 when all tests pass, 1 when any fail

## Testing

```bash
# Run all tests
npm test

# Expected output:
#   PASS  alias
#   PASS  config
#   PASS  identity
#   PASS  ignore
#   PASS  machine
#   PASS  schema
#   PASS  status
#   PASS  tools
#   PASS  unknown
#   PASS  util
#   PASS  version-help
#
# 11 passed, 0 failed
```

## Notes

- Tests should be fast. Each test file should complete in under 5 seconds. If a test needs to wait for something (like a network call), mock it or skip it.
- Don't test API plugins here — those have their own repos and tests. Only test the core CLI.
- The test helper sets a timeout of 10 seconds per spawn. If a command hangs (e.g., waiting for stdin), the test will fail with a timeout error instead of hanging forever.
- Some commands (like `config init`) prompt for input in interactive mode. Tests should set an environment variable (like `CI=true`) so prompts return defaults.
- Keep tests simple. Each test should verify one behavior. If a test is getting long, split it into two.
