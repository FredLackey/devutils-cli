#!/usr/bin/env node

/**
 * get-course - Download a Pluralsight course using yt-dlp
 *
 * Migrated from legacy dotfiles alias.
 * Original:
 *   get-course(){
 *     local usage="get-course %COURSE_NAME_FROM_URL% %USERNAME% %PASSWORD%";
 *     local course="$1";
 *     local username="$2";
 *     local password="$3";
 *     local prefix="";
 *     if [ -e "/usr/local/bin/yt-dlp" ]; then
 *         prefix="/usr/local/bin/";
 *     fi
 *     if [ -z "$course" ]; then
 *       echo "Problem getting Pluralisight course: Course name not supplied"
 *       echo "$usage"
 *     elif [ -z "$username" ]; then
 *       echo "Problem getting Pluralisight course: Username not supplied"
 *       echo "$usage"
 *     elif [ -z "$password" ]; then
 *       echo "Problem getting Pluralisight course: Password not supplied"
 *       echo "$usage"
 *     else
 *       eval "${prefix}yt-dlp --verbose --username $username --password $password --rate-limit 50K --sleep-interval 600 -o \"%(autonumber)s - %(title)s.%(ext)s\" \"https://app.pluralsight.com/library/courses/${course}\""
 *     fi
 *   }
 *
 * This script downloads a course from Pluralsight using yt-dlp with:
 * - Authentication via username/password
 * - Rate limiting (50KB/s) to avoid detection
 * - Sleep intervals (600 seconds) between downloads
 * - Verbose output for debugging
 * - Numbered filenames with course titles
 *
 * @module scripts/get-course
 */

const os = require('../utils/common/os');
const shell = require('../utils/common/shell');

/**
 * Usage string displayed when required arguments are missing.
 * Shows the expected format for invoking the command.
 */
const USAGE = 'get-course <course-name-from-url> <username> <password>';

/**
 * Checks if yt-dlp is installed on the system.
 * Uses the shell utility's pure Node.js implementation to locate the executable.
 *
 * @returns {boolean} True if yt-dlp is found in PATH, false otherwise
 */
function isYtDlpInstalled() {
  return shell.commandExists('yt-dlp');
}

/**
 * Displays an error message with installation instructions for yt-dlp.
 * Instructions vary by platform to show the appropriate package manager.
 *
 * @param {string} platformType - The detected platform type (macos, ubuntu, etc.)
 */
function showYtDlpInstallInstructions(platformType) {
  console.error('Error: yt-dlp is required but not installed.');
  console.error('');

  // Show platform-specific installation instructions
  switch (platformType) {
    case 'macos':
      console.error('Install it with:');
      console.error('  brew install yt-dlp');
      break;
    case 'ubuntu':
    case 'debian':
    case 'raspbian':
      console.error('Install it with:');
      console.error('  sudo apt install yt-dlp');
      console.error('');
      console.error('Or install via pip for the latest version:');
      console.error('  pip install yt-dlp');
      break;
    case 'amazon_linux':
    case 'rhel':
    case 'fedora':
      console.error('Install it with:');
      console.error('  pip install yt-dlp');
      console.error('');
      console.error('Or on Fedora:');
      console.error('  sudo dnf install yt-dlp');
      break;
    case 'windows':
    case 'cmd':
    case 'powershell':
      console.error('Install it with:');
      console.error('  winget install yt-dlp');
      console.error('');
      console.error('Or with Chocolatey:');
      console.error('  choco install yt-dlp');
      break;
    case 'gitbash':
      console.error('Install it with:');
      console.error('  Download from: https://github.com/yt-dlp/yt-dlp/releases');
      console.error('  Or use: pip install yt-dlp');
      break;
    default:
      console.error('Install it from: https://github.com/yt-dlp/yt-dlp');
  }
}

/**
 * Validates the command line arguments.
 * Checks that course name, username, and password are all provided.
 *
 * @param {string[]} args - Command line arguments [course, username, password]
 * @returns {{ valid: boolean, course?: string, username?: string, password?: string, error?: string }}
 */
