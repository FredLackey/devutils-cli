# Story 002: Implement ignore add and ignore remove Commands

## Goal
Implement `src/commands/ignore/add.js` and `src/commands/ignore/remove.js` so users can manage `.gitignore` files without manually editing them. `add` reads a pattern file (e.g., `node.txt`) and appends its contents to `.gitignore`, wrapped in section markers. `remove` finds a managed section by its markers and deletes it. Both operations are idempotent: running `add` twice for the same technology replaces the section instead of duplicating it, and running `remove` on a section that doesn't exist does nothing harmful. This is the core of the ignore service -- the commands users will reach for most often.

## Prerequisites
- 005-ignore/001 (pattern files populated)
- 001-foundation/008 (CLI router)

## Background
The ignore system works by inserting clearly-marked sections into `.gitignore`. Each section is wrapped with start and end markers:

```
# >>> devutils:node
node_modules/
dist/
.env
...
# <<< devutils:node
```

These markers serve three purposes:
1. **Idempotent adds**: If the section already exists, `add` replaces it in place instead of appending a duplicate.
2. **Clean removal**: `remove` can delete exactly the right lines without touching anything else.
3. **Visibility**: A developer reading `.gitignore` can immediately see which patterns came from DevUtils and which were added manually.

The pattern files live at `src/patterns/gitignore/<name>.txt` inside the installed package. The `add` command needs to resolve the path to the installed package's pattern directory, not the working directory. Use `__dirname` or `path.resolve` relative to the command file's location to find the patterns.

## Technique

### add.js

1. Open `src/commands/ignore/add.js`. Fill in the `meta` object:
   ```javascript
   const meta = {
     description: 'Add gitignore patterns for a technology',
     arguments: [
       { name: 'technology', description: 'Technology name (e.g., node, macos, docker)', required: true }
     ],
     flags: [
       { name: 'path', description: 'Target directory (defaults to current directory)', type: 'string', default: '.' }
     ]
   };
   ```

2. At the top of the file, require the modules you need:
   ```javascript
   const path = require('path');
   const fs = require('fs');
   ```

3. Create two constants for the marker format:
   ```javascript
   const MARKER_START = (name) => `# >>> devutils:${name}`;
   const MARKER_END = (name) => `# <<< devutils:${name}`;
   ```

4. Create a helper function to resolve the pattern file path:
   ```javascript
   function getPatternFilePath(technology) {
     return path.resolve(__dirname, '../../patterns/gitignore', `${technology}.txt`);
   }
   ```
   This resolves relative to the command file location (`src/commands/ignore/add.js`), going up two levels to `src/`, then into `patterns/gitignore/`.

5. In the `run` function, implement this flow:

   **Step A: Validate the technology name.**
   - Build the pattern file path using `getPatternFilePath(technology)`.
   - Check if the file exists. If not, report an error using `context.errors`: `'Unknown technology "${technology}". Run "dev ignore list" to see available options.'`
   - Read the pattern file content. Trim trailing whitespace but keep the internal structure.

   **Step B: Resolve the target `.gitignore` path.**
   - Use the `--path` flag value (defaults to `.`, meaning the current working directory).
   - Resolve it to an absolute path: `path.resolve(flagPath, '.gitignore')`.

   **Step C: Read the existing `.gitignore` (or start with an empty string).**
   - If the file exists, read it as a UTF-8 string.
   - If it doesn't exist, start with an empty string. The `add` command creates the file.

   **Step D: Build the new section.**
   ```javascript
   const section = [
     MARKER_START(technology),
     patternContent,
     MARKER_END(technology)
   ].join('\n');
   ```

   **Step E: Check if the section already exists.**
   - Search the existing content for `MARKER_START(technology)` and `MARKER_END(technology)`.
   - If both markers are found, this is a replacement. Find the line indices of both markers, remove everything from the start marker through the end marker (inclusive), and insert the new section in the same position. This is the idempotent behavior.
   - If only one marker is found (corrupted state), report a warning and append the section at the end. Don't try to repair partial markers automatically.
   - If neither marker is found, this is a fresh add. Append the section to the end.

   **Step F: Handle whitespace between sections.**
   - When appending, make sure there's a blank line before the new section (unless the file is empty or already ends with a blank line). This keeps the `.gitignore` readable.
   - When replacing, preserve the surrounding whitespace as-is.

   **Step G: Write the result.**
   - Write the updated content back to the `.gitignore` file.
   - Make sure the file ends with a trailing newline.

   **Step H: Output the result.**
   - For human output: `'Added node patterns to .gitignore'` or `'Updated node patterns in .gitignore'` (depending on whether it was a fresh add or replacement).
   - For JSON output: `{ technology: 'node', action: 'added', path: '/path/to/.gitignore', lines: 25 }`.

6. Handle the `--dry-run` global flag. If dry-run is active, show what would happen without writing the file. The context object should have a way to check this (e.g., `context.dryRun` or a global flags object).

### remove.js

1. Open `src/commands/ignore/remove.js`. Fill in the `meta` object:
   ```javascript
   const meta = {
     description: 'Remove managed gitignore patterns for a technology',
     arguments: [
       { name: 'technology', description: 'Technology name to remove (e.g., node, macos)', required: true }
     ],
     flags: [
       { name: 'path', description: 'Target directory (defaults to current directory)', type: 'string', default: '.' }
     ]
   };
   ```

2. Use the same `MARKER_START` and `MARKER_END` constants. You can either duplicate them or extract them into a small shared helper in the ignore service. If you extract them, put the shared code in `src/commands/ignore/markers.js` or similar. Either approach is fine for now, but don't over-engineer it.

3. In the `run` function:

   **Step A: Resolve the `.gitignore` path.**
   - Same logic as `add.js`.

   **Step B: Read the existing `.gitignore`.**
   - If the file doesn't exist, there's nothing to remove. Output a message: `'No .gitignore found at <path>.'` This is not an error -- it's a no-op.

   **Step C: Find the section markers.**
   - Split the content into lines.
   - Find the line index of `MARKER_START(technology)` and `MARKER_END(technology)`.
   - If neither marker is found, the section isn't present. Output: `'No managed section for "${technology}" found in .gitignore.'` This is a no-op, not an error. Idempotent means "already in the desired state" is a success.
   - If only one marker is found, warn the user about a corrupted section and don't modify the file. Tell them to fix it manually.

   **Step D: Remove the section.**
   - Remove all lines from the start marker through the end marker, inclusive.
   - Also remove any blank line immediately following the end marker (cleanup), but only one blank line. Don't eat multiple blank lines.

   **Step E: Write the result.**
   - Write the updated content back.
   - If the file is now empty (only whitespace), delete it rather than leaving an empty `.gitignore`.

   **Step F: Output the result.**
   - Human: `'Removed node patterns from .gitignore'`
   - JSON: `{ technology: 'node', action: 'removed', path: '/path/to/.gitignore' }`

4. Handle `--dry-run` the same way as `add`.

### Shared marker constants

If you decide to share the marker constants between `add.js` and `remove.js`, the simplest approach is a small file:

```javascript
// src/commands/ignore/markers.js
const MARKER_START = (name) => `# >>> devutils:${name}`;
const MARKER_END = (name) => `# <<< devutils:${name}`;

