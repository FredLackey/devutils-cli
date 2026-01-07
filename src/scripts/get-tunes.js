#!/usr/bin/env node

/**
 * get-tunes - Download audio and/or video from a URL using yt-dlp
 *
 * Migrated from legacy dotfiles alias.
 * Original:
 *   get-tunes(){
 *       local usage="get-tunes %PLAYLIST_OR_VIDEO_URL% [audio-only | video-only]";
 *       local url="$1";
 *       local option="$2";
 *       local prefix="";
 *       if [ -f "/usr/local/bin/yt-dlp" ]; then
 *           prefix="/usr/local/bin/";
 *       fi
 *       if [ -z "${url}" ]; then
 *           echo "Problem fetching track: Track URL not supplied";
 *           echo "$usage";
 *       elif [ -z "${option}" ]; then
 *           echo "Fetching audio & video...";
 *           eval "${prefix}yt-dlp --buffer-size 16K --keep-video --audio-format mp3 --extract-audio --embed-thumbnail --prefer-insecure --format mp4 --ignore-errors --output '%(title)s.%(ext)s' $1";
 *       elif [[ "$option" == "audio-only" ]]; then
 *           echo "Excluding video...";
 *           eval "${prefix}yt-dlp --buffer-size 16K --audio-format mp3 --extract-audio --embed-thumbnail --prefer-insecure --ignore-errors --output '%(title)s.%(ext)s' $1";
 *       elif [[ "$option" == "video-only" ]]; then
 *           echo "Excluding audio...";
 *           eval "${prefix}yt-dlp --buffer-size 16K --keep-video --prefer-insecure --format mp4 --ignore-errors --output '%(title)s.%(ext)s' $1";
 *       else
 *           echo "Problem fetching track: Unknown option supplied ($option)";
 *           echo "$usage";
 *       fi
 *   }
 *
 * This script downloads audio and/or video from a URL using yt-dlp.
 * It supports downloading both audio and video (default), audio-only,
 * or video-only modes.
 *
 * Usage:
 *   get-tunes <url>                    # Download both audio (mp3) and video (mp4)
 *   get-tunes <url> audio-only         # Download audio only as mp3
 *   get-tunes <url> video-only         # Download video only as mp4
 *
 * Examples:
 *   get-tunes https://www.youtube.com/watch?v=dQw4w9WgXcQ
 *   get-tunes https://www.youtube.com/watch?v=dQw4w9WgXcQ audio-only
 *   get-tunes https://www.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf
 *
 * @module scripts/get-tunes
 */

const os = require('../utils/common/os');
const { execSync, spawnSync } = require('child_process');

/**
 * Display usage information for this command.
 * Shows valid command syntax and available options.
 */
