#!/usr/bin/env node

/**
 * datauri - Convert a file to a base64-encoded data URI string
 *
 * Migrated from legacy dotfiles function.
 * Original:
 *   datauri() {
 *       local mimeType=""
 *       if [ ! -f "$1" ]; then
 *           printf "%s is not a file.\n" "$1"
 *           return
 *       fi
 *       mimeType=$(file --brief --mime-type "$1")
 *       if [[ $mimeType == text/* ]]; then
 *           mimeType="$mimeType;charset=utf-8"
 *       fi
 *       printf "data:%s;base64,%s" \
 *           "$mimeType" \
 *           "$(openssl base64 -in "$1" | tr -d "\n")"
 *   }
 *
 * This script converts any file to a data URI format that can be embedded
 * directly in HTML, CSS, or other documents. Data URIs are useful for:
 * - Embedding small images directly in HTML/CSS
 * - Avoiding additional HTTP requests
 * - Creating self-contained HTML files
 *
 * @module scripts/datauri
 */

const fs = require('fs');
const path = require('path');
const os = require('../utils/common/os');

/**
 * A mapping of common file extensions to their MIME types.
 * This allows pure Node.js MIME type detection without external dependencies.
 *
 * The mapping covers the most common file types used in web development,
 * images, documents, and media files.
 */
const MIME_TYPES = {
  // Images
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.bmp': 'image/bmp',
  '.tiff': 'image/tiff',
  '.tif': 'image/tiff',
  '.avif': 'image/avif',

  // Audio
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.m4a': 'audio/mp4',
  '.flac': 'audio/flac',
  '.aac': 'audio/aac',
  '.weba': 'audio/webm',

  // Video
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.ogv': 'video/ogg',
  '.avi': 'video/x-msvideo',
  '.mov': 'video/quicktime',
  '.mkv': 'video/x-matroska',

  // Fonts
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.eot': 'application/vnd.ms-fontobject',

  // Text/Code
  '.html': 'text/html',
  '.htm': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  '.csv': 'text/csv',
  '.yaml': 'text/yaml',
  '.yml': 'text/yaml',
  '.ts': 'text/typescript',
  '.tsx': 'text/typescript',
  '.jsx': 'text/javascript',

  // Documents
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',

  // Archives
  '.zip': 'application/zip',
  '.tar': 'application/x-tar',
  '.gz': 'application/gzip',
  '.rar': 'application/vnd.rar',
  '.7z': 'application/x-7z-compressed',

  // Other
  '.wasm': 'application/wasm',
  '.bin': 'application/octet-stream'
};

/**
 * Get the MIME type for a file based on its extension.
 *
 * This function uses a built-in mapping of file extensions to MIME types,
 * which is faster and more portable than calling external tools like `file`.
 * Falls back to 'application/octet-stream' for unknown extensions.
 *
 * @param {string} filePath - The path to the file
 * @returns {string} The MIME type for the file
 */
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

/**
 * Check if a MIME type represents text content.
 *
 * Text content should have charset=utf-8 appended to the MIME type
 * in data URIs for proper character encoding.
 *
 * @param {string} mimeType - The MIME type to check
 * @returns {boolean} True if the MIME type is text-based
 */
function isTextMimeType(mimeType) {
  // Text types start with 'text/'
  if (mimeType.startsWith('text/')) {
    return true;
  }

  // Some application types are also text-based
  const textApplicationTypes = [
    'application/json',
    'application/xml',
    'application/javascript',
    'application/x-javascript'
  ];

  return textApplicationTypes.includes(mimeType);
}

/**
 * Pure Node.js implementation that works on any platform.
 *
 * This function reads a file, detects its MIME type based on extension,
 * encodes the content as base64, and outputs a complete data URI string.
 *
 * The data URI format is: data:[<mediatype>][;base64],<data>
 *
 * For text content, we append ;charset=utf-8 to the MIME type to ensure
 * proper character encoding, matching the original bash function behavior.
 *
 * @param {string[]} args - Command line arguments, expects file path as first element
 * @returns {Promise<void>}
 */
async function do_datauri_nodejs(args) {
  // Check if a file path was provided
  if (!args || args.length === 0) {
    console.error('Usage: datauri <file>');
    console.error('');
    console.error('Convert a file to a base64-encoded data URI string.');
    console.error('');
    console.error('Example:');
    console.error('  datauri image.png');
    console.error('  datauri styles.css');
    process.exit(1);
  }

  const filePath = args[0];

  // Resolve the file path (handles relative paths)
  const resolvedPath = path.resolve(filePath);

  // Check if the file exists
  if (!fs.existsSync(resolvedPath)) {
    console.error(`${filePath} is not a file.`);
    process.exit(1);
  }

  // Check if it's actually a file (not a directory)
  const stats = fs.statSync(resolvedPath);
  if (!stats.isFile()) {
    console.error(`${filePath} is not a file.`);
    process.exit(1);
  }

  // Get the MIME type based on file extension
  let mimeType = getMimeType(resolvedPath);

  // For text content, append charset=utf-8 (matching original bash behavior)
  if (isTextMimeType(mimeType)) {
    mimeType = `${mimeType};charset=utf-8`;
  }

  // Read the file contents as a Buffer
  const fileBuffer = fs.readFileSync(resolvedPath);

  // Convert to base64 string
  const base64Data = fileBuffer.toString('base64');

  // Output the complete data URI
  // Using process.stdout.write to avoid trailing newline (matching original printf behavior)
  process.stdout.write(`data:${mimeType};base64,${base64Data}`);
}

