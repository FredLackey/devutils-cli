#!/usr/bin/env node

/**
 * Balena Etcher Installer Test Script
 *
 * This script validates the balena-etcher installer logic for all platforms.
 * Since we're running on ARM64 (Apple Silicon), we mock the x64 architecture
 * to test the installation flow without actually installing the package.
 */

const os = require('../src/utils/common/os');
const shell = require('../src/utils/common/shell');

// Store original functions
const originalGetArch = os.getArch;
const originalExec = shell.exec;
const originalCommandExists = shell.commandExists;

// Mock tracking
let mockCalls = [];
let commandExistsResults = {};

// Mock shell.exec to record commands without executing them
function mockExec(command, options) {
  mockCalls.push({ type: 'exec', command, options });

  // Simulate successful command execution
  if (command.includes('wget')) {
    return Promise.resolve({ stdout: '', stderr: '', code: 0 });
  }
  if (command.includes('apt-get install')) {
    return Promise.resolve({ stdout: 'Installation successful', stderr: '', code: 0 });
  }
  if (command.includes('dnf install') || command.includes('yum install')) {
    return Promise.resolve({ stdout: 'Installation successful', stderr: '', code: 0 });
  }
  if (command.includes('dpkg -l')) {
    return Promise.resolve({ stdout: '', stderr: '', code: 1 }); // Not installed
  }
  if (command.includes('rpm -q')) {
    return Promise.resolve({ stdout: '', stderr: '', code: 1 }); // Not installed
  }
  if (command.includes('rm -f')) {
    return Promise.resolve({ stdout: '', stderr: '', code: 0 });
  }

  return Promise.resolve({ stdout: '', stderr: '', code: 0 });
}

// Mock shell.commandExists
function mockCommandExists(command) {
  if (commandExistsResults[command] !== undefined) {
    return commandExistsResults[command];
  }
  // Default: common commands exist
  return ['wget', 'curl', 'apt-get', 'dpkg', 'dnf', 'yum', 'rpm'].includes(command);
}

// Mock os.getArch to return x64
function mockGetArch() {
  return 'x64';
}

/**
 * Test Ubuntu/Debian installer
 */
