#!/usr/bin/env node

/**
 * @fileoverview Download video only from URL using yt-dlp.
 * @module scripts/get-video
 */

/**
 * Downloads video (without audio) from a URL using yt-dlp.
 * Outputs in MP4 format.
 *
 * @param {string[]} args - Command line arguments
 * @param {string} args.0 - URL to download from
 * @returns {Promise<void>}
 */
async function main(args) {
  // TODO: Implement video-only download
}

module.exports = { main };

if (require.main === module) {
  main(process.argv.slice(2));
}
