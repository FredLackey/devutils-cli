'use strict';

/**
 * Creates a structured error object in the DevUtils standard format.
 * Does not write anything or exit the process.
 *
 * @param {number} code - Numeric error code (400=bad input, 401=unauthorized, 404=not found, 500=internal).
 * @param {string} message - Human-readable description of what went wrong.
 * @param {string} [service='devutils'] - The service that generated the error.
 * @returns {{ error: { code: number, message: string, service: string } }}
 */
function createError(code, message, service) {
  return {
    error: {
      code: code,
      message: message,
      service: service || 'devutils',
    },
  };
}

/**
 * Creates a structured error, writes it to stderr, and exits with code 1.
 * Uses detect.js to determine the output format and output.js to render.
 *
 * Uses lazy require() to avoid circular dependency issues.
 *
 * @param {number} code - Numeric error code.
 * @param {string} message - Human-readable error message.
 * @param {string} [service] - The service that generated the error.
 */
function throwError(code, message, service) {
  const err = createError(code, message, service);
  const output = require('./output');
  const detect = require('./detect');

  const { format } = detect.detectOutputMode();
  const formatted = output.renderError(err, format);
  process.stderr.write(formatted + '\n');
  process.exit(1);
}

/**
 * Alias for throwError. Some command stories use context.errors.exit().
 */
const exit = throwError;

/**
 * Checks if an object matches the DevUtils error shape.
 * Uses duck-typing: if it has error.code (number) and error.message (string), it's valid.
 *
 * @param {*} obj - The object to check.
 * @returns {boolean}
 */
function isDevUtilsError(obj) {
  if (obj === null || obj === undefined) return false;
  if (typeof obj !== 'object') return false;
  if (!obj.error) return false;
  if (typeof obj.error !== 'object') return false;
  if (typeof obj.error.code !== 'number') return false;
  if (typeof obj.error.message !== 'string') return false;
  return true;
}

/**
 * Creates a 404 Not Found error.
 * @param {string} message - What was not found.
 * @param {string} [service] - The service that generated the error.
 * @returns {{ error: { code: number, message: string, service: string } }}
 */
function notFound(message, service) {
  return createError(404, message, service);
}

/**
 * Creates a 400 Bad Input error.
 * @param {string} message - What was wrong with the input.
 * @param {string} [service] - The service that generated the error.
 * @returns {{ error: { code: number, message: string, service: string } }}
 */
function badInput(message, service) {
  return createError(400, message, service);
}

/**
 * Creates a 500 Internal Error.
 * @param {string} message - What went wrong internally.
 * @param {string} [service] - The service that generated the error.
 * @returns {{ error: { code: number, message: string, service: string } }}
 */
function internal(message, service) {
  return createError(500, message, service);
}

/**
 * Creates a 401 Unauthorized error.
 * @param {string} message - Why access was denied.
 * @param {string} [service] - The service that generated the error.
 * @returns {{ error: { code: number, message: string, service: string } }}
 */
function unauthorized(message, service) {
  return createError(401, message, service);
}

module.exports = {
  createError,
  throwError,
  exit,
  isDevUtilsError,
  notFound,
  badInput,
  internal,
  unauthorized,
};