function validateArgs(args) {
  const [course, username, password] = args;

  if (!course || course.trim() === '') {
    return {
      valid: false,
      error: 'Problem getting Pluralsight course: Course name not supplied'
    };
  }

  if (!username || username.trim() === '') {
    return {
      valid: false,
      error: 'Problem getting Pluralsight course: Username not supplied'
    };
  }

  if (!password || password.trim() === '') {
    return {
      valid: false,
      error: 'Problem getting Pluralsight course: Password not supplied'
    };
  }

  return {
    valid: true,
    course: course.trim(),
    username: username.trim(),
    password: password.trim()
  };
}

/**
 * Pure Node.js implementation for downloading Pluralsight courses.
 *
 * This function uses yt-dlp which is a cross-platform tool, so the same
 * command works on all operating systems. The implementation validates
 * arguments, checks for yt-dlp, and then spawns the download process.
 *
 * Since yt-dlp provides the actual download functionality and works
 * identically across platforms, all platform-specific functions delegate
 * to this implementation.
 *
 * @param {string[]} args - Command line arguments [course, username, password]
 * @param {string} platformType - The detected platform type (for error messages)
 * @returns {Promise<void>}
 */
async function do_get_course_nodejs(args, platformType = 'unknown') {
  // Step 1: Validate arguments
  const validation = validateArgs(args);
  if (!validation.valid) {
    console.error(validation.error);
    console.error(USAGE);
    process.exit(1);
  }

  // Step 2: Check if yt-dlp is installed
  if (!isYtDlpInstalled()) {
    showYtDlpInstallInstructions(platformType);
    process.exit(1);
  }

  // Step 3: Build the Pluralsight URL
  const { course, username, password } = validation;
  const courseUrl = `https://app.pluralsight.com/library/courses/${course}`;

  // Step 4: Build yt-dlp arguments
  // Using the same parameters as the original bash function:
  // --verbose: Show detailed output for debugging
  // --username/--password: Pluralsight authentication
  // --rate-limit 50K: Limit download speed to 50KB/s to avoid detection
  // --sleep-interval 600: Wait 600 seconds (10 minutes) between each video
  // -o: Output template with auto-numbering and title
  const ytdlpArgs = [
    '--verbose',
    '--username', username,
    '--password', password,
    '--rate-limit', '50K',
    '--sleep-interval', '600',
    '-o', '%(autonumber)s - %(title)s.%(ext)s',
    courseUrl
  ];

  console.log(`Downloading Pluralsight course: ${course}`);
  console.log('');
  console.log('Note: This process uses rate limiting and sleep intervals to avoid detection.');
  console.log('      Videos will be downloaded slowly with 10-minute pauses between each.');
  console.log('');

  // Step 5: Execute yt-dlp with streaming output
  // We use spawnAsync to show real-time progress from yt-dlp
  const result = await shell.spawnAsync('yt-dlp', ytdlpArgs, {
    onStdout: (data) => process.stdout.write(data),
    onStderr: (data) => process.stderr.write(data)
  });

  if (result.code !== 0) {
    console.error('');
    console.error('Error: yt-dlp exited with code', result.code);
    console.error('');
    console.error('Common issues:');
    console.error('  - Invalid username or password');
    console.error('  - Course name is incorrect (check the URL)');
    console.error('  - Your Pluralsight subscription may not include this course');
    console.error('  - yt-dlp may need to be updated: pip install -U yt-dlp');
    process.exit(result.code);
  }

  console.log('');
  console.log('Download complete!');
}

/**
 * Downloads a Pluralsight course on macOS.
 *
 * Uses the shared Node.js implementation since yt-dlp works identically
 * across all platforms. The only macOS-specific aspect is the installation
 * instructions shown if yt-dlp is missing (recommends Homebrew).
 *
 * @param {string[]} args - Command line arguments [course, username, password]
 * @returns {Promise<void>}
 */
async function do_get_course_macos(args) {
  return do_get_course_nodejs(args, 'macos');
}

/**
 * Downloads a Pluralsight course on Ubuntu.
 *
 * Uses the shared Node.js implementation since yt-dlp works identically
 * across all platforms. The only Ubuntu-specific aspect is the installation
 * instructions shown if yt-dlp is missing (recommends apt or pip).
 *
 * @param {string[]} args - Command line arguments [course, username, password]
 * @returns {Promise<void>}
 */
