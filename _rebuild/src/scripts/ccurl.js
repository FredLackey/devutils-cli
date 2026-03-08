#!/usr/bin/env node

/**
 * ccurl - Fetch a URL expecting JSON and pretty-print the output
 *
 * Migrated from legacy dotfiles alias.
 * Original:
 *   ccurl() {
 *     if [ -z "$1" ]; then
 *       echo "Usage: ccurl <URL>"
 *       return 1
 *     fi
 *     curl -s -H "Accept: application/json" "$1" | jq
 *   }
 *
 * This script fetches a URL with an Accept: application/json header and
 * pretty-prints the JSON response with syntax highlighting (if supported).
 * Unlike the original bash version that required curl and jq to be installed,
 * this Node.js implementation uses the built-in fetch() API and JSON methods,
 * making it work on any system with Node.js 22+ without external dependencies.
 *
 * @module scripts/ccurl
 */

const os = require('../utils/common/os');

/**
 * Pretty-prints JSON with indentation.
 *
 * Takes a parsed JSON object and returns a formatted string with 2-space
 * indentation. This replicates what jq does by default without any arguments.
 *
 * @param {any} data - The parsed JSON data to format
 * @returns {string} The formatted JSON string
 */
function prettyPrintJson(data) {
  return JSON.stringify(data, null, 2);
}

/**
 * Pure Node.js implementation using the built-in fetch() API.
 *
 * This implementation works on ALL platforms because Node.js 22+ includes
 * fetch() natively. There is no need for platform-specific code - we can
 * make HTTP requests and parse JSON entirely within Node.js.
 *
 * Key differences from the original bash version:
 * - Uses native fetch() instead of shelling out to curl
 * - Uses JSON.parse() and JSON.stringify() instead of jq
 * - Works on any platform with Node.js 22+ without external tools
 * - Provides better error handling and clearer error messages
 *
 * @param {string[]} args - Command line arguments
 * @param {string} args.0 - URL to fetch (required)
 * @returns {Promise<void>}
 */
async function do_ccurl_nodejs(args) {
  // Check if a URL was provided
  const url = args[0];
  if (!url) {
    console.error('Usage: ccurl <URL>');
    console.error('');
    console.error('Fetches a URL expecting JSON and pretty-prints the response.');
    console.error('');
    console.error('Examples:');
    console.error('  ccurl https://api.github.com/users/octocat');
    console.error('  ccurl https://jsonplaceholder.typicode.com/posts/1');
    process.exit(1);
  }

  // Validate that the URL looks reasonable
  // Note: We don't use URL constructor validation because the user might
  // provide a URL without a protocol, and we want a helpful error message
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    console.error(`Error: Invalid URL format: ${url}`);
    console.error('');
    console.error('URL must start with http:// or https://');
    console.error('');
    console.error('Example: ccurl https://api.example.com/data');
    process.exit(1);
  }

  try {
    // Make the HTTP request with Accept: application/json header
    // This mimics the original: curl -s -H "Accept: application/json" "$1"
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        // Include a User-Agent to avoid being blocked by some APIs
        'User-Agent': 'ccurl/1.0 (devutils-cli)'
      }
    });

    // Check if the response was successful
    if (!response.ok) {
      console.error(`Error: HTTP ${response.status} ${response.statusText}`);
      // Try to get the response body for more context
      try {
        const errorBody = await response.text();
        if (errorBody) {
          // Try to parse and pretty-print if it's JSON
          try {
            const errorJson = JSON.parse(errorBody);
            console.error('Response body:');
            console.error(prettyPrintJson(errorJson));
          } catch {
            // Not JSON, just print the raw text (truncated if too long)
            const truncated = errorBody.length > 500
              ? errorBody.substring(0, 500) + '...'
              : errorBody;
            console.error('Response body:');
            console.error(truncated);
          }
        }
      } catch {
        // Could not read response body, that's okay
      }
      process.exit(1);
    }

    // Get the response body as text first
    const responseText = await response.text();

    // Check if we got any content
    if (!responseText || responseText.trim() === '') {
      console.log('(empty response)');
      return;
    }

    // Try to parse the response as JSON
    let jsonData;
    try {
      jsonData = JSON.parse(responseText);
    } catch (parseError) {
      // Response is not valid JSON
      console.error('Error: Response is not valid JSON');
      console.error('');
      console.error('Content-Type:', response.headers.get('content-type') || 'not specified');
      console.error('');
      console.error('Raw response (first 500 chars):');
      const truncated = responseText.length > 500
        ? responseText.substring(0, 500) + '...'
        : responseText;
      console.error(truncated);
      process.exit(1);
    }

    // Pretty-print the JSON output
    // This replicates what jq does by default
    console.log(prettyPrintJson(jsonData));

  } catch (error) {
    // Handle network errors, DNS failures, etc.
    if (error.cause && error.cause.code === 'ENOTFOUND') {
      console.error(`Error: Could not resolve hostname for ${url}`);
      console.error('');
      console.error('Check that the URL is correct and you have network connectivity.');
    } else if (error.cause && error.cause.code === 'ECONNREFUSED') {
      console.error(`Error: Connection refused for ${url}`);
      console.error('');
      console.error('The server is not accepting connections on the specified port.');
    } else if (error.cause && error.cause.code === 'ETIMEDOUT') {
      console.error(`Error: Connection timed out for ${url}`);
      console.error('');
      console.error('The server took too long to respond.');
    } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.error(`Error: Invalid URL: ${url}`);
      console.error('');
      console.error('Make sure the URL is properly formatted.');
    } else {
      console.error(`Error fetching ${url}:`);
      console.error(error.message || error);
    }
    process.exit(1);
  }
}

