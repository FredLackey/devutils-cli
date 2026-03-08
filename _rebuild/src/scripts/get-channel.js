#!/usr/bin/env node

/**
 * get-channel - Download all videos from a YouTube channel using yt-dlp
 *
 * Migrated from legacy dotfiles alias.
 * Original:
 *   get-channel(){
 *       local usage="get-channel %COURSE_NAME_FROM_URL%";
 *       local channel="$1";
 *       local prefix="";
 *       if [ -e "/usr/local/bin/yt-dlp" ]; then
 *           prefix="/usr/local/bin/";
 *       fi
 *       if [ -z "$channel" ]; then
 *         echo "Problem getting Youtube channel: Channel name not supplied"
 *         echo "$usage"
 *       else
 *         eval "${prefix}yt-dlp -f best -ciw -v -o \"%(upload_date)s - %(title)s.%(ext)s\" https://www.youtube.com/user/$channel"
 *       fi
 *   }
 *
 * This script downloads all videos from a YouTube channel using yt-dlp.
 * Files are named with the upload date prefix for chronological organization:
 *   20230415 - Video Title.mp4
 *
 * The script accepts either:
 * - A channel name (e.g., "channelname") - will be converted to full URL
 * - A full YouTube URL (channel, user, or custom URL)
 *
 * @module scripts/get-channel
 */

const os = require('../utils/common/os');
const { execSync, spawnSync } = require('child_process');

/**
 * Helper function to check if a command exists on the system.
 * Used to verify yt-dlp is installed before attempting to run it.
 *
 * @param {string} cmd - The command name to check
 * @returns {boolean} True if the command exists, false otherwise
 */
