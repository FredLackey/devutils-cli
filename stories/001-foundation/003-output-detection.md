# Story 003: Output Mode Detection

## Goal
Build the function that figures out who is calling DevUtils and what output format they want. When Claude Code runs `dev status`, it needs compact JSON. When a human types `dev status` in a terminal, it needs a nicely formatted table. When a CI pipeline runs `dev tools check node`, it needs JSON. This module detects the caller automatically so commands don't have to guess.

## Prerequisites
- None. This module has no dependencies on other foundation stories.

## Background
DevUtils gets called from three very different contexts: AI coding assistants (Claude Code, Gemini CLI), CI/CD pipelines (GitHub Actions, Jenkins), and humans at a terminal. Each context needs different output. AI tools want machine-readable JSON. CI pipelines want structured JSON for parsing. Humans want readable tables and formatted text.

The detection works by checking environment variables and TTY status, in a specific order. The order matters because an AI tool might be running inside a terminal emulator (where `isTTY` would be `true`), so we check AI env vars first as the more specific signal.

Reference: `research/proposed/proposed-command-structure.md` lines 197-278.

## Technique

### Step 1: Define the environment variable lists

At the very top of the file, after the JSDoc header, define two arrays. These arrays are the only thing you need to edit when a new AI tool or CI system comes along.

```javascript
/**
 * Environment variables set by AI coding assistants.
 * Each entry is [varName, expectedValue].
 * expectedValue can be null to match any truthy value.
 */
const AI_ENV_VARS = [
  ['CLAUDECODE', '1'],
  ['GEMINI_CLI', '1'],
];

/**
 * Environment variables set by CI/CD systems.
 * Each entry is [varName, expectedValue].
 * expectedValue can be null to match any truthy value.
 */
const CI_ENV_VARS = [
  ['CI', 'true'],
  ['BUILD_NUMBER', null],
  ['TF_BUILD', 'True'],
];
```

Using `[varName, expectedValue]` pairs gives us flexibility. Some env vars just need to exist (`BUILD_NUMBER` can be any value), while others need a specific value (`CI` must be `'true'`). When `expectedValue` is `null`, any truthy value counts as a match.

### Step 2: Write the matching helper

Write a small internal function that checks if any env var in a list is set:

```javascript
function matchesEnv(varList) {
  for (const [varName, expectedValue] of varList) {
    const actual = process.env[varName];
    if (actual === undefined) continue;
    if (expectedValue === null) return true;     // Any value counts
    if (actual === expectedValue) return true;   // Specific value matches
  }
  return false;
}
```

This function is not exported. It's just an internal helper.

### Step 3: Implement `detectOutputMode()`

This is the main exported function. It checks the three layers in order and returns `{ format, caller }`.

```javascript
function detectOutputMode() {
  // Layer 1: AI tool environment
  if (matchesEnv(AI_ENV_VARS)) {
    return { format: 'json', caller: 'ai' };
  }

  // Layer 2: CI/CD environment
  if (matchesEnv(CI_ENV_VARS)) {
    return { format: 'json', caller: 'ci' };
  }

  // Layer 3: TTY detection
  if (process.stdout.isTTY) {
    return { format: 'table', caller: 'tty' };
  }

  // Fallback: piped or redirected output
  return { format: 'json', caller: 'pipe' };
}
```

The logic is simple and reads top-to-bottom. AI first, then CI, then TTY, then pipe. Notice that `format` is `'json'` for everything except a human at a terminal.

### Step 4: Export

```javascript
module.exports = { detectOutputMode };
```

Only one export. Keep it clean.

### Step 5: Code style

- CommonJS modules
- 2-space indentation, LF line endings
- JSDoc comments on `detectOutputMode()`, the two arrays, and the `matchesEnv` helper
- `'use strict';` at the top
- No external dependencies -- this module only uses `process.env` and `process.stdout.isTTY`

## Files to Create or Modify
- `src/lib/detect.js` - The `detectOutputMode()` function and the env var arrays

