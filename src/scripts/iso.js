#!/usr/bin/env node

/**
 * iso - Print current date/time in ISO 8601 format
 *
 * Migrated from legacy dotfiles alias.
 * Original: alias iso="TZ=America/Los_Angeles date -Iseconds"
 *
 * This script outputs the current date and time in ISO 8601 format with seconds
 * precision. By default, it uses the America/Los_Angeles timezone (Pacific Time),
 * matching the original dotfiles behavior. An optional timezone argument can be
 * provided to output the time in a different timezone.
 *
 * ISO 8601 format with seconds: 2024-01-15T14:30:45-08:00
 *
 * Why ISO 8601?
 * - Unambiguous: No confusion between MM/DD and DD/MM formats
 * - Sortable: Alphabetical sort equals chronological sort
 * - Widely supported: Used in APIs, logs, databases, and international contexts
 * - Includes timezone: The offset makes the time globally unambiguous
 *
 * @module scripts/iso
 */

const os = require('../utils/common/os');

/**
 * Gets the current timezone offset string for a given timezone.
 *
 * Calculates the UTC offset for the specified timezone at the current moment
 * and returns it in ISO 8601 format (e.g., "-08:00" or "+05:30").
 *
 * @param {Date} date - The date to calculate the offset for
 * @param {string} timezone - IANA timezone identifier (e.g., "America/Los_Angeles")
 * @returns {string} The timezone offset string (e.g., "-08:00", "+00:00")
 */
function getTimezoneOffset(date, timezone) {
  // Create a formatter that shows the timezone offset
  // We use formatToParts to extract the offset components
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    timeZoneName: 'longOffset'
  });

  const parts = formatter.formatToParts(date);
  const tzPart = parts.find(part => part.type === 'timeZoneName');

  if (tzPart && tzPart.value) {
    // The longOffset format gives us something like "GMT-08:00" or "GMT+05:30"
    // We need to extract just the offset part
    const offsetMatch = tzPart.value.match(/GMT([+-]\d{2}:\d{2})/);
    if (offsetMatch) {
      return offsetMatch[1];
    }
    // Handle "GMT" (UTC with no offset)
    if (tzPart.value === 'GMT') {
      return '+00:00';
    }
  }

  // Fallback: calculate offset manually using the difference between
  // local time in the timezone and UTC
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  const offsetMinutes = (tzDate - utcDate) / 60000;

  const sign = offsetMinutes >= 0 ? '+' : '-';
  const absOffset = Math.abs(offsetMinutes);
  const hours = Math.floor(absOffset / 60).toString().padStart(2, '0');
  const minutes = (absOffset % 60).toString().padStart(2, '0');

  return `${sign}${hours}:${minutes}`;
}

/**
 * Formats a date in ISO 8601 format with seconds precision for a specific timezone.
 *
 * This is the core formatting function that produces output like:
 * 2024-01-15T14:30:45-08:00
 *
 * The format components are:
 * - YYYY-MM-DD: Year, month, day (zero-padded)
 * - T: Date/time separator
 * - HH:MM:SS: Hours, minutes, seconds (24-hour, zero-padded)
 * - +/-HH:MM: Timezone offset from UTC
 *
 * @param {Date} date - The date object to format
 * @param {string} timezone - IANA timezone identifier (e.g., "America/Los_Angeles")
 * @returns {string} ISO 8601 formatted date string with timezone offset
 */
function formatIsoDate(date, timezone) {
  // Use Intl.DateTimeFormat to get the date/time components in the target timezone
  // This is more reliable than manual calculation for handling DST transitions
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const parts = formatter.formatToParts(date);

  // Extract the individual components from the formatter
  const getPart = (type) => {
    const part = parts.find(p => p.type === type);
    return part ? part.value : '00';
  };

  const year = getPart('year');
  const month = getPart('month');
  const day = getPart('day');
  let hour = getPart('hour');
  const minute = getPart('minute');
  const second = getPart('second');

  // Handle midnight edge case: some locales return "24" for midnight
  if (hour === '24') {
    hour = '00';
  }

  // Get the timezone offset string
  const offset = getTimezoneOffset(date, timezone);

  // Construct the ISO 8601 string: YYYY-MM-DDTHH:MM:SS+HH:MM
  return `${year}-${month}-${day}T${hour}:${minute}:${second}${offset}`;
}

/**
 * Validates that a timezone string is a valid IANA timezone identifier.
 *
 * Uses Intl.DateTimeFormat to test if the timezone is recognized.
 * Examples of valid timezones:
 * - "America/Los_Angeles" (Pacific Time)
 * - "America/New_York" (Eastern Time)
 * - "Europe/London" (GMT/BST)
 * - "Asia/Tokyo" (Japan Standard Time)
 * - "UTC" (Coordinated Universal Time)
 *
 * @param {string} timezone - The timezone string to validate
 * @returns {boolean} True if the timezone is valid, false otherwise
 */