async function do_get_course_ubuntu(args) {
  return do_get_course_nodejs(args, 'ubuntu');
}

/**
 * Downloads a Pluralsight course on Raspberry Pi OS.
 *
 * Uses the shared Node.js implementation since yt-dlp works identically
 * across all platforms. On Raspberry Pi, downloads may be slower due to
 * hardware limitations, but the rate limiting is already conservative.
 *
 * @param {string[]} args - Command line arguments [course, username, password]
 * @returns {Promise<void>}
 */
async function do_get_course_raspbian(args) {
  return do_get_course_nodejs(args, 'raspbian');
}

/**
 * Downloads a Pluralsight course on Amazon Linux.
 *
 * Uses the shared Node.js implementation since yt-dlp works identically
 * across all platforms. On Amazon Linux, yt-dlp is typically installed via pip.
 *
 * @param {string[]} args - Command line arguments [course, username, password]
 * @returns {Promise<void>}
 */
async function do_get_course_amazon_linux(args) {
  return do_get_course_nodejs(args, 'amazon_linux');
}

/**
 * Downloads a Pluralsight course on Windows Command Prompt.
 *
 * Uses the shared Node.js implementation since yt-dlp works identically
 * across all platforms. On Windows, yt-dlp can be installed via winget
 * or Chocolatey.
 *
 * @param {string[]} args - Command line arguments [course, username, password]
 * @returns {Promise<void>}
 */
async function do_get_course_cmd(args) {
  return do_get_course_nodejs(args, 'cmd');
}

/**
 * Downloads a Pluralsight course on Windows PowerShell.
 *
 * Uses the shared Node.js implementation since yt-dlp works identically
 * across all platforms. The behavior is the same as CMD.
 *
 * @param {string[]} args - Command line arguments [course, username, password]
 * @returns {Promise<void>}
 */
async function do_get_course_powershell(args) {
  return do_get_course_nodejs(args, 'powershell');
}

/**
 * Downloads a Pluralsight course in Git Bash on Windows.
 *
 * Uses the shared Node.js implementation since yt-dlp works identically
 * across all platforms. Git Bash provides a Unix-like environment on Windows.
 *
 * @param {string[]} args - Command line arguments [course, username, password]
 * @returns {Promise<void>}
 */
async function do_get_course_gitbash(args) {
  return do_get_course_nodejs(args, 'gitbash');
}

/**
 * Main entry point - detects environment and executes appropriate implementation.
 *
 * Downloads a course from Pluralsight using yt-dlp with authentication,
 * rate limiting, and sleep intervals to avoid detection. The course name
 * should be extracted from the Pluralsight course URL.
 *
 * Example:
 *   For URL: https://app.pluralsight.com/library/courses/javascript-fundamentals
 *   Use course name: javascript-fundamentals
 *
 * Usage:
 *   get-course <course-name-from-url> <username> <password>
 *
 * Downloaded files are saved to the current directory with format:
 *   01 - Introduction.mp4
 *   02 - Getting Started.mp4
 *   etc.
 *
 * @param {string[]} args - Command line arguments [course, username, password]
 * @returns {Promise<void>}
 */
async function do_get_course(args) {
  const platform = os.detect();

  const handlers = {
    'macos': do_get_course_macos,
    'ubuntu': do_get_course_ubuntu,
    'debian': do_get_course_ubuntu,
    'raspbian': do_get_course_raspbian,
    'amazon_linux': do_get_course_amazon_linux,
    'rhel': do_get_course_amazon_linux,
    'fedora': do_get_course_ubuntu,
    'linux': do_get_course_ubuntu,
    'wsl': do_get_course_ubuntu,
    'cmd': do_get_course_cmd,
    'windows': do_get_course_cmd,
    'powershell': do_get_course_powershell,
    'gitbash': do_get_course_gitbash
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
  main: do_get_course,
  do_get_course,
  do_get_course_nodejs,
  do_get_course_macos,
  do_get_course_ubuntu,
  do_get_course_raspbian,
  do_get_course_amazon_linux,
  do_get_course_cmd,
  do_get_course_powershell,
  do_get_course_gitbash
};

if (require.main === module) {
  do_get_course(process.argv.slice(2));
}
