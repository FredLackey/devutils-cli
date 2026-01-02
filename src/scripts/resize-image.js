#!/usr/bin/env node

/**
 * @fileoverview Resize image using ImageMagick.
 * @module scripts/resize-image
 */

/**
 * Resizes an image using ImageMagick's convert command with
 * high-quality settings. Creates a new file with underscore prefix.
 *
 * @param {string[]} args - Command line arguments
 * @param {string} args.0 - Path to the image file
 * @param {string} [args.1] - Resize geometry (default: "50%")
 * @returns {Promise<void>}
 */
async function main(args) {
  // TODO: Implement image resizing
}

module.exports = { main };

if (require.main === module) {
  main(process.argv.slice(2));
}