module.exports = { MARKER_START, MARKER_END };
```

Both commands would then `require('./markers')`. This is optional but recommended since duplicate constants are a maintenance risk.

## Files to Create or Modify
- `src/commands/ignore/add.js` (modify existing stub)
- `src/commands/ignore/remove.js` (modify existing stub)
- `src/commands/ignore/markers.js` (create new -- optional shared constants)

## Acceptance Criteria
- [ ] `dev ignore add node` appends Node.js patterns to `.gitignore` wrapped in `# >>> devutils:node` / `# <<< devutils:node` markers
- [ ] Running `dev ignore add node` a second time replaces the existing section instead of duplicating it (idempotent)
- [ ] `dev ignore add node --path /some/other/dir` targets a different directory's `.gitignore`
- [ ] `dev ignore add node` creates a new `.gitignore` if one doesn't exist
- [ ] `dev ignore add nonexistent` shows an error about the unknown technology
- [ ] `dev ignore remove node` removes the managed node section from `.gitignore`
- [ ] Running `dev ignore remove node` when no node section exists is a no-op (no error)
- [ ] Running `dev ignore remove node` when no `.gitignore` exists is a no-op (no error)
- [ ] Removing a section cleans up one trailing blank line after the end marker
- [ ] If removing the last section leaves an empty file, the file is deleted
- [ ] Both commands export `{ meta, run }` with accurate meta objects
- [ ] Both commands respect the `--format` flag for JSON vs. human output
- [ ] Both commands respect the `--dry-run` flag

## Testing
```bash
# Create a temp directory for testing
mkdir /tmp/test-ignore && cd /tmp/test-ignore

# Add node patterns (creates .gitignore)
dev ignore add node
cat .gitignore
# Expected: File starts or contains:
# # >>> devutils:node
# node_modules/
# ... (all node patterns)
# # <<< devutils:node

# Add macos patterns (appends to existing .gitignore)
dev ignore add macos
cat .gitignore
# Expected: Two sections, node and macos, separated by a blank line

# Re-add node (idempotent -- replaces, does not duplicate)
dev ignore add node
grep -c ">>> devutils:node" .gitignore
# Expected: 1 (not 2)

# Remove macos
dev ignore remove macos
grep "devutils:macos" .gitignore
# Expected: No output (section removed)

# Remove node (last section)
dev ignore remove node
ls .gitignore
# Expected: File deleted (was empty after removing last section)

# Remove from nonexistent file (no-op)
dev ignore remove docker
# Expected: Message like "No .gitignore found" -- no error

# Try to add an unknown technology
dev ignore add foobar
# Expected: Error message about unknown technology

# JSON output
dev ignore add node --format json
# Expected: { "technology": "node", "action": "added", "path": "...", "lines": ... }

# Dry run
dev ignore add docker --dry-run
# Expected: Shows what would happen without modifying the file
cat .gitignore
# Expected: No docker section (dry run didn't write)

# Cleanup
rm -rf /tmp/test-ignore
```

## Notes
- The section markers use `# >>> devutils:<name>` and `# <<< devutils:<name>`. The `>>>` and `<<<` are intentionally asymmetric and visually distinct. They're easy to spot in a file and unlikely to conflict with anything a human would write. Don't change this format -- other stories (003-ignore-list-show) depend on it.
- When searching for markers, use exact string matching on full lines (after trimming). Don't use regex for this -- it's simpler and more reliable to do `line.trim() === MARKER_START(technology)`.
- The pattern file path resolution uses `__dirname` because the command file's location is stable (it's inside the installed npm package). Don't use `process.cwd()` for pattern file resolution -- that would look in the user's working directory, which is wrong.
- If a `.gitignore` already has manually-added patterns (not managed by DevUtils), the `add` command must not disturb them. Only touch lines between the DevUtils markers.
- The `--path` flag accepts a directory path, not a file path. The command always targets `.gitignore` within that directory. Don't let users point it at an arbitrary filename.
- Edge case: if the user's `.gitignore` has Windows-style line endings (`\r\n`), the command should still work. Split on `/\r?\n/` to handle both. When writing back, use `\n` (Unix-style) unless the original file was all `\r\n`, in which case preserve the existing style.