/**
 * Fetch JSON from URL on macOS.
 *
 * Uses the pure Node.js implementation since fetch() works identically
 * on all platforms. No macOS-specific code is needed.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_ccurl_macos(args) {
  return do_ccurl_nodejs(args);
}

/**
 * Fetch JSON from URL on Ubuntu.
 *
 * Uses the pure Node.js implementation since fetch() works identically
 * on all platforms. No Ubuntu-specific code is needed.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_ccurl_ubuntu(args) {
  return do_ccurl_nodejs(args);
}

/**
 * Fetch JSON from URL on Raspberry Pi OS.
 *
 * Uses the pure Node.js implementation since fetch() works identically
 * on all platforms. No Raspbian-specific code is needed.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_ccurl_raspbian(args) {
  return do_ccurl_nodejs(args);
}

/**
 * Fetch JSON from URL on Amazon Linux.
 *
 * Uses the pure Node.js implementation since fetch() works identically
 * on all platforms. No Amazon Linux-specific code is needed.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_ccurl_amazon_linux(args) {
  return do_ccurl_nodejs(args);
}

/**
 * Fetch JSON from URL on Windows Command Prompt.
 *
 * Uses the pure Node.js implementation since fetch() works identically
 * on all platforms. No Windows CMD-specific code is needed.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_ccurl_cmd(args) {
  return do_ccurl_nodejs(args);
}

/**
 * Fetch JSON from URL on Windows PowerShell.
 *
 * Uses the pure Node.js implementation since fetch() works identically
 * on all platforms. No PowerShell-specific code is needed.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_ccurl_powershell(args) {
  return do_ccurl_nodejs(args);
}

/**
 * Fetch JSON from URL on Git Bash.
 *
 * Uses the pure Node.js implementation since fetch() works identically
 * on all platforms. No Git Bash-specific code is needed.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_ccurl_gitbash(args) {
  return do_ccurl_nodejs(args);
}

/**
 * Main entry point - detects environment and executes appropriate implementation.
 *
 * The "ccurl" command fetches a URL expecting JSON and pretty-prints the output.
 * This is useful for quickly inspecting API responses from the command line.
 *
 * Since this functionality is implemented entirely in Node.js using the built-in
 * fetch() API, it works identically on all platforms. The platform detection is
 * included for consistency with other scripts in this project, but all platforms
 * delegate to the same Node.js implementation.
 *
 * Usage:
 *   ccurl <URL>
 *
 * Examples:
 *   ccurl https://api.github.com/users/octocat
 *   ccurl https://jsonplaceholder.typicode.com/posts/1
 *   ccurl https://httpbin.org/get
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_ccurl(args) {
  const platform = os.detect();

  const handlers = {
    'macos': do_ccurl_macos,
    'ubuntu': do_ccurl_ubuntu,
    'debian': do_ccurl_ubuntu,
    'raspbian': do_ccurl_raspbian,
    'amazon_linux': do_ccurl_amazon_linux,
    'rhel': do_ccurl_amazon_linux,
    'fedora': do_ccurl_ubuntu,
    'linux': do_ccurl_ubuntu,
    'wsl': do_ccurl_ubuntu,
    'cmd': do_ccurl_cmd,
    'windows': do_ccurl_cmd,
    'powershell': do_ccurl_powershell,
    'gitbash': do_ccurl_gitbash
  };

  const handler = handlers[platform.type];
  if (!handler) {
    console.error(`Platform '${platform.type}' is not supported for this command.`);
    console.error('');
    console.error('Supported platforms:');
    console.error('  - macOS');
    console.error('  - Ubuntu, Debian, and other Linux distributions');
    console.error('  - Raspberry Pi OS');
    console.error('  - Amazon Linux, RHEL, Fedora');
    console.error('  - Windows (CMD, PowerShell, Git Bash)');
    process.exit(1);
  }

  await handler(args);
}

module.exports = {
  main: do_ccurl,
  do_ccurl,
  do_ccurl_nodejs,
  do_ccurl_macos,
  do_ccurl_ubuntu,
  do_ccurl_raspbian,
  do_ccurl_amazon_linux,
  do_ccurl_cmd,
  do_ccurl_powershell,
  do_ccurl_gitbash
};

if (require.main === module) {
  do_ccurl(process.argv.slice(2));
}