async function testUbuntu() {
  console.log('\n=== Testing Ubuntu/Debian Installer ===');
  mockCalls = [];
  commandExistsResults = { 'wget': true, 'apt-get': true, 'dpkg': true };

  // Apply mocks
  os.getArch = mockGetArch;
  shell.exec = mockExec;
  shell.commandExists = mockCommandExists;

  // Clear require cache and reload module
  delete require.cache[require.resolve('../src/installs/balena-etcher.js')];
  const installer = require('../src/installs/balena-etcher.js');

  try {
    await installer.install_ubuntu();

    // Verify expected commands were called
    const wgetCalls = mockCalls.filter(c => c.command.includes('wget'));
    const installCalls = mockCalls.filter(c => c.command.includes('apt-get install') && c.command.includes('balena-etcher.deb'));
    const cleanupCalls = mockCalls.filter(c => c.command.includes('rm -f /tmp/balena-etcher.deb'));

    console.log(`✓ wget called: ${wgetCalls.length > 0}`);
    console.log(`✓ apt-get install called: ${installCalls.length > 0}`);
    console.log(`✓ Cleanup called: ${cleanupCalls.length > 0}`);

    if (wgetCalls.length > 0) {
      console.log(`  Download URL: ${wgetCalls[0].command.match(/https:\/\/[^\s"]+/)?.[0]}`);
    }
    if (installCalls.length > 0) {
      console.log(`  Install includes DEBIAN_FRONTEND=noninteractive: ${installCalls[0].command.includes('DEBIAN_FRONTEND=noninteractive')}`);
    }

    return {
      success: wgetCalls.length > 0 && installCalls.length > 0 && cleanupCalls.length > 0,
      calls: mockCalls.length
    };
  } catch (err) {
    console.error('✗ Error:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Test Debian installer (should use same code as Ubuntu)
 */
async function testDebian() {
  console.log('\n=== Testing Debian Installer ===');
  mockCalls = [];
  commandExistsResults = { 'wget': true, 'apt-get': true, 'dpkg': true };

  // Apply mocks
  os.getArch = mockGetArch;
  shell.exec = mockExec;
  shell.commandExists = mockCommandExists;

  // Clear require cache and reload module
  delete require.cache[require.resolve('../src/installs/balena-etcher.js')];
  const installer = require('../src/installs/balena-etcher.js');

  try {
    await installer.install_ubuntu(); // Debian uses install_ubuntu

    const wgetCalls = mockCalls.filter(c => c.command.includes('wget'));
    const installCalls = mockCalls.filter(c => c.command.includes('apt-get install') && c.command.includes('balena-etcher.deb'));

    console.log(`✓ wget called: ${wgetCalls.length > 0}`);
    console.log(`✓ apt-get install called: ${installCalls.length > 0}`);

    return {
      success: wgetCalls.length > 0 && installCalls.length > 0,
      calls: mockCalls.length
    };
  } catch (err) {
    console.error('✗ Error:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Test Amazon Linux/Fedora installer
 */
async function testAmazonLinux() {
  console.log('\n=== Testing Amazon Linux/Fedora Installer ===');
  mockCalls = [];
  commandExistsResults = { 'wget': true, 'dnf': true, 'rpm': true };

  // Apply mocks
  os.getArch = mockGetArch;
  shell.exec = mockExec;
  shell.commandExists = mockCommandExists;

  // Clear require cache and reload module
  delete require.cache[require.resolve('../src/installs/balena-etcher.js')];
  const installer = require('../src/installs/balena-etcher.js');

  try {
    await installer.install_amazon_linux();

    // Verify expected commands were called
    const wgetCalls = mockCalls.filter(c => c.command.includes('wget'));
    const installCalls = mockCalls.filter(c => (c.command.includes('dnf install') || c.command.includes('yum install')) && c.command.includes('balena-etcher.rpm'));
    const cleanupCalls = mockCalls.filter(c => c.command.includes('rm -f /tmp/balena-etcher.rpm'));

    console.log(`✓ wget called: ${wgetCalls.length > 0}`);
    console.log(`✓ dnf/yum install called: ${installCalls.length > 0}`);
    console.log(`✓ Cleanup called: ${cleanupCalls.length > 0}`);

    if (wgetCalls.length > 0) {
      console.log(`  Download URL: ${wgetCalls[0].command.match(/https:\/\/[^\s"]+/)?.[0]}`);
    }

    return {
      success: wgetCalls.length > 0 && installCalls.length > 0 && cleanupCalls.length > 0,
      calls: mockCalls.length
    };
  } catch (err) {
    console.error('✗ Error:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Test ARM64 rejection (should display helpful message)
 */
async function testARM64Rejection() {
  console.log('\n=== Testing ARM64 Architecture Rejection ===');
  mockCalls = [];

  // Apply mocks - use real getArch to get ARM64
  os.getArch = originalGetArch;
  shell.exec = mockExec;
  shell.commandExists = mockCommandExists;

  // Clear require cache and reload module
  delete require.cache[require.resolve('../src/installs/balena-etcher.js')];
  const installer = require('../src/installs/balena-etcher.js');

  try {
    await installer.install_ubuntu();

    // Should NOT have attempted download or install
    const wgetCalls = mockCalls.filter(c => c.command.includes('wget'));
    const installCalls = mockCalls.filter(c => c.command.includes('apt-get install') && c.command.includes('balena-etcher.deb'));

    console.log(`✓ wget NOT called on ARM64: ${wgetCalls.length === 0}`);
    console.log(`✓ apt-get install NOT called on ARM64: ${installCalls.length === 0}`);

    return {
      success: wgetCalls.length === 0 && installCalls.length === 0,
      calls: mockCalls.length
    };
  } catch (err) {
    console.error('✗ Error:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Test idempotency (already installed scenario)
 */
async function testIdempotency() {
  console.log('\n=== Testing Idempotency (Already Installed) ===');
  mockCalls = [];
  commandExistsResults = { 'wget': true, 'apt-get': true, 'dpkg': true };

  // Apply mocks
  os.getArch = mockGetArch;
  shell.exec = function(command, options) {
    mockCalls.push({ type: 'exec', command, options });

    // Mock package as already installed
    if (command.includes('dpkg -l') && command.includes('balena-etcher')) {
      return Promise.resolve({ stdout: 'ii  balena-etcher', stderr: '', code: 0 });
    }

    return mockExec(command, options);
  };
  shell.commandExists = mockCommandExists;

  // Clear require cache and reload module
  delete require.cache[require.resolve('../src/installs/balena-etcher.js')];
  const installer = require('../src/installs/balena-etcher.js');

  try {
    await installer.install_ubuntu();

    // Should NOT have attempted download or install
    const wgetCalls = mockCalls.filter(c => c.command.includes('wget'));
    const installCalls = mockCalls.filter(c => c.command.includes('apt-get install') && c.command.includes('balena-etcher.deb'));

    console.log(`✓ wget NOT called when already installed: ${wgetCalls.length === 0}`);
    console.log(`✓ apt-get install NOT called when already installed: ${installCalls.length === 0}`);

    return {
      success: wgetCalls.length === 0 && installCalls.length === 0,
      calls: mockCalls.length
    };
  } catch (err) {
    console.error('✗ Error:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Main test runner
 */
async function main() {
  console.log('=================================================');
  console.log('Balena Etcher Installer Validation Tests');
  console.log('=================================================');
  console.log(`Current Architecture: ${os.getArch()}`);
  console.log(`Running mocked x64 tests...`);

  const results = {
    ubuntu: await testUbuntu(),
    debian: await testDebian(),
    amazonLinux: await testAmazonLinux(),
    arm64Rejection: await testARM64Rejection(),
    idempotency: await testIdempotency()
  };

  // Restore original functions
  os.getArch = originalGetArch;
  shell.exec = originalExec;
  shell.commandExists = originalCommandExists;

  console.log('\n=================================================');
  console.log('Test Results Summary');
  console.log('=================================================');

  let allPassed = true;
  for (const [test, result] of Object.entries(results)) {
    const status = result.success ? '✓ PASS' : '✗ FAIL';
    console.log(`${status} - ${test}`);
    if (!result.success) {
      allPassed = false;
      if (result.error) {
        console.log(`       Error: ${result.error}`);
      }
    }
  }

  console.log('=================================================');

  if (allPassed) {
    console.log('\n✓ All tests passed!');
    console.log('\nNote: These are mock tests that validate installer logic.');
    console.log('Actual x64 installation requires running on x64 hardware.');
    process.exit(0);
  } else {
    console.log('\n✗ Some tests failed!');
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(err => {
    console.error('Test runner error:', err);
    process.exit(1);
  });
}

module.exports = { main };
