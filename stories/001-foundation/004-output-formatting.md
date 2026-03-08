# Story 004: Output Formatting

## Goal
Build the output formatting module that takes structured data (plain JavaScript objects and arrays) and turns it into the right string format for whoever is reading it. When an AI tool calls DevUtils, it gets compact JSON. When a human runs a command in a terminal, it gets a nicely aligned table. This module is the last stop before data hits stdout or stderr.

## Prerequisites
- Story 003: Output Detection (output.js uses the detected format and caller context)

## Background
Every command in DevUtils produces structured data (objects, arrays). The output module is responsible for converting that data into a string and writing it to stdout (for normal output) or stderr (for errors). The format depends on what `detect.js` determined, or what the user explicitly asked for with `--format`.

The module supports four formats: JSON, table, YAML, and CSV. JSON is the most common (used by AI tools, CI pipelines, and piped output). Table is used for humans at a terminal. YAML and CSV are available for specific use cases like config export or data processing.

Reference: `research/proposed/proposed-package-structure.md` lines 389-391.

## Technique

### Step 1: Implement `renderJson(data, caller)`

JSON has two modes: pretty (for humans) and compact (for machines).

```javascript
function renderJson(data, caller) {
  if (caller === 'tty') {
    return JSON.stringify(data, null, 2);
  }
  return JSON.stringify(data);
}
```

When the caller is `'tty'` (human at a terminal who explicitly asked for `--format json`), use 2-space indentation. For AI tools, CI pipelines, and pipes, use compact JSON with no whitespace.

### Step 2: Implement `renderTable(data)`

Takes an array of objects and formats them as an aligned text table. This is the format humans see by default.

Here's the approach:

1. If `data` is not an array, wrap it: `data = [data]`.
2. Get the column names from the keys of the first object.
3. Calculate the maximum width of each column (check the header and every row's value).
4. Print the header row with each column padded to its max width.
5. Print a separator row of dashes.
6. Print each data row with the same padding.

```javascript
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
```

Use 2 spaces between columns. Left-align everything (numbers too -- keep it simple).

### Step 3: Implement `renderYaml(data)`

A simple YAML renderer. We don't need a full YAML library -- just enough to serialize plain objects and arrays. This is for config export, not for parsing arbitrary YAML.

```javascript
function renderYaml(data, indent = 0) {
  const prefix = '  '.repeat(indent);

  if (Array.isArray(data)) {
    if (data.length === 0) return `${prefix}[]`;
    return data.map(item => {
      if (typeof item === 'object' && item !== null) {
        const inner = renderYaml(item, indent + 1);
        return `${prefix}- \n${inner}`;
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

function formatYamlValue(value) {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') {
    // Quote strings that could be misinterpreted
    if (/[:#\[\]{}&*!|>'"%@`]/.test(value) || value === '' || value === 'true' || value === 'false' || value === 'null') {
      return `"${value.replace(/"/g, '\\"')}"`;
    }
    return value;
  }
  return String(value);
}
```

This is intentionally basic. It handles nested objects, arrays, strings, numbers, booleans, and null. It doesn't handle multi-line strings, anchors, or other advanced YAML features. That's fine.

### Step 4: Implement `renderCsv(data)`

Takes an array of objects and produces CSV output.

```javascript
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
```

Standard CSV rules: quote fields that contain commas, double-quotes, or newlines. Escape double-quotes by doubling them.

### Step 5: Implement `render(data, format, caller)`

The main rendering function. Takes data, a format string, and the caller context. Routes to the right renderer.

```javascript
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
```

If format is unknown, fall back to JSON. Don't crash.

`print` is an alias for `render`. Some command stories reference `context.output.print(data)` instead of `context.output.render(data)`. They do the same thing.

```javascript
const print = render;
```

### Step 5b: Implement `info(message)` and `error(message)`

Two simple methods for writing plain text messages. `info` writes to stdout and `error` writes to stderr. These are used by tool, identity, and util stories for status messages that aren't structured data.

```javascript
function info(message) {
  process.stdout.write(message + '\n');
}

