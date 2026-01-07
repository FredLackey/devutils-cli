#!/usr/bin/env node

/**
 * get-video - Download video from a URL using yt-dlp
 *
 * Migrated from legacy dotfiles alias.
 * Original:
 *   get-video(){
 *       local usage="get-tunes %VIDEO_URL%";
 *       local url="$1";
 *       if [ -f "/usr/local/bin/yt-dlp" ]; then
 *           prefix="/usr/local/bin/";
 *       fi
 *       if [ -z "${url}" ]; then
 *           echo "Problem fetching video: URL not supplied";
 *           echo "$usage";
 *       else
 *           echo "Excluding audio...";
 *           eval "${prefix}yt-dlp --buffer-size 16K --keep-video --prefer-insecure --format mp4 --ignore-errors --output '%(title)s.%(ext)s' $1";
 *       fi
 *   }
 *
 * This script downloads video (without audio) from a URL using yt-dlp.
 * It outputs in MP4 format, excluding any audio streams.
 *
 * Usage:
 *   get-video <url>    # Download video only as MP4 (no audio)
 *
 * Examples:
 *   get-video https://www.youtube.com/watch?v=dQw4w9WgXcQ
 *   get-video https://vimeo.com/123456789
 *
 * @module scripts/get-video
 */

const os = require('../utils/common/os');
const { execSync, spawnSync } = require('child_process');

/**
 * Display usage information for this command.
 * Shows valid command syntax and examples.
 */
function showUsage() {
  console.log('');
  console.log('Usage: get-video <url>');
  console.log('');
  console.log('Arguments:');
  console.log('  url    The URL of the video to download');
  console.log('');
  console.log('Description:');
  console.log('  Downloads video only (no audio) from a URL using yt-dlp.');
  console.log('  The output format is MP4.');
  console.log('');
  console.log('Examples:');
  console.log('  get-video https://www.youtube.com/watch?v=VIDEO_ID');
  console.log('  get-video https://vimeo.com/123456789');
  console.log('');
}

/**
 * Helper function to check if a command exists on the system.
 * Used to verify that yt-dlp is installed before attempting to use it.
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
 * Validate that the provided string looks like a URL.
 * This is a basic check to catch obvious mistakes, not a comprehensive URL validator.
 *
 * @param {string} url - The string to validate
 * @returns {boolean} True if the string appears to be a URL
 */
function isValidUrl(url) {
  // Basic URL pattern check - must start with http:// or https://
  // This catches common mistakes like forgetting the protocol
  return /^https?:\/\/.+/.test(url);
}

/**
 * Pure Node.js implementation that downloads video using yt-dlp.
 *
 * This function contains the core download logic that works identically
 * across all platforms. yt-dlp is a native command-line tool that is
 * superior for video downloads - it handles:
 * - Video extraction and format selection
 * - Playlist handling
 * - Format negotiation with video sites
 * - Error recovery
 *
 * We use yt-dlp rather than reimplementing this in Node.js because:
 * 1. yt-dlp is battle-tested and actively maintained
 * 2. It handles complex format negotiation with video sites
 * 3. It supports hundreds of video sites out of the box
 * 4. Reimplementing this in Node.js would be extremely complex
 *
 * @param {string[]} args - Command line arguments: [url]
 * @returns {Promise<void>}
 */
async function do_get_video_nodejs(args) {
  const url = args[0];

  // Check if yt-dlp is installed
  if (!isCommandAvailable('yt-dlp')) {
    console.error('Error: yt-dlp is required but not installed.');
    console.error('');
    console.error('Install yt-dlp using one of these methods:');
    console.error('');
    console.error('  macOS:');
    console.error('    brew install yt-dlp');
    console.error('');
    console.error('  Ubuntu/Debian:');
    console.error('    sudo apt install yt-dlp');
    console.error('    # or via pip: pip install yt-dlp');
    console.error('');
    console.error('  Windows:');
    console.error('    winget install yt-dlp');
    console.error('    # or: choco install yt-dlp');
    console.error('');
    console.error('  All platforms (via pip):');
    console.error('    pip install yt-dlp');
    console.error('');
    console.error('For more information: https://github.com/yt-dlp/yt-dlp');
    process.exit(1);
  }

  // Validate that a URL was provided
  if (!url) {
    console.error('Error: Video URL not supplied.');
    showUsage();
    process.exit(1);
  }

  // Validate that the URL looks valid
  if (!isValidUrl(url)) {
    console.error(`Error: Invalid URL format: ${url}`);
    console.error('URL must start with http:// or https://');
    showUsage();
    process.exit(1);
  }

  // Build the yt-dlp command for video-only download
  // The output template uses the video title for the filename
  const outputTemplate = '%(title)s.%(ext)s';

  // Video-only mode options:
  // --buffer-size 16K    : Set download buffer size (helps with slow connections)
  // --keep-video         : Keep the video file (ensures video is saved)
  // --prefer-insecure    : Use HTTP instead of HTTPS when available (sometimes faster)
  // --format mp4         : Select MP4 format for video
  // --ignore-errors      : Continue on download errors (useful for playlists)
  // --output             : Set the output filename template

  const ytdlpArgs = [
    '--buffer-size', '16K',
    '--keep-video',
    '--prefer-insecure',
    '--format', 'mp4',
    '--ignore-errors',
    '--output', outputTemplate,
    url
  ];

  // Display what we're doing
  console.log('Excluding audio (video only)...');
  console.log(`URL: ${url}`);
  console.log('');

  // Execute yt-dlp with the constructed arguments
  // Using spawnSync to properly handle argument quoting and real-time output
  const result = spawnSync('yt-dlp', ytdlpArgs, {
    stdio: 'inherit',  // Pass through stdin/stdout/stderr for real-time output
    shell: false       // Don't use shell to avoid quoting issues
  });

  // Check if yt-dlp execution succeeded
  if (result.error) {
    console.error('Error executing yt-dlp:', result.error.message);
    process.exit(1);
  }

  // Exit with yt-dlp's exit code
  if (result.status !== 0) {
    process.exit(result.status);
  }
}

