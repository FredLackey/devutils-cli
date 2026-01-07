#!/usr/bin/env node

/**
 * resize-image - Resize an image using ImageMagick with high-quality settings
 *
 * Migrated from legacy dotfiles function.
 * Original:
 *   resize-image() {
 *     if ! command -v "convert" $> /dev/null; then
 *       printf "ImageMagick's 'convert' command-line tool is not installed!"
 *       exit
 *     fi
 *     declare path="$(dirname "$1")"
 *     declare fileName="$(basename "$1")"
 *     declare geometry="${2:-50%}"
 *     convert \
 *       "$1" \
 *       -colorspace RGB \
 *       +sigmoidal-contrast 11.6933 \
 *       -define filter:filter=Sinc \
 *       -define filter:window=Jinc \
 *       -define filter:lobes=3 \
 *       -sigmoidal-contrast 11.6933 \
 *       -colorspace sRGB \
 *       -background transparent \
 *       -gravity center \
 *       -resize "$geometry" \
 *       +append \
 *       "$path/_$fileName" \
 *     && printf "* %s (%s)\n" "$path/_$fileName" "$geometry"
 *   }
 *
 * This script resizes images using ImageMagick's convert command with
 * high-quality settings for best results. It creates a new file with an
 * underscore prefix in the same directory as the original.
 *
 * The high-quality settings used:
 * - Converts to RGB colorspace for processing
 * - Uses sigmoidal contrast to prevent color banding
 * - Uses Sinc filter with Jinc windowing (excellent for downscaling)
 * - Converts back to sRGB for output
 * - Preserves transparency
 *
 * Usage:
 *   resize-image <image-path> [geometry]
 *
 * Arguments:
 *   image-path: Path to the image file to resize
 *   geometry:   Resize specification (default: "50%")
 *               Examples: "50%", "1000x1000", "800x600!", "50%x50%"
 *               See: https://imagemagick.org/script/command-line-processing.php#geometry
 *
 * Examples:
 *   resize-image ./photo.jpg             # Resize to 50%
 *   resize-image ./photo.jpg 30%         # Resize to 30%
 *   resize-image ./photo.jpg 1000x1000   # Resize to fit within 1000x1000
 *   resize-image ./photo.jpg 800x600!    # Force exact dimensions (may distort)
 *
 * @module scripts/resize-image
 */

const os = require('../utils/common/os');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Helper function to check if a command exists on the system.
 * Used to verify ImageMagick is installed before attempting to use it.
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
 * Validates the input arguments and returns parsed values.
 * This is a pure Node.js helper function used by all platform implementations.
 *
 * @param {string[]} args - Command line arguments
 * @returns {{ imagePath: string, geometry: string, outputDir: string, outputFileName: string } | null}
 *          Returns parsed values or null if validation fails
 */
function validateAndParseArgs(args) {
  // Check if image path was provided
  if (!args[0]) {
    console.error('Error: No image path provided.');
    console.error('');
    console.error('Usage: resize-image <image-path> [geometry]');
    console.error('');
    console.error('Arguments:');
    console.error('  image-path: Path to the image file to resize');
    console.error('  geometry:   Resize specification (default: "50%")');
    console.error('');
    console.error('Examples:');
    console.error('  resize-image ./photo.jpg');
    console.error('  resize-image ./photo.jpg 30%');
    console.error('  resize-image ./photo.jpg 1000x1000');
    return null;
  }

  const imagePath = path.resolve(args[0]);
  const geometry = args[1] || '50%';

  // Check if the file exists using pure Node.js
  if (!fs.existsSync(imagePath)) {
    console.error(`Error: File not found: ${imagePath}`);
    return null;
  }

  // Check if the path is actually a file (not a directory)
  const stats = fs.statSync(imagePath);
  if (!stats.isFile()) {
    console.error(`Error: Path is not a file: ${imagePath}`);
    return null;
  }

  // Parse the directory and filename using pure Node.js path module
  const outputDir = path.dirname(imagePath);
  const fileName = path.basename(imagePath);
  const outputFileName = `_${fileName}`;

  return {
    imagePath,
    geometry,
    outputDir,
    outputFileName
  };
}