function error(message) {
  process.stderr.write(message + '\n');
}
```

These don't go through the format rendering pipeline. They write the message as-is. Use `info` for things like "Installing node..." and `error` for things like "Failed to connect to registry."

### Step 6: Implement `renderError(error, format)`

Writes error output to stderr. The error object should follow the structure from Story 005 (`{ error: { code, message, service } }`), but this function doesn't enforce that -- it just formats whatever object it receives.

```javascript
function renderError(error, format) {
  // Errors always go as JSON to stderr for machine callers
  // For table format (humans), show a readable message
  if (format === 'table') {
    const msg = error.error ? error.error.message : JSON.stringify(error);
    return `Error: ${msg}`;
  }
  return JSON.stringify(error);
}
```

### Step 7: Implement `createFormatter(context)`

A convenience function that pre-binds the format and caller so command files don't have to pass them every time.

```javascript
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
    print: _render,          // alias: command stories use context.output.print(data)
    info: _info,             // write informational text to stdout
    error: _error,           // write error text to stderr
    renderError(errorObj) {
      return renderError(errorObj, format);
    }
  };
}
```

Commands use it like this:

```javascript
const formatter = createFormatter({ format: 'table', caller: 'tty' });
formatter.out({ name: 'node', version: '20.11.0', status: 'installed' });
// Prints a formatted table to stdout

formatter.print({ name: 'node', version: '20.11.0' });
// Same as formatter.render() -- returns the formatted string without writing

formatter.info('Installing node...');
// Writes "Installing node..." to stdout

formatter.error('Failed to connect to registry.');
// Writes "Failed to connect to registry." to stderr
```

The `out` and `err` methods write structured data directly to stdout/stderr (going through the format pipeline). The `render` and `print` methods return formatted strings without writing, in case the caller needs to do something else with the output. The `info` and `error` methods write plain text messages to stdout and stderr respectively, bypassing the format pipeline.

### Step 8: Exports

```javascript
module.exports = { render, print, renderError, createFormatter, info, error };
```

Export the public API including the `print` alias for `render`, plus the `info` and `error` convenience methods. The individual renderers (`renderJson`, `renderTable`, etc.) are internal.

## Files to Create or Modify
- `src/lib/output.js` - All rendering functions, `render`, `renderError`, and `createFormatter`

## Acceptance Criteria
- [ ] `render(data, 'json', 'ai')` returns compact JSON (no whitespace)
- [ ] `render(data, 'json', 'tty')` returns pretty-printed JSON (2-space indent)
- [ ] `render(data, 'table')` returns an aligned text table with header and separator row
- [ ] `render(data, 'yaml')` returns valid YAML output
- [ ] `render(data, 'csv')` returns valid CSV with proper escaping
- [ ] `render(data, 'unknown-format')` falls back to JSON without crashing
- [ ] `renderError()` returns a human-readable string for `'table'` format
- [ ] `renderError()` returns JSON for all machine-readable formats
- [ ] `createFormatter(context)` returns an object with `out`, `err`, `render`, `print`, `info`, `error`, and `renderError` methods
- [ ] `print()` is an alias for `render()` (same function, both return formatted strings)
- [ ] `info(message)` writes plain text to stdout
- [ ] `error(message)` writes plain text to stderr
- [ ] `out()` writes to stdout, `err()` writes to stderr
- [ ] Table rendering handles empty arrays gracefully (shows "(no data)")
- [ ] Table rendering handles single objects (wraps in array automatically)
- [ ] CSV properly escapes commas, double-quotes, and newlines in field values
- [ ] No external dependencies are added to package.json

## Testing

Run from the project root:

```bash
# Test JSON compact (AI caller)
node -e "
  const o = require('./src/lib/output');
  console.log(o.render({name: 'node', version: '20.11.0'}, 'json', 'ai'));
