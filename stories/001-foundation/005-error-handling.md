# Story 005: Error Handling

## Goal
Build the structured error module that every command in DevUtils uses to report errors. Instead of each command inventing its own error format (some throw strings, some log objects, some exit silently), every error goes through this module and comes out in a consistent shape: `{ error: { code, message, service } }`. AI tools, CI pipelines, and humans all get errors they can parse or read.

## Prerequisites
- Story 004: Output Formatting (errors.js uses the output module to write to stderr)

## Background
When things go wrong in a CLI tool, the error handling needs to do three things well: tell the user what happened, give machine callers something they can parse, and exit with a non-zero code so scripts and pipelines know the command failed.

The legacy DevUtils code handled errors inconsistently -- some commands used `console.error`, some threw exceptions, some just returned `null`. The new approach standardizes everything around a single error shape that goes to stderr as JSON (for machines) or as a readable message (for humans).

Reference: `research/proposed/proposed-package-structure.md` lines 393-395.

## Technique

### Step 1: Implement `createError(code, message, service)`

This function builds a structured error object. It does not write anything or exit the process -- it just creates the object.

```javascript
function createError(code, message, service) {
  return {
    error: {
      code: code,
      message: message,
      service: service || 'devutils'
    }
  };
}
```

Parameters:
- `code` - A numeric error code. Use HTTP-style codes as a loose convention: 400 for bad input, 404 for not found, 500 for internal errors. These aren't HTTP responses, but the codes are familiar and well-understood.
- `message` - A human-readable description of what went wrong. Write these for junior developers: "Tool 'terraform' is not installed. Run 'dev tools install terraform' to install it."
- `service` - The service that generated the error (e.g., `'tools'`, `'config'`, `'identity'`). Defaults to `'devutils'` if not provided. This helps machine callers route or categorize errors.

### Step 2: Implement `throwError(code, message, service)`

This is the "fire and forget" error function. It builds the error, writes it to stderr using the output module, and exits the process with code 1.

```javascript
function throwError(code, message, service) {
  const err = createError(code, message, service);
  const output = require('./output');
  const detect = require('./detect');

  const { format } = detect.detectOutputMode();
  const formatted = output.renderError(err, format);
  process.stderr.write(formatted + '\n');
  process.exit(1);
}
```

`exit` is an alias for `throwError`. Some command stories reference `context.errors.exit(code, message, service)` instead of `context.errors.throwError(code, message, service)`. They do the same thing.

```javascript
const exit = throwError;
```

This function uses `detect.js` to figure out the current output format, then uses `output.js` to render the error appropriately. For machine callers (AI, CI, pipe), the error is JSON. For humans at a terminal, it's a readable message.

Why `process.exit(1)` instead of throwing an exception? Because this is a CLI tool. When a command fails, we want to write the error and stop. Throwing an exception would require every caller to have a catch block, and unhandled exceptions produce ugly stack traces that aren't helpful to users.

Note: Use lazy `require()` inside the function body for `output` and `detect` to avoid circular dependency issues. These modules might eventually import from each other, and lazy requires break the cycle.

### Step 3: Implement `isDevUtilsError(obj)`

A validation function that checks if an object matches the DevUtils error shape. Useful when a command catches something and needs to know if it's already a structured error or some random thrown value.

```javascript
function isDevUtilsError(obj) {
  if (obj === null || obj === undefined) return false;
  if (typeof obj !== 'object') return false;
  if (!obj.error) return false;
  if (typeof obj.error !== 'object') return false;
  if (typeof obj.error.code !== 'number') return false;
  if (typeof obj.error.message !== 'string') return false;
  return true;
}
```

This checks the shape, not a class or prototype. It's duck-typing: if it has `error.code` (number) and `error.message` (string), it's a DevUtils error.

### Step 4: Implement convenience factory functions

These are shorthand for common error types. They make call sites more readable:

```javascript
function notFound(message, service) {
  return createError(404, message, service);
}

function badInput(message, service) {
  return createError(400, message, service);
}

function internal(message, service) {
  return createError(500, message, service);
}

function unauthorized(message, service) {
  return createError(401, message, service);
}
```

These are optional but nice to have. A command that checks for a missing tool can say `errors.notFound('Tool "terraform" not found', 'tools')` instead of `errors.createError(404, 'Tool "terraform" not found', 'tools')`.

### Step 5: Exports

```javascript
module.exports = {
  createError,
  throwError,
  exit,              // alias for throwError
  isDevUtilsError,
  notFound,
  badInput,
  internal,
  unauthorized
};
```

### Step 6: Code style

- CommonJS modules
- 2-space indentation, LF line endings
- JSDoc comments on every exported function with `@param` and `@returns` tags
- `'use strict';` at the top
- No external dependencies