/**
 * Convert a file to data URI on macOS.
 *
 * macOS can use the pure Node.js implementation since file reading,
 * MIME type detection, and base64 encoding all work identically.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_datauri_macos(args) {
  return do_datauri_nodejs(args);
}

/**
 * Convert a file to data URI on Ubuntu.
 *
 * Ubuntu can use the pure Node.js implementation since file reading,
 * MIME type detection, and base64 encoding all work identically.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_datauri_ubuntu(args) {
  return do_datauri_nodejs(args);
}

/**
 * Convert a file to data URI on Raspberry Pi OS.
 *
 * Raspberry Pi OS can use the pure Node.js implementation since file reading,
 * MIME type detection, and base64 encoding all work identically.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_datauri_raspbian(args) {
  return do_datauri_nodejs(args);
}

/**
 * Convert a file to data URI on Amazon Linux.
 *
 * Amazon Linux can use the pure Node.js implementation since file reading,
 * MIME type detection, and base64 encoding all work identically.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_datauri_amazon_linux(args) {
  return do_datauri_nodejs(args);
}

/**
 * Convert a file to data URI on Windows Command Prompt.
 *
 * Windows CMD can use the pure Node.js implementation since file reading,
 * MIME type detection, and base64 encoding all work identically.
 * Node.js handles path separators and file system differences automatically.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_datauri_cmd(args) {
  return do_datauri_nodejs(args);
}

/**
 * Convert a file to data URI on Windows PowerShell.
 *
 * Windows PowerShell can use the pure Node.js implementation since file reading,
 * MIME type detection, and base64 encoding all work identically.
 * Node.js handles path separators and file system differences automatically.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_datauri_powershell(args) {
  return do_datauri_nodejs(args);
}

/**
 * Convert a file to data URI on Git Bash.
 *
 * Git Bash can use the pure Node.js implementation since file reading,
 * MIME type detection, and base64 encoding all work identically.
 * Node.js handles path separators and file system differences automatically.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_datauri_gitbash(args) {
  return do_datauri_nodejs(args);
}

/**
 * Main entry point - detects environment and executes appropriate implementation.
 *
 * The "datauri" command converts any file to a base64-encoded data URI string.
 * Data URIs embed file contents directly in the string, useful for:
 * - Embedding small images in HTML img src or CSS background-image
 * - Avoiding additional HTTP requests for small resources
 * - Creating self-contained HTML documents
 *
 * Usage: datauri <file>
 *
 * Example output:
 *   datauri image.png
 *   => data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...
 *
 *   datauri styles.css
 *   => data:text/css;charset=utf-8;base64,LyogU3R5bGVz...
 *
 * @param {string[]} args - Command line arguments, expects file path as first element
 * @returns {Promise<void>}
 */
async function do_datauri(args) {
  const platform = os.detect();

  const handlers = {
    'macos': do_datauri_macos,
    'ubuntu': do_datauri_ubuntu,
    'debian': do_datauri_ubuntu,
    'raspbian': do_datauri_raspbian,
    'amazon_linux': do_datauri_amazon_linux,
    'rhel': do_datauri_amazon_linux,
    'fedora': do_datauri_ubuntu,
    'linux': do_datauri_ubuntu,
    'wsl': do_datauri_ubuntu,
    'cmd': do_datauri_cmd,
    'windows': do_datauri_cmd,
    'powershell': do_datauri_powershell,
    'gitbash': do_datauri_gitbash
  };

  const handler = handlers[platform.type];
  if (!handler) {
    console.error(`Platform '${platform.type}' is not supported for this command.`);
    console.error('');
    console.error('Supported platforms:');
    console.error('  - macOS');
    console.error('  - Ubuntu, Debian, and other Linux distributions');
    console.error('  - Raspberry Pi OS');
    console.error('  - Amazon Linux');
    console.error('  - Windows (CMD, PowerShell, Git Bash)');
    process.exit(1);
  }

  await handler(args);
}

module.exports = {
  main: do_datauri,
  do_datauri,
  do_datauri_nodejs,
  do_datauri_macos,
  do_datauri_ubuntu,
  do_datauri_raspbian,
  do_datauri_amazon_linux,
  do_datauri_cmd,
  do_datauri_powershell,
  do_datauri_gitbash
};

if (require.main === module) {
  do_datauri(process.argv.slice(2));
}