"
# Expected: {"name":"node","version":"20.11.0"}

# Test JSON pretty (TTY caller)
node -e "
  const o = require('./src/lib/output');
  console.log(o.render({name: 'node', version: '20.11.0'}, 'json', 'tty'));
"
# Expected:
# {
#   "name": "node",
#   "version": "20.11.0"
# }

# Test table output
node -e "
  const o = require('./src/lib/output');
  const data = [
    {name: 'node', version: '20.11.0', status: 'installed'},
    {name: 'docker', version: '24.0.7', status: 'installed'},
    {name: 'terraform', version: '', status: 'missing'}
  ];
  console.log(o.render(data, 'table'));
"
# Expected:
# name       version   status
# ---------  --------  ---------
# node       20.11.0   installed
# docker     24.0.7    installed
# terraform            missing

# Test CSV output
node -e "
  const o = require('./src/lib/output');
  const data = [{name: 'node', desc: 'A tool, very useful'}, {name: 'docker', desc: 'Containers'}];
  console.log(o.render(data, 'csv'));
"
# Expected:
# name,desc
# node,"A tool, very useful"
# docker,Containers

# Test YAML output
node -e "
  const o = require('./src/lib/output');
  console.log(o.render({name: 'node', version: '20.11.0', installed: true}, 'yaml'));
"
# Expected:
# name: node
# version: 20.11.0
# installed: true

# Test createFormatter
node -e "
  const o = require('./src/lib/output');
  const f = o.createFormatter({format: 'json', caller: 'ai'});
  f.out({status: 'ok'});
"
# Expected (to stdout): {"status":"ok"}

# Test error rendering (table)
node -e "
  const o = require('./src/lib/output');
  console.log(o.renderError({error: {code: 404, message: 'Tool not found', service: 'tools'}}, 'table'));
"
# Expected: Error: Tool not found

# Test error rendering (json)
node -e "
  const o = require('./src/lib/output');
  console.log(o.renderError({error: {code: 404, message: 'Tool not found', service: 'tools'}}, 'json'));
"
# Expected: {"error":{"code":404,"message":"Tool not found","service":"tools"}}

# Test print alias (should return same result as render)
node -e "
  const o = require('./src/lib/output');
  const a = o.render({name: 'node'}, 'json', 'ai');
  const b = o.print({name: 'node'}, 'json', 'ai');
  console.log(a === b);
"
# Expected: true

# Test createFormatter print alias
node -e "
  const o = require('./src/lib/output');
  const f = o.createFormatter({format: 'json', caller: 'ai'});
  console.log(f.print({status: 'ok'}) === f.render({status: 'ok'}));
"
# Expected: true

# Test info and error methods on formatter
node -e "
  const o = require('./src/lib/output');
  const f = o.createFormatter({format: 'json', caller: 'ai'});
  f.info('Installing node...');
"
# Expected (to stdout): Installing node...

node -e "
  const o = require('./src/lib/output');
  const f = o.createFormatter({format: 'json', caller: 'ai'});
  f.error('Something went wrong');
" 2>&1
# Expected (to stderr): Something went wrong

# Test empty array
node -e "const o = require('./src/lib/output'); console.log(o.render([], 'table'))"
# Expected: (no data)
```

## Notes
- The table renderer is intentionally simple. It left-aligns everything and uses fixed-width columns. We're not trying to build a full table library -- just something that's easy to read for common CLI output. If a future command needs fancier table formatting (like right-aligned numbers or column wrapping), we can enhance this later.
- The YAML renderer doesn't handle every edge case in the YAML spec. It handles the data structures DevUtils actually produces: plain objects, arrays, strings, numbers, booleans, and null. That's enough for config export and human-readable output.
- The `createFormatter` function is the primary way commands interact with output. They don't call `render` directly in most cases -- they use the formatter's `out()` method. This keeps command files clean and consistent.
- Don't add color or emoji to the output in this story. If we add color later, it will be a separate concern layered on top of the formatter.