function isValidTimezone(timezone) {
  try {
    // Intl.DateTimeFormat will throw if the timezone is invalid
    new Intl.DateTimeFormat('en-US', { timeZone: timezone });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Pure Node.js implementation that works on any platform.
 *
 * This function outputs the current date/time in ISO 8601 format.
 * It uses JavaScript's built-in Date and Intl APIs, which work
 * identically on all platforms (macOS, Linux, Windows).
 *
 * Default behavior matches the original alias: uses America/Los_Angeles timezone.
 * An optional timezone argument allows outputting time in any IANA timezone.
 *
 * @param {string[]} args - Command line arguments
 * @param {string} [args[0]] - Optional IANA timezone (e.g., "America/New_York", "UTC")
 * @returns {Promise<void>}
 */
async function do_iso_nodejs(args) {
  // Default timezone matches the original dotfiles alias
  const defaultTimezone = 'America/Los_Angeles';

  // Use provided timezone or fall back to default
  const timezone = args[0] || defaultTimezone;

  // Validate the timezone before using it
  if (!isValidTimezone(timezone)) {
    console.error(`Error: Invalid timezone "${timezone}"`);
    console.error('');
    console.error('Please provide a valid IANA timezone identifier.');
    console.error('Examples:');
    console.error('  America/Los_Angeles  (Pacific Time)');
    console.error('  America/New_York     (Eastern Time)');
    console.error('  America/Chicago      (Central Time)');
    console.error('  America/Denver       (Mountain Time)');
    console.error('  Europe/London        (GMT/BST)');
    console.error('  Europe/Paris         (Central European Time)');
    console.error('  Asia/Tokyo           (Japan Standard Time)');
    console.error('  Asia/Shanghai        (China Standard Time)');
    console.error('  Australia/Sydney     (Australian Eastern Time)');
    console.error('  UTC                  (Coordinated Universal Time)');
    console.error('');
    console.error('For a full list, see: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones');
    process.exit(1);
  }

  // Get the current date and format it
  const now = new Date();
  const isoString = formatIsoDate(now, timezone);

  // Output the ISO 8601 timestamp
  console.log(isoString);
}

/**
 * Output ISO 8601 timestamp on macOS.
 *
 * Uses the pure Node.js implementation since JavaScript's Date and Intl APIs
 * work identically on macOS. No platform-specific code is needed.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_iso_macos(args) {
  return do_iso_nodejs(args);
}

/**
 * Output ISO 8601 timestamp on Ubuntu.
 *
 * Uses the pure Node.js implementation since JavaScript's Date and Intl APIs
 * work identically on Linux. No platform-specific code is needed.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_iso_ubuntu(args) {
  return do_iso_nodejs(args);
}

/**
 * Output ISO 8601 timestamp on Raspberry Pi OS.
 *
 * Uses the pure Node.js implementation since JavaScript's Date and Intl APIs
 * work identically on Linux. No platform-specific code is needed.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_iso_raspbian(args) {
  return do_iso_nodejs(args);
}

/**
 * Output ISO 8601 timestamp on Amazon Linux.
 *
 * Uses the pure Node.js implementation since JavaScript's Date and Intl APIs
 * work identically on Linux. No platform-specific code is needed.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_iso_amazon_linux(args) {
  return do_iso_nodejs(args);
}

/**
 * Output ISO 8601 timestamp on Windows Command Prompt.
 *
 * Uses the pure Node.js implementation since JavaScript's Date and Intl APIs
 * work identically on Windows. No platform-specific code is needed.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_iso_cmd(args) {
  return do_iso_nodejs(args);
}

/**
 * Output ISO 8601 timestamp on Windows PowerShell.
 *
 * Uses the pure Node.js implementation since JavaScript's Date and Intl APIs
 * work identically on Windows. No platform-specific code is needed.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_iso_powershell(args) {
  return do_iso_nodejs(args);
}

/**
 * Output ISO 8601 timestamp on Git Bash.
 *
 * Uses the pure Node.js implementation since JavaScript's Date and Intl APIs
 * work identically on Windows/Git Bash. No platform-specific code is needed.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_iso_gitbash(args) {
  return do_iso_nodejs(args);
}

/**
 * Main entry point - detects environment and executes appropriate implementation.
 *
 * The "iso" command outputs the current date/time in ISO 8601 format with
 * seconds precision. This format is ideal for:
 * - Log file timestamps
 * - API request/response timestamps
 * - File naming (dates sort correctly alphabetically)
 * - Cross-timezone communication
 * - Database timestamps
 *
 * Usage:
 *   iso                        # Output time in America/Los_Angeles (default)
 *   iso UTC                    # Output time in UTC
 *   iso America/New_York       # Output time in Eastern timezone
 *   iso Europe/London          # Output time in London timezone
 *
 * Example output: 2024-01-15T14:30:45-08:00
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_iso(args) {
  const platform = os.detect();

  const handlers = {
    'macos': do_iso_macos,
    'ubuntu': do_iso_ubuntu,
    'debian': do_iso_ubuntu,
    'raspbian': do_iso_raspbian,
    'amazon_linux': do_iso_amazon_linux,
    'rhel': do_iso_amazon_linux,
    'fedora': do_iso_ubuntu,
    'linux': do_iso_ubuntu,
    'wsl': do_iso_ubuntu,
    'cmd': do_iso_cmd,
    'windows': do_iso_cmd,
    'powershell': do_iso_powershell,
    'gitbash': do_iso_gitbash
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
    console.error('  - WSL (Windows Subsystem for Linux)');
    process.exit(1);
  }

  await handler(args);
}

module.exports = {
  main: do_iso,
  do_iso,
  do_iso_nodejs,
  do_iso_macos,
  do_iso_ubuntu,
  do_iso_raspbian,
  do_iso_amazon_linux,
  do_iso_cmd,
  do_iso_powershell,
  do_iso_gitbash
};

if (require.main === module) {
  do_iso(process.argv.slice(2));
}
