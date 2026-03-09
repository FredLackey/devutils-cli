'use strict';

/**
 * Renders data as JSON. Pretty-prints for TTY callers, compact for machines.
 * @param {*} data - The data to render.
 * @param {string} caller - The caller context ('ai', 'ci', 'tty', 'pipe').
 * @returns {string}
 */
function renderJson(data, caller) {
  if (caller === 'tty') {
    return JSON.stringify(data, null, 2);
  }
  return JSON.stringify(data);
}

/**
 * Renders an array of objects as an aligned text table.
 * @param {Array<object>|object} data - The data to render. Single objects are wrapped in an array.
 * @returns {string}
 */
function renderTable(data) {
  if (!Array.isArray(data)) data = [data];
  if (data.length === 0) return '(no data)';

  const keys = Object.keys(data[0]);

  // Calculate column widths
  const widths = {};
  for (const key of keys) {
    widths[key] = key.length;
  }
  for (const row of data) {
    for (const key of keys) {
      const val = String(row[key] === undefined ? '' : row[key]);
      widths[key] = Math.max(widths[key], val.length);
    }
  }

  // Build header
  const header = keys.map(k => k.padEnd(widths[k])).join('  ');
  const separator = keys.map(k => '-'.repeat(widths[k])).join('  ');

  // Build rows
  const rows = data.map(row => {
    return keys.map(k => {
      const val = String(row[k] === undefined ? '' : row[k]);
      return val.padEnd(widths[k]);
    }).join('  ');
  });

  return [header, separator, ...rows].join('\n');
}

/**
 * Formats a value for YAML output.
 * Quotes strings that could be misinterpreted by YAML parsers.
 * @param {*} value - The value to format.
 * @returns {string}
 */
function formatYamlValue(value) {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') {
    if (/[:#\[\]{}&*!|>'"%@`]/.test(value) || value === '' || value === 'true' || value === 'false' || value === 'null') {
      return `"${value.replace(/"/g, '\\"')}"`;
    }
    return value;
  }
  return String(value);
}

/**
 * Renders data as simple YAML.
 * Handles nested objects, arrays, strings, numbers, booleans, and null.
 * @param {*} data - The data to render.
 * @param {number} [indent=0] - Current indentation level.
 * @returns {string}
 */
function renderYaml(data, indent = 0) {
  const prefix = '  '.repeat(indent);

  if (Array.isArray(data)) {
    if (data.length === 0) return `${prefix}[]`;
    return data.map(item => {
      if (typeof item === 'object' && item !== null) {
        const inner = renderYaml(item, indent + 1);
        return `${prefix}-\n${inner}`;
      }
      return `${prefix}- ${formatYamlValue(item)}`;
    }).join('\n');
  }

  if (typeof data === 'object' && data !== null) {
    const entries = Object.entries(data);
    if (entries.length === 0) return `${prefix}{}`;
    return entries.map(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        return `${prefix}${key}:\n${renderYaml(value, indent + 1)}`;
      }
      return `${prefix}${key}: ${formatYamlValue(value)}`;
    }).join('\n');
  }

  return `${prefix}${formatYamlValue(data)}`;
}

/**
 * Renders an array of objects as CSV with proper escaping.
 * @param {Array<object>|object} data - The data to render.
 * @returns {string}
 */
function renderCsv(data) {
  if (!Array.isArray(data)) data = [data];
  if (data.length === 0) return '';

  const keys = Object.keys(data[0]);

  function escapeCsvField(value) {
    const str = String(value === undefined || value === null ? '' : value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  const header = keys.map(escapeCsvField).join(',');
  const rows = data.map(row => {
    return keys.map(k => escapeCsvField(row[k])).join(',');
  });

  return [header, ...rows].join('\n');
}

/**
 * Renders data in the specified format.
 * Falls back to JSON for unknown formats.
 *
 * @param {*} data - The data to render.
 * @param {string} format - The output format ('json', 'table', 'yaml', 'csv').
 * @param {string} [caller] - The caller context (affects JSON pretty-printing).
 * @returns {string}
 */
function render(data, format, caller) {
  switch (format) {
    case 'json':
      return renderJson(data, caller);
    case 'table':
      return renderTable(data);
    case 'yaml':
      return renderYaml(data);
    case 'csv':
      return renderCsv(data);
    default:
      return renderJson(data, caller);
  }
}

/**
 * Alias for render(). Some command stories use context.output.print(data).
 */
const print = render;

/**
 * Writes a plain text informational message to stdout.
 * Does not go through the format rendering pipeline.
 * @param {string} message - The message to write.
 */
function info(message) {
  process.stdout.write(message + '\n');
}

/**
 * Writes a plain text error message to stderr.
 * Does not go through the format rendering pipeline.
 * @param {string} message - The message to write.
 */
function error(message) {
  process.stderr.write(message + '\n');
}

/**
 * Renders an error object for output.
 * Shows a human-readable message for table format, JSON for everything else.
 *
 * @param {object} errorObj - The error object (typically { error: { code, message, service } }).
 * @param {string} format - The output format.
 * @returns {string}
 */
function renderError(errorObj, format) {
  if (format === 'table') {
    const msg = errorObj.error ? errorObj.error.message : JSON.stringify(errorObj);
    return `Error: ${msg}`;
  }
  return JSON.stringify(errorObj);
}

/**
 * Creates a pre-configured formatter bound to a specific format and caller.
 * Commands use this so they don't have to pass format/caller on every call.
 *
 * @param {{ format: string, caller: string }} context - The format and caller context.
 * @returns {object} An object with out(), err(), render(), print(), info(), error(), renderError() methods.
 */
function createFormatter(context) {
  const { format, caller } = context;

  function _render(data) {
    return render(data, format, caller);
  }

  function _info(message) {
    process.stdout.write(message + '\n');
  }

  function _error(message) {
    process.stderr.write(message + '\n');
  }

  return {
    out(data) {
      const output = render(data, format, caller);
      process.stdout.write(output + '\n');
    },
    err(errorObj) {
      const output = renderError(errorObj, format);
      process.stderr.write(output + '\n');
    },
    render: _render,
    print: _render,
    info: _info,
    error: _error,
    renderError(errorObj) {
      return renderError(errorObj, format);
    },
  };
}

module.exports = { render, print, renderError, createFormatter, info, error };