## Files to Create or Modify
- `src/lib/errors.js` - All error functions: `createError`, `throwError`, `exit` (alias), `isDevUtilsError`, and convenience factories (`notFound`, `badInput`, `internal`, `unauthorized`)

## Acceptance Criteria
- [ ] `createError(404, 'Not found', 'tools')` returns `{ error: { code: 404, message: 'Not found', service: 'tools' } }`
- [ ] `createError(500, 'Oops')` defaults service to `'devutils'`
- [ ] `throwError()` writes to stderr and exits with code 1
- [ ] `throwError()` uses `detect.js` to determine the output format
- [ ] `throwError()` outputs JSON for machine callers (AI, CI, pipe)
- [ ] `throwError()` outputs a readable message for TTY callers
- [ ] `exit()` is an alias for `throwError()` (same function)
- [ ] `isDevUtilsError()` returns `true` for valid error objects
- [ ] `isDevUtilsError()` returns `false` for `null`, `undefined`, strings, numbers, and malformed objects
- [ ] `notFound()`, `badInput()`, `internal()`, `unauthorized()` return errors with the right codes
- [ ] No external dependencies are added to package.json

## Testing

Run from the project root:

```bash
# Test createError
node -e "
  const e = require('./src/lib/errors');
  console.log(e.createError(404, 'Tool not found', 'tools'));
"
# Expected: { error: { code: 404, message: 'Tool not found', service: 'tools' } }

# Test createError with default service
node -e "
  const e = require('./src/lib/errors');
  console.log(e.createError(500, 'Something broke'));
"
# Expected: { error: { code: 500, message: 'Something broke', service: 'devutils' } }

# Test isDevUtilsError - valid
node -e "
  const e = require('./src/lib/errors');
  const err = e.createError(404, 'Not found', 'tools');
  console.log(e.isDevUtilsError(err));
"
# Expected: true

# Test isDevUtilsError - invalid inputs
node -e "
  const e = require('./src/lib/errors');
  console.log(e.isDevUtilsError(null));
  console.log(e.isDevUtilsError('a string'));
  console.log(e.isDevUtilsError({error: 'not an object'}));
  console.log(e.isDevUtilsError({error: {code: 'not a number', message: 'hi'}}));
  console.log(e.isDevUtilsError({something: 'else'}));
"
# Expected:
# false
# false
# false
# false
# false

# Test exit alias (should be the same function as throwError)
node -e "
  const e = require('./src/lib/errors');
  console.log(e.exit === e.throwError);
"
# Expected: true

# Test convenience factories
node -e "
  const e = require('./src/lib/errors');
  console.log(e.notFound('Missing', 'tools').error.code);
  console.log(e.badInput('Bad', 'config').error.code);
  console.log(e.internal('Broken', 'auth').error.code);
  console.log(e.unauthorized('No access', 'api').error.code);
"
# Expected:
# 404
# 400
# 500
# 401

# Test throwError (this will exit the process, so it's the last command)
# In a terminal (TTY):
node -e "const e = require('./src/lib/errors'); e.throwError(404, 'Tool not found', 'tools')"
# Expected on stderr: Error: Tool not found
# Expected exit code: 1

# With AI env (JSON output):
CLAUDECODE=1 node -e "const e = require('./src/lib/errors'); e.throwError(404, 'Tool not found', 'tools')"
# Expected on stderr: {"error":{"code":404,"message":"Tool not found","service":"tools"}}
# Expected exit code: 1

# Verify exit code:
node -e "const e = require('./src/lib/errors'); e.throwError(500, 'fail')"; echo "Exit code: $?"
# Expected: Exit code: 1
```

## Notes
- `throwError` calls `process.exit(1)`. This means it should only be called when the command truly cannot continue. For non-fatal issues (warnings, missing optional features), commands should use the output module's `err()` method directly and keep running.
- The error codes are conventions, not standards. We use HTTP-style codes because developers already know them: 400 = bad input, 401 = unauthorized, 404 = not found, 500 = internal error. But these aren't HTTP responses -- they're just familiar numbers that communicate intent.
- The `service` field helps machine callers categorize errors. When Claude Code gets back `{ error: { service: 'tools' } }`, it knows the error came from the tools service and can adjust its next action accordingly.
- The lazy `require()` calls inside `throwError` are intentional. If you move them to the top of the file, you might hit circular dependency issues later when `output.js` or `detect.js` imports from `errors.js`.
- Don't add stack traces to the error output. Stack traces are implementation details that aren't useful to CLI users or AI tools. If you need stack traces for debugging during development, use `--verbose` (which will be wired up in Story 008).