function showUsage() {
  console.log('');
  console.log('Usage: get-tunes <url> [audio-only | video-only]');
  console.log('');
  console.log('Arguments:');
  console.log('  url          The URL of the video or playlist to download');
  console.log('  mode         Optional download mode:');
  console.log('                 (none)       - Download both audio and video (default)');
  console.log('                 audio-only   - Download audio only as MP3');
  console.log('                 video-only   - Download video only as MP4');
  console.log('');
  console.log('Examples:');
  console.log('  get-tunes https://www.youtube.com/watch?v=VIDEO_ID');
  console.log('  get-tunes https://www.youtube.com/watch?v=VIDEO_ID audio-only');
  console.log('  get-tunes https://www.youtube.com/playlist?list=PLAYLIST_ID video-only');
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
 * Pure Node.js implementation that downloads media using yt-dlp.
 *
 * This function contains the core download logic that works identically
 * across all platforms. yt-dlp is a native command-line tool that is
 * superior for media downloads - it handles:
 * - Video/audio extraction and conversion
 * - Playlist handling
 * - Thumbnail embedding
 * - Format selection
 * - Error recovery
 *
 * We use yt-dlp rather than reimplementing this in Node.js because:
 * 1. yt-dlp is battle-tested and actively maintained
 * 2. It handles complex format negotiation with video sites
 * 3. It supports hundreds of video sites out of the box
 * 4. Reimplementing this in Node.js would be extremely complex
 *
 * @param {string[]} args - Command line arguments: [url, mode?]
 * @returns {Promise<void>}
 */
async function do_get_tunes_nodejs(args) {
  const url = args[0];
  const option = args[1];

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
    console.error('Error: Track URL not supplied.');
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

  // Build the yt-dlp command based on the selected mode
  // The output template uses the video title for the filename
  const outputTemplate = '%(title)s.%(ext)s';

  // Common options used across all modes:
  // --buffer-size 16K    : Set download buffer size (helps with slow connections)
  // --prefer-insecure    : Use HTTP instead of HTTPS when available (sometimes faster)
  // --ignore-errors      : Continue on download errors (useful for playlists)
  // --output             : Set the output filename template

  let ytdlpArgs = [];
  let modeDescription = '';

  if (!option) {
    // Default mode: Download both audio and video
    // --keep-video        : Keep the video file after audio extraction
    // --audio-format mp3  : Convert extracted audio to MP3
    // --extract-audio     : Extract audio from the video
    // --embed-thumbnail   : Embed thumbnail in the audio file
    // --format mp4        : Select MP4 format for video
    modeDescription = 'Fetching audio & video...';
    ytdlpArgs = [
      '--buffer-size', '16K',
      '--keep-video',
      '--audio-format', 'mp3',
      '--extract-audio',
      '--embed-thumbnail',
      '--prefer-insecure',
      '--format', 'mp4',
      '--ignore-errors',
      '--output', outputTemplate,
      url
    ];
  } else if (option === 'audio-only') {
    // Audio-only mode: Download and convert to MP3
    // Excludes --keep-video so only the audio file is kept
    modeDescription = 'Excluding video (audio only)...';
    ytdlpArgs = [
      '--buffer-size', '16K',
      '--audio-format', 'mp3',
      '--extract-audio',
      '--embed-thumbnail',
      '--prefer-insecure',
      '--ignore-errors',
      '--output', outputTemplate,
      url
    ];
  } else if (option === 'video-only') {
    // Video-only mode: Download MP4 video
    // Excludes audio extraction options
    modeDescription = 'Excluding audio (video only)...';
    ytdlpArgs = [
      '--buffer-size', '16K',
      '--keep-video',
      '--prefer-insecure',
      '--format', 'mp4',
      '--ignore-errors',
      '--output', outputTemplate,
      url
    ];
  } else {
    // Unknown option provided
    console.error(`Error: Unknown option supplied: ${option}`);
    showUsage();
    process.exit(1);
  }

  // Display what we're doing
  console.log(modeDescription);
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
 * Download media on macOS using yt-dlp.
 *
 * macOS can use the exact same logic as other platforms since yt-dlp
 * is a cross-platform tool. The command syntax is identical.
 *
 * @param {string[]} args - Command line arguments: [url, mode?]
 * @returns {Promise<void>}
 */
async function do_get_tunes_macos(args) {
  // yt-dlp works identically on macOS - delegate to the Node.js implementation
  return do_get_tunes_nodejs(args);
}

/**
 * Download media on Ubuntu using yt-dlp.
 *
 * Ubuntu can use the exact same logic as other platforms since yt-dlp
 * is a cross-platform tool. The command syntax is identical.
 *
 * @param {string[]} args - Command line arguments: [url, mode?]
 * @returns {Promise<void>}
 */
async function do_get_tunes_ubuntu(args) {
  // yt-dlp works identically on Ubuntu - delegate to the Node.js implementation
  return do_get_tunes_nodejs(args);
}

/**
 * Download media on Raspberry Pi OS using yt-dlp.
 *
 * Raspberry Pi OS can use the exact same logic as other platforms since yt-dlp
 * is a cross-platform tool. The command syntax is identical.
 *
 * @param {string[]} args - Command line arguments: [url, mode?]
 * @returns {Promise<void>}
 */
async function do_get_tunes_raspbian(args) {
  // yt-dlp works identically on Raspbian - delegate to the Node.js implementation
  return do_get_tunes_nodejs(args);
}

/**
 * Download media on Amazon Linux using yt-dlp.
 *
 * Amazon Linux can use the exact same logic as other platforms since yt-dlp
 * is a cross-platform tool. The command syntax is identical.
 *
 * @param {string[]} args - Command line arguments: [url, mode?]
 * @returns {Promise<void>}
 */
async function do_get_tunes_amazon_linux(args) {
  // yt-dlp works identically on Amazon Linux - delegate to the Node.js implementation
  return do_get_tunes_nodejs(args);
}

/**
 * Download media on Windows Command Prompt using yt-dlp.
 *
 * Windows CMD can use the exact same logic as other platforms since yt-dlp
 * is a cross-platform tool. The command syntax is identical.
 *
 * @param {string[]} args - Command line arguments: [url, mode?]
 * @returns {Promise<void>}
 */
async function do_get_tunes_cmd(args) {
  // yt-dlp works identically on Windows CMD - delegate to the Node.js implementation
  return do_get_tunes_nodejs(args);
}

/**
 * Download media on Windows PowerShell using yt-dlp.
 *
 * Windows PowerShell can use the exact same logic as other platforms since yt-dlp
 * is a cross-platform tool. The command syntax is identical.
 *
 * @param {string[]} args - Command line arguments: [url, mode?]
 * @returns {Promise<void>}
 */
async function do_get_tunes_powershell(args) {
  // yt-dlp works identically on PowerShell - delegate to the Node.js implementation
  return do_get_tunes_nodejs(args);
}

/**
 * Download media on Git Bash using yt-dlp.
 *
 * Git Bash can use the exact same logic as other platforms since yt-dlp
 * is a cross-platform tool. The command syntax is identical.
 *
 * @param {string[]} args - Command line arguments: [url, mode?]
 * @returns {Promise<void>}
 */
async function do_get_tunes_gitbash(args) {
  // yt-dlp works identically on Git Bash - delegate to the Node.js implementation
  return do_get_tunes_nodejs(args);
}

/**
 * Main entry point - detects environment and executes appropriate implementation.
 *
 * The "get-tunes" command downloads audio and/or video from a URL using yt-dlp.
 * It's a common developer workflow for downloading reference videos, podcasts,
 * conference talks, or music from various video platforms.
 *
 * yt-dlp supports hundreds of video sites including:
 * - YouTube (videos, playlists, channels)
 * - Vimeo
 * - SoundCloud
 * - And many more (see: https://github.com/yt-dlp/yt-dlp/supportedsites.md)
 *
 * @param {string[]} args - Command line arguments: [url, mode?]
 * @returns {Promise<void>}
 */
async function do_get_tunes(args) {
  const platform = os.detect();

  const handlers = {
    'macos': do_get_tunes_macos,
    'ubuntu': do_get_tunes_ubuntu,
    'debian': do_get_tunes_ubuntu,
    'raspbian': do_get_tunes_raspbian,
    'amazon_linux': do_get_tunes_amazon_linux,
    'rhel': do_get_tunes_amazon_linux,
    'fedora': do_get_tunes_ubuntu,
    'linux': do_get_tunes_ubuntu,
    'wsl': do_get_tunes_ubuntu,
    'cmd': do_get_tunes_cmd,
    'windows': do_get_tunes_cmd,
    'powershell': do_get_tunes_powershell,
    'gitbash': do_get_tunes_gitbash
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
  main: do_get_tunes,
  do_get_tunes,
  do_get_tunes_nodejs,
  do_get_tunes_macos,
  do_get_tunes_ubuntu,
  do_get_tunes_raspbian,
  do_get_tunes_amazon_linux,
  do_get_tunes_cmd,
  do_get_tunes_powershell,
  do_get_tunes_gitbash
};

if (require.main === module) {
  do_get_tunes(process.argv.slice(2));
}