function isCommandAvailable(cmd) {
  try {
    // Use 'which' on Unix-like systems, 'where' on Windows
    const checkCmd = process.platform === 'win32' ? `where ${cmd}` : `which ${cmd}`;
    execSync(checkCmd, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Displays usage information for the get-channel command.
 * Called when no arguments are provided or when help is requested.
 */
function showUsage() {
  console.log('Usage: get-channel <channel-name-or-url>');
  console.log('');
  console.log('Download all videos from a YouTube channel.');
  console.log('');
  console.log('Arguments:');
  console.log('  channel-name-or-url   YouTube channel name or full URL');
  console.log('');
  console.log('Examples:');
  console.log('  get-channel channelname');
  console.log('  get-channel https://www.youtube.com/user/channelname');
  console.log('  get-channel https://www.youtube.com/c/CustomChannelName');
  console.log('  get-channel https://www.youtube.com/@HandleName');
  console.log('');
  console.log('Output files are named: YYYYMMDD - Video Title.ext');
  console.log('');
  console.log('yt-dlp options used:');
  console.log('  -f best     Select best quality format');
  console.log('  -c          Continue partial downloads');
  console.log('  -i          Ignore errors and continue');
  console.log('  -w          Do not overwrite existing files');
  console.log('  -v          Verbose output');
}

/**
 * Determines the full YouTube URL from the provided input.
 * Handles channel names, user URLs, custom URLs, and handle URLs.
 *
 * @param {string} input - Channel name or URL
 * @returns {string} Full YouTube URL
 */
function resolveChannelUrl(input) {
  // If it's already a full URL, return it as-is
  if (input.startsWith('http://') || input.startsWith('https://')) {
    return input;
  }

  // If it starts with @, it's a handle - construct the URL
  if (input.startsWith('@')) {
    return `https://www.youtube.com/${input}`;
  }

  // Otherwise, assume it's a legacy username and construct the user URL
  // This matches the original alias behavior
  return `https://www.youtube.com/user/${input}`;
}

/**
 * Pure Node.js implementation - NOT FULLY APPLICABLE for this script.
 *
 * This script relies on yt-dlp, which is an external command-line tool
 * that must be installed separately. There is no pure Node.js alternative
 * for downloading YouTube videos with the same capabilities.
 *
 * The core logic (URL resolution, argument validation) is in pure Node.js,
 * but the actual download requires the external yt-dlp tool.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_get_channel_nodejs(args) {
  // Validate arguments
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    showUsage();
    if (args.length === 0) {
      console.error('');
      console.error('Error: Channel name or URL not supplied');
      process.exit(1);
    }
    return;
  }

  const input = args[0];
  const channelUrl = resolveChannelUrl(input);

  // Check if yt-dlp is installed
  if (!isCommandAvailable('yt-dlp')) {
    console.error('Error: yt-dlp is required but not installed.');
    console.error('');
    console.error('Install yt-dlp using one of these methods:');
    if (process.platform === 'darwin') {
      console.error('  brew install yt-dlp');
    } else if (process.platform === 'win32') {
      console.error('  winget install yt-dlp');
      console.error('  choco install yt-dlp');
    } else {
      console.error('  sudo apt install yt-dlp        # Debian/Ubuntu');
      console.error('  sudo dnf install yt-dlp        # Fedora/RHEL');
      console.error('  pip install yt-dlp             # Using pip');
    }
    console.error('');
    console.error('Or download from: https://github.com/yt-dlp/yt-dlp');
    process.exit(1);
  }

  console.log(`Downloading videos from: ${channelUrl}`);
  console.log('Files will be named: YYYYMMDD - Video Title.ext');
  console.log('');

  // Build the yt-dlp command with the same flags as the original alias:
  // -f best : Select best quality format
  // -c : Continue partial downloads
  // -i : Ignore errors (continue on download errors)
  // -w : Do not overwrite existing files (skip already downloaded)
  // -v : Verbose output for debugging
  // -o "%(upload_date)s - %(title)s.%(ext)s" : Output filename template
  const ytdlpArgs = [
    '-f', 'best',
    '-c',
    '-i',
    '-w',
    '-v',
    '-o', '%(upload_date)s - %(title)s.%(ext)s',
    channelUrl
  ];

  // Use spawnSync to run yt-dlp with inherited stdio for real-time output
  const result = spawnSync('yt-dlp', ytdlpArgs, {
    stdio: 'inherit',
    shell: false
  });

  if (result.error) {
    console.error('Error executing yt-dlp:', result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    // yt-dlp may return non-zero for partial failures (some videos failed)
    // With -i flag, it continues despite errors, so we just warn
    console.log('');
    console.log('yt-dlp finished with exit code:', result.status);
    console.log('Some videos may have failed to download. Check the output above.');
  }
}

/**
 * Download videos from a YouTube channel on macOS.
 *
 * Uses the same yt-dlp approach on all platforms since yt-dlp is
 * cross-platform. The only difference is how yt-dlp might be installed.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_get_channel_macos(args) {
  return do_get_channel_nodejs(args);
}

/**
 * Download videos from a YouTube channel on Ubuntu.
 *
 * Uses yt-dlp which can be installed via apt, pip, or downloaded directly.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_get_channel_ubuntu(args) {
  return do_get_channel_nodejs(args);
}

/**
 * Download videos from a YouTube channel on Raspberry Pi OS.
 *
 * Uses yt-dlp which can be installed via apt or pip.
 * Note: Video downloads can be resource-intensive on Raspberry Pi.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_get_channel_raspbian(args) {
  return do_get_channel_nodejs(args);
}

/**
 * Download videos from a YouTube channel on Amazon Linux.
 *
 * Uses yt-dlp which can be installed via pip or downloaded directly.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_get_channel_amazon_linux(args) {
  return do_get_channel_nodejs(args);
}

/**
 * Download videos from a YouTube channel on Windows Command Prompt.
 *
 * Uses yt-dlp which can be installed via winget, choco, or downloaded directly.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_get_channel_cmd(args) {
  return do_get_channel_nodejs(args);
}

/**
 * Download videos from a YouTube channel on Windows PowerShell.
 *
 * Uses yt-dlp which can be installed via winget, choco, or downloaded directly.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_get_channel_powershell(args) {
  return do_get_channel_nodejs(args);
}

/**
 * Download videos from a YouTube channel in Git Bash on Windows.
 *
 * Uses yt-dlp which should be available in the Windows PATH.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_get_channel_gitbash(args) {
  return do_get_channel_nodejs(args);
}

/**
 * Main entry point - detects environment and executes appropriate implementation.
 *
 * The "get-channel" command downloads all videos from a YouTube channel using
 * yt-dlp. This is useful for archiving channel content or downloading entire
 * series for offline viewing.
 *
 * Files are named with the upload date prefix (YYYYMMDD - Title.ext) for easy
 * chronological sorting. The script uses yt-dlp's best format selection and
 * will skip already-downloaded files.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_get_channel(args) {
  const platform = os.detect();

  const handlers = {
    'macos': do_get_channel_macos,
    'ubuntu': do_get_channel_ubuntu,
    'debian': do_get_channel_ubuntu,
    'raspbian': do_get_channel_raspbian,
    'amazon_linux': do_get_channel_amazon_linux,
    'rhel': do_get_channel_amazon_linux,
    'fedora': do_get_channel_ubuntu,
    'linux': do_get_channel_ubuntu,
    'wsl': do_get_channel_ubuntu,
    'cmd': do_get_channel_cmd,
    'windows': do_get_channel_cmd,
    'powershell': do_get_channel_powershell,
    'gitbash': do_get_channel_gitbash
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
  main: do_get_channel,
  do_get_channel,
  do_get_channel_nodejs,
  do_get_channel_macos,
  do_get_channel_ubuntu,
  do_get_channel_raspbian,
  do_get_channel_amazon_linux,
  do_get_channel_cmd,
  do_get_channel_powershell,
  do_get_channel_gitbash
};

if (require.main === module) {
  do_get_channel(process.argv.slice(2));
}
