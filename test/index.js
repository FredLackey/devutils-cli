'use strict';

/**
 * Main test entry point.
 * Loads and runs all test suites, then prints the summary and exits.
 */

const { report } = require('./runner');
const testCore = require('./test-core');
const testConfig = require('./test-config');

async function main() {
  console.log('DevUtils CLI - Integration Tests');
  console.log('================================');

  await testCore.run();
  await testConfig.run();

  const exitCode = report();
  process.exit(exitCode);
}

main().catch((err) => {
  console.error('Test runner failed:', err);
  process.exit(1);
});