/**
 * Download video on macOS using yt-dlp.
 *
 * macOS can use the exact same logic as other platforms since yt-dlp
 * is a cross-platform tool. The command syntax is identical.
 *
 * @param {string[]} args - Command line arguments: [url]
 * @returns {Promise<void>}
 */
async function do_get_video_macos(args) {
  // yt-dlp works identically on macOS - delegate to the Node.js implementation
  return do_get_video_nodejs(args);
}

/**
 * Download video on Ubuntu using yt-dlp.
 *
 * Ubuntu can use the exact same logic as other platforms since yt-dlp
 * is a cross-platform tool. The command syntax is identical.
 *
 * @param {string[]} args - Command line arguments: [url]
 * @returns {Promise<void>}
 */
async function do_get_video_ubuntu(args) {
  // yt-dlp works identically on Ubuntu - delegate to the Node.js implementation
  return do_get_video_nodejs(args);
}

/**
 * Download video on Raspberry Pi OS using yt-dlp.
 *
 * Raspberry Pi OS can use the exact same logic as other platforms since yt-dlp
 * is a cross-platform tool. The command syntax is identical.
 *
 * @param {string[]} args - Command line arguments: [url]
 * @returns {Promise<void>}
 */
async function do_get_video_raspbian(args) {
  // yt-dlp works identically on Raspbian - delegate to the Node.js implementation
  return do_get_video_nodejs(args);
}

/**
 * Download video on Amazon Linux using yt-dlp.
 *
 * Amazon Linux can use the exact same logic as other platforms since yt-dlp
 * is a cross-platform tool. The command syntax is identical.
 *
 * @param {string[]} args - Command line arguments: [url]
 * @returns {Promise<void>}
 */
async function do_get_video_amazon_linux(args) {
  // yt-dlp works identically on Amazon Linux - delegate to the Node.js implementation
  return do_get_video_nodejs(args);
}

/**
 * Download video on Windows Command Prompt using yt-dlp.
 *
 * Windows CMD can use the exact same logic as other platforms since yt-dlp
 * is a cross-platform tool. The command syntax is identical.
 *
 * @param {string[]} args - Command line arguments: [url]
 * @returns {Promise<void>}
 */
async function do_get_video_cmd(args) {
  // yt-dlp works identically on Windows CMD - delegate to the Node.js implementation
  return do_get_video_nodejs(args);
}

/**
 * Download video on Windows PowerShell using yt-dlp.
 *
 * Windows PowerShell can use the exact same logic as other platforms since yt-dlp
 * is a cross-platform tool. The command syntax is identical.
 *
 * @param {string[]} args - Command line arguments: [url]
 * @returns {Promise<void>}
 */
async function do_get_video_powershell(args) {
  // yt-dlp works identically on PowerShell - delegate to the Node.js implementation
  return do_get_video_nodejs(args);
}

/**
 * Download video on Git Bash using yt-dlp.
 *
 * Git Bash can use the exact same logic as other platforms since yt-dlp
 * is a cross-platform tool. The command syntax is identical.
 *
 * @param {string[]} args - Command line arguments: [url]
 * @returns {Promise<void>}
 */
async function do_get_video_gitbash(args) {
  // yt-dlp works identically on Git Bash - delegate to the Node.js implementation
  return do_get_video_nodejs(args);
}

/**
 * Main entry point - detects environment and executes appropriate implementation.
 *
 * The "get-video" command downloads video (excluding audio) from a URL using yt-dlp.
 * This is useful when you only need the video file without any audio tracks,
 * such as for:
 * - Creating silent background videos
 * - Video editing where you'll add your own audio
 * - Reducing file size when audio is not needed
 * - Archiving video-only content
 *
 * yt-dlp supports hundreds of video sites including:
 * - YouTube (videos, playlists, channels)
 * - Vimeo
 * - Dailymotion
 * - And many more (see: https://github.com/yt-dlp/yt-dlp/supportedsites.md)
 *
 * @param {string[]} args - Command line arguments: [url]
 * @returns {Promise<void>}
 */
async function do_get_video(args) {
  const platform = os.detect();

  const handlers = {
    'macos': do_get_video_macos,
    'ubuntu': do_get_video_ubuntu,
    'debian': do_get_video_ubuntu,
    'raspbian': do_get_video_raspbian,
    'amazon_linux': do_get_video_amazon_linux,
    'rhel': do_get_video_amazon_linux,
    'fedora': do_get_video_ubuntu,
    'linux': do_get_video_ubuntu,
    'wsl': do_get_video_ubuntu,
    'cmd': do_get_video_cmd,
    'windows': do_get_video_cmd,
    'powershell': do_get_video_powershell,
    'gitbash': do_get_video_gitbash
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
  main: do_get_video,
  do_get_video,
  do_get_video_nodejs,
  do_get_video_macos,
  do_get_video_ubuntu,
  do_get_video_raspbian,
  do_get_video_amazon_linux,
  do_get_video_cmd,
  do_get_video_powershell,
  do_get_video_gitbash
};

if (require.main === module) {
  do_get_video(process.argv.slice(2));
}