/**
 * Builds the ImageMagick convert command with high-quality settings.
 * These settings are optimized for high-quality image resizing:
 *
 * - colorspace RGB: Process in linear RGB for accurate calculations
 * - +sigmoidal-contrast 11.6933: Linearize gamma before resize
 * - filter:filter=Sinc, filter:window=Jinc, filter:lobes=3: High-quality resampling
 * - -sigmoidal-contrast 11.6933: Restore gamma after resize
 * - colorspace sRGB: Convert back to sRGB for output
 * - background transparent: Preserve transparency
 * - gravity center: Center the image for any padding operations
 *
 * @param {string} inputPath - Absolute path to the input image
 * @param {string} outputPath - Absolute path for the output image
 * @param {string} geometry - Resize geometry specification
 * @returns {string} The complete convert command
 */
function buildConvertCommand(inputPath, outputPath, geometry) {
  // Escape paths for shell execution
  // On Windows, we use double quotes; on Unix, we can use single quotes
  const escapedInput = `"${inputPath}"`;
  const escapedOutput = `"${outputPath}"`;
  const escapedGeometry = `"${geometry}"`;

  return [
    'convert',
    escapedInput,
    '-colorspace RGB',
    '+sigmoidal-contrast 11.6933',
    '-define filter:filter=Sinc',
    '-define filter:window=Jinc',
    '-define filter:lobes=3',
    '-sigmoidal-contrast 11.6933',
    '-colorspace sRGB',
    '-background transparent',
    '-gravity center',
    `-resize ${escapedGeometry}`,
    '+append',
    escapedOutput
  ].join(' ');
}

/**
 * Pure Node.js implementation - NOT FULLY APPLICABLE for this script.
 *
 * Image manipulation at this quality level requires ImageMagick.
 * While Node.js has image libraries (sharp, jimp), they don't provide
 * the same sigmoidal contrast and filter options that ImageMagick offers.
 *
 * This function validates arguments using pure Node.js, but the actual
 * image processing requires calling ImageMagick's convert command.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 * @throws {Error} Throws if called without ImageMagick
 */
async function do_resize_image_nodejs(args) {
  // Validate arguments using pure Node.js
  const parsed = validateAndParseArgs(args);
  if (!parsed) {
    process.exit(1);
  }

  // The actual image resizing requires ImageMagick's convert command
  // because we need the specific high-quality settings (sigmoidal contrast,
  // Sinc/Jinc filters) that aren't available in pure Node.js libraries.
  throw new Error(
    'do_resize_image_nodejs cannot perform the resize directly. ' +
    'ImageMagick is required for high-quality image resizing with these settings.'
  );
}