## Acceptance Criteria
- [ ] `detectOutputMode()` returns `{ format: 'json', caller: 'ai' }` when `CLAUDECODE=1` is set
- [ ] `detectOutputMode()` returns `{ format: 'json', caller: 'ai' }` when `GEMINI_CLI=1` is set
- [ ] `detectOutputMode()` returns `{ format: 'json', caller: 'ci' }` when `CI=true` is set
- [ ] `detectOutputMode()` returns `{ format: 'json', caller: 'ci' }` when `BUILD_NUMBER` is set to any value
- [ ] `detectOutputMode()` returns `{ format: 'json', caller: 'ci' }` when `TF_BUILD=True` is set
- [ ] `detectOutputMode()` returns `{ format: 'table', caller: 'tty' }` in a normal terminal session
- [ ] `detectOutputMode()` returns `{ format: 'json', caller: 'pipe' }` when stdout is piped
- [ ] AI detection takes priority over CI detection (if both are set, `caller` is `'ai'`)
- [ ] CI detection takes priority over TTY detection (if CI is set and stdout is a TTY, `caller` is `'ci'`)
- [ ] Adding a new AI tool is a one-line change (add an entry to `AI_ENV_VARS`)
- [ ] Adding a new CI system is a one-line change (add an entry to `CI_ENV_VARS`)
- [ ] No external dependencies are added to package.json

## Testing

Run from the project root. These tests simulate different environments by setting env vars inline.

```bash
# Test AI detection (Claude Code)
CLAUDECODE=1 node -e "const d = require('./src/lib/detect'); console.log(d.detectOutputMode())"
# Expected: { format: 'json', caller: 'ai' }

# Test AI detection (Gemini CLI)
GEMINI_CLI=1 node -e "const d = require('./src/lib/detect'); console.log(d.detectOutputMode())"
# Expected: { format: 'json', caller: 'ai' }

# Test CI detection (GitHub Actions)
CI=true node -e "const d = require('./src/lib/detect'); console.log(d.detectOutputMode())"
# Expected: { format: 'json', caller: 'ci' }

# Test CI detection (Jenkins)
BUILD_NUMBER=42 node -e "const d = require('./src/lib/detect'); console.log(d.detectOutputMode())"
# Expected: { format: 'json', caller: 'ci' }

# Test CI detection (Azure Pipelines)
TF_BUILD=True node -e "const d = require('./src/lib/detect'); console.log(d.detectOutputMode())"
# Expected: { format: 'json', caller: 'ci' }

# Test TTY detection (normal terminal - run this directly, not piped)
node -e "const d = require('./src/lib/detect'); console.log(d.detectOutputMode())"
# Expected: { format: 'table', caller: 'tty' }

# Test pipe detection (stdout is not a TTY)
node -e "const d = require('./src/lib/detect'); console.log(JSON.stringify(d.detectOutputMode()))" | cat
# Expected: {"format":"json","caller":"pipe"}

# Test priority: AI wins over CI
CLAUDECODE=1 CI=true node -e "const d = require('./src/lib/detect'); console.log(d.detectOutputMode())"
# Expected: { format: 'json', caller: 'ai' }

# Test priority: CI wins over TTY
CI=true node -e "const d = require('./src/lib/detect'); console.log(d.detectOutputMode())"
# Expected: { format: 'json', caller: 'ci' }  (even though terminal is a TTY)
```

## Notes
- This module does NOT handle the `--format` flag override. That happens in the CLI router (Story 008). This module only determines the *default* format when no flag is provided.
- The return value is a plain object, not a class instance. Keep it simple.
- Don't cache the result. Unlike platform detection (which never changes during a process), environment variables *could* theoretically change. More importantly, caching makes testing harder. The function is cheap to call.
- When adding new AI tool env vars in the future, check the tool's documentation for what variables it sets in child processes. The variable name should be something the tool guarantees, not something that might change between versions.
- The `null` value for `expectedValue` in the env var arrays means "any truthy value." This is useful for things like `BUILD_NUMBER` where the value is a number that changes every build. We don't care what the number is -- just that the variable exists.
