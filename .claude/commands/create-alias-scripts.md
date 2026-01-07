# Create Alias Scripts

Analyze all scripts in `src/scripts/` and migrate incomplete ones to the full cross-platform pattern using the Dotfiles Script Migrator agent.

## Overview

This command identifies scripts that do not fully implement the required `do_{alias}()` and `do_{alias}_{environment}()` pattern, then spawns parallel agents to complete the migration.

## Critical Implementation Rules

The migrator agent follows these rules when creating scripts:

1. **Prefer Node.js for simple operations** - File I/O, JSON parsing, HTTP requests, path manipulation should use Node.js native APIs, not shell commands.

2. **Use native tools when they are superior** - Do NOT rebuild functionality in Node.js just because you can. If a native OS tool provides better performance, more predictable output, or battle-tested reliability (e.g., `rsync`, `git`, `tar`, `ffmpeg`), use the native tool. The goal is the best solution, not Node.js purity.

3. **The `_nodejs` function is the cross-platform baseline** - Platform functions should delegate to `do_{alias}_nodejs()` when no OS-specific code is needed, but may call native tools when those tools provide clear advantages.

## Your Task

### Step 1: Analyze Scripts for Pattern Compliance

Scan all `*.js` files in `src/scripts/` and check each one for the required pattern. A script is **complete** if it exports ALL of the following functions:

```javascript
do_{alias}              // Main entry point with platform routing
do_{alias}_nodejs       // Pure Node.js implementation (cross-platform baseline)
do_{alias}_macos        // macOS implementation (may delegate to _nodejs)
do_{alias}_ubuntu       // Ubuntu implementation (may delegate to _nodejs)
do_{alias}_raspbian     // Raspberry Pi OS implementation (may delegate to _nodejs)
do_{alias}_amazon_linux // Amazon Linux implementation (may delegate to _nodejs)
do_{alias}_cmd          // Windows Command Prompt implementation (may delegate to _nodejs)
do_{alias}_powershell   // Windows PowerShell implementation (may delegate to _nodejs)
do_{alias}_gitbash      // Git Bash implementation (may delegate to _nodejs)
```

Where `{alias}` is derived from the filename (e.g., `afk.js` → `do_afk`, `git-push.js` → `do_git_push` with hyphens converted to underscores).

**Important**: The `do_{alias}_nodejs()` function contains the pure Node.js implementation. Platform-specific functions should call `do_{alias}_nodejs()` when no OS-specific code is needed, avoiding code duplication.

### Step 2: Build the Incomplete Scripts List

Create a list of all scripts that:
- Have only a `main()` function (old pattern)
- Are missing the `do_{alias}_nodejs` function or any of the 7 platform-specific functions
- Have TODO comments indicating incomplete implementation
- Export `main` but not `do_{alias}`

### Step 3: Process Scripts in Parallel Batches

For each incomplete script, spawn the `dotfiles-script-migrator` agent. Follow these rules:

1. **Maximum 5 concurrent agents** - Never spawn more than 5 agents at once
2. **One file per agent** - Each agent instance processes exactly one script file
3. **Wait for completion** - Before spawning new agents, wait for at least one running agent to complete
4. **Track progress** - Monitor which files are being processed, completed, or failed

Use the Task tool with these parameters for each script:
```
subagent_type: dotfiles-script-migrator
prompt: "Migrate the '{alias}' script to the full cross-platform pattern. The script file is at src/scripts/{alias}.js"
```

### Step 4: Update STATUS.md

After each agent completes, update `src/scripts/STATUS.md` with the results. The file should have this format:

```markdown
# Script Migration Status

Last updated: {YYYY-MM-DD HH:MM}

## Summary

- Total scripts: {count}
- Complete (full pattern): {count}
- Incomplete (needs migration): {count}
- In progress: {count}
- Failed: {count}

## Complete Scripts

| Script | Status | Last Updated |
|--------|--------|--------------|
| afk.js | ✅ Complete | 2024-01-15 |
| clone.js | ✅ Complete | 2024-01-15 |

## Incomplete Scripts

| Script | Status | Notes |
|--------|--------|-------|
| ll.js | ⏳ Pending | Missing all do_* functions |
| git-push.js | ❌ Failed | Agent error: [reason] |

## Migration Log

### {YYYY-MM-DD}

- `afk.js` - Migrated successfully
- `clone.js` - Migrated successfully
- `ll.js` - Failed: [reason]
```

## Detection Logic

Use this logic to determine if a script is complete:

```javascript
// For a file named "{alias}.js", check for these exports:
const expectedExports = [
  `do_${alias}`,              // Main entry point with platform routing
  `do_${alias}_nodejs`,       // Pure Node.js implementation (cross-platform baseline)
  `do_${alias}_macos`,        // May delegate to _nodejs if no OS-specific code needed
  `do_${alias}_ubuntu`,       // May delegate to _nodejs if no OS-specific code needed
  `do_${alias}_raspbian`,     // May delegate to _nodejs if no OS-specific code needed
  `do_${alias}_amazon_linux`, // May delegate to _nodejs if no OS-specific code needed
  `do_${alias}_cmd`,          // May delegate to _nodejs if no OS-specific code needed
  `do_${alias}_powershell`,   // May delegate to _nodejs if no OS-specific code needed
  `do_${alias}_gitbash`       // May delegate to _nodejs if no OS-specific code needed
];

// The script is complete if ALL 9 expected exports exist AND are functions
// The script is incomplete if it only exports "main" or is missing any do_* function
```

**Important filename conversions:**
- `afk.js` → `do_afk`
- `git-push.js` → `do_git_push` (hyphens become underscores)
- `empty-trash.js` → `do_empty_trash`

## Execution Flow

```
1. Read all *.js files from src/scripts/
2. For each file:
   a. Parse the module.exports to find exported function names
   b. Convert filename to expected do_{alias} pattern
   c. Check if all 9 required functions are exported (including _nodejs)
   d. Add to "incomplete" list if missing any
3. Report: "Found {N} incomplete scripts out of {M} total"
4. Process incomplete scripts in batches of 5:
   a. Spawn up to 5 agents in parallel
   b. Wait for any agent to complete
   c. Record result in STATUS.md
   d. Spawn next agent if more scripts remain
5. Final report: "Migration complete. {X} succeeded, {Y} failed"
```

## Error Handling

- If an agent fails, record the error in STATUS.md and continue with other scripts
- If a script file cannot be read, skip it and note in STATUS.md
- If STATUS.md doesn't exist, create it
- Never stop processing because of a single failure

## Output

Provide a final summary:

```
=== Script Migration Summary ===

Scanned: 78 scripts
Already complete: 12
Needed migration: 66
Successfully migrated: 64
Failed: 2

Failed scripts:
- complex-script.js: [error reason]
- another-script.js: [error reason]

See src/scripts/STATUS.md for full details.
```