/**
 * Resize image on macOS using ImageMagick.
 *
 * ImageMagick can be installed on macOS via Homebrew:
 *   brew install imagemagick
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_resize_image_macos(args) {
  // Check for ImageMagick
  if (!isCommandAvailable('convert')) {
    console.error("Error: ImageMagick's 'convert' command-line tool is not installed.");
    console.error('');
    console.error('Install ImageMagick with Homebrew:');
    console.error('  brew install imagemagick');
    process.exit(1);
  }

  // Validate and parse arguments
  const parsed = validateAndParseArgs(args);
  if (!parsed) {
    process.exit(1);
  }

  const { imagePath, geometry, outputDir, outputFileName } = parsed;
  const outputPath = path.join(outputDir, outputFileName);

  // Build and execute the convert command
  const command = buildConvertCommand(imagePath, outputPath, geometry);

  try {
    execSync(command, { stdio: 'pipe' });
    console.log(`* ${outputPath} (${geometry})`);
  } catch (error) {
    console.error('Error: Failed to resize image.');
    if (error.stderr) {
      console.error(error.stderr.toString());
    }
    process.exit(1);
  }
}

/**
 * Resize image on Ubuntu using ImageMagick.
 *
 * ImageMagick can be installed on Ubuntu via APT:
 *   sudo apt install imagemagick
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_resize_image_ubuntu(args) {
  // Check for ImageMagick
  if (!isCommandAvailable('convert')) {
    console.error("Error: ImageMagick's 'convert' command-line tool is not installed.");
    console.error('');
    console.error('Install ImageMagick with APT:');
    console.error('  sudo apt update');
    console.error('  sudo apt install imagemagick');
    process.exit(1);
  }

  // Validate and parse arguments
  const parsed = validateAndParseArgs(args);
  if (!parsed) {
    process.exit(1);
  }

  const { imagePath, geometry, outputDir, outputFileName } = parsed;
  const outputPath = path.join(outputDir, outputFileName);

  // Build and execute the convert command
  const command = buildConvertCommand(imagePath, outputPath, geometry);

  try {
    execSync(command, { stdio: 'pipe' });
    console.log(`* ${outputPath} (${geometry})`);
  } catch (error) {
    console.error('Error: Failed to resize image.');
    if (error.stderr) {
      console.error(error.stderr.toString());
    }
    process.exit(1);
  }
}

/**
 * Resize image on Raspberry Pi OS using ImageMagick.
 *
 * ImageMagick can be installed on Raspberry Pi OS via APT:
 *   sudo apt install imagemagick
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_resize_image_raspbian(args) {
  // Check for ImageMagick
  if (!isCommandAvailable('convert')) {
    console.error("Error: ImageMagick's 'convert' command-line tool is not installed.");
    console.error('');
    console.error('Install ImageMagick with APT:');
    console.error('  sudo apt update');
    console.error('  sudo apt install imagemagick');
    process.exit(1);
  }

  // Validate and parse arguments
  const parsed = validateAndParseArgs(args);
  if (!parsed) {
    process.exit(1);
  }

  const { imagePath, geometry, outputDir, outputFileName } = parsed;
  const outputPath = path.join(outputDir, outputFileName);

  // Build and execute the convert command
  const command = buildConvertCommand(imagePath, outputPath, geometry);

  try {
    execSync(command, { stdio: 'pipe' });
    console.log(`* ${outputPath} (${geometry})`);
  } catch (error) {
    console.error('Error: Failed to resize image.');
    if (error.stderr) {
      console.error(error.stderr.toString());
    }
    process.exit(1);
  }
}

/**
 * Resize image on Amazon Linux using ImageMagick.
 *
 * ImageMagick can be installed on Amazon Linux via DNF or YUM:
 *   sudo dnf install ImageMagick   (Amazon Linux 2023)
 *   sudo yum install ImageMagick   (Amazon Linux 2)
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_resize_image_amazon_linux(args) {
  // Check for ImageMagick
  if (!isCommandAvailable('convert')) {
    console.error("Error: ImageMagick's 'convert' command-line tool is not installed.");
    console.error('');
    console.error('Install ImageMagick with DNF or YUM:');
    console.error('  sudo dnf install ImageMagick   # Amazon Linux 2023');
    console.error('  sudo yum install ImageMagick   # Amazon Linux 2');
    process.exit(1);
  }

  // Validate and parse arguments
  const parsed = validateAndParseArgs(args);
  if (!parsed) {
    process.exit(1);
  }

  const { imagePath, geometry, outputDir, outputFileName } = parsed;
  const outputPath = path.join(outputDir, outputFileName);

  // Build and execute the convert command
  const command = buildConvertCommand(imagePath, outputPath, geometry);

  try {
    execSync(command, { stdio: 'pipe' });
    console.log(`* ${outputPath} (${geometry})`);
  } catch (error) {
    console.error('Error: Failed to resize image.');
    if (error.stderr) {
      console.error(error.stderr.toString());
    }
    process.exit(1);
  }
}

/**
 * Resize image on Windows using Command Prompt.
 *
 * ImageMagick can be installed on Windows via:
 *   - Chocolatey: choco install imagemagick
 *   - Winget: winget install ImageMagick.ImageMagick
 *   - Official installer: https://imagemagick.org/script/download.php#windows
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_resize_image_cmd(args) {
  // Check for ImageMagick (on Windows, the command might be 'magick' or 'convert')
  // ImageMagick 7+ uses 'magick convert' or just 'magick'
  let convertCmd = 'convert';
  if (!isCommandAvailable('convert')) {
    if (isCommandAvailable('magick')) {
      convertCmd = 'magick convert';
    } else {
      console.error("Error: ImageMagick's 'convert' command-line tool is not installed.");
      console.error('');
      console.error('Install ImageMagick on Windows:');
      console.error('  choco install imagemagick');
      console.error('  -- or --');
      console.error('  winget install ImageMagick.ImageMagick');
      console.error('  -- or --');
      console.error('  Download from: https://imagemagick.org/script/download.php#windows');
      process.exit(1);
    }
  }

  // Validate and parse arguments
  const parsed = validateAndParseArgs(args);
  if (!parsed) {
    process.exit(1);
  }

  const { imagePath, geometry, outputDir, outputFileName } = parsed;
  const outputPath = path.join(outputDir, outputFileName);

  // Build the convert command (might be 'magick convert' on Windows with IM7)
  const command = buildConvertCommand(imagePath, outputPath, geometry)
    .replace(/^convert/, convertCmd);

  try {
    execSync(command, { stdio: 'pipe', shell: true });
    console.log(`* ${outputPath} (${geometry})`);
  } catch (error) {
    console.error('Error: Failed to resize image.');
    if (error.stderr) {
      console.error(error.stderr.toString());
    }
    process.exit(1);
  }
}

/**
 * Resize image on Windows using PowerShell.
 *
 * ImageMagick can be installed on Windows via:
 *   - Chocolatey: choco install imagemagick
 *   - Winget: winget install ImageMagick.ImageMagick
 *   - Official installer: https://imagemagick.org/script/download.php#windows
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_resize_image_powershell(args) {
  // PowerShell on Windows uses the same ImageMagick installation as CMD
  return do_resize_image_cmd(args);
}

/**
 * Resize image in Git Bash on Windows.
 *
 * Git Bash runs on Windows, so it uses the Windows ImageMagick installation.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_resize_image_gitbash(args) {
  // Git Bash on Windows uses the same ImageMagick installation
  return do_resize_image_cmd(args);
}

/**
 * Main entry point - detects environment and executes appropriate implementation.
 *
 * Resizes an image using ImageMagick's convert command with high-quality settings.
 * The resized image is saved with an underscore prefix in the same directory
 * as the original image.
 *
 * This script requires ImageMagick to be installed on the system. ImageMagick
 * provides professional-grade image manipulation capabilities including:
 * - High-quality resampling filters (Sinc, Jinc)
 * - Sigmoidal contrast adjustment for gamma-correct resizing
 * - Proper colorspace handling (RGB to sRGB conversion)
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_resize_image(args) {
  const platform = os.detect();

  const handlers = {
    'macos': do_resize_image_macos,
    'ubuntu': do_resize_image_ubuntu,
    'debian': do_resize_image_ubuntu,
    'raspbian': do_resize_image_raspbian,
    'amazon_linux': do_resize_image_amazon_linux,
    'rhel': do_resize_image_amazon_linux,
    'fedora': do_resize_image_ubuntu,
    'linux': do_resize_image_ubuntu,
    'wsl': do_resize_image_ubuntu,
    'cmd': do_resize_image_cmd,
    'windows': do_resize_image_cmd,
    'powershell': do_resize_image_powershell,
    'gitbash': do_resize_image_gitbash
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
  main: do_resize_image,
  do_resize_image,
  do_resize_image_nodejs,
  do_resize_image_macos,
  do_resize_image_ubuntu,
  do_resize_image_raspbian,
  do_resize_image_amazon_linux,
  do_resize_image_cmd,
  do_resize_image_powershell,
  do_resize_image_gitbash
};

if (require.main === module) {
  do_resize_image(process.argv.slice(2));
}
