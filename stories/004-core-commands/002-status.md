# Story 002: Implement status Command

## Goal
Implement `src/commands/status.js` so users can run `dev status` and get a single-screen health check of their DevUtils installation. The output covers whether a config file exists and is valid, the current machine profile summary, connected auth services, registered aliases, installed API plugins, and config sync status. This is the "dashboard" command -- the first thing a user runs when they want to know if everything is working. Some sections will show placeholder messages until the services they depend on are built, and that's fine. The structure matters now; the data will fill in as the project matures.

## Prerequisites
- 001-foundation/008 (CLI router)
- 002-config/001 (config service -- for reading config state)
- 003-machine/001 (machine detect -- for reading machine profile)

## Background
`dev status` is a top-level command, meaning its file lives directly at `src/commands/status.js` (not inside a service subfolder). It pulls information from multiple parts of the system and assembles a summary. Think of it like `git status` but for your DevUtils setup.

The command reads from:
- `~/.devutils/config.json` -- to check if config exists and is valid
- `~/.devutils/machines/current.json` -- for the machine profile summary
- `~/.devutils/auth/` -- to list connected services (or show "none configured")
- `~/.devutils/aliases.json` -- to count registered aliases
- `~/.devutils/plugins.json` -- to count installed API plugins
- `~/.devutils/sync.json` -- for the last backup timestamp

Some of these files won't exist yet when this story is implemented. That's expected. The command should handle missing files gracefully, showing helpful placeholder messages instead of crashing.

## Technique

1. Open `src/commands/status.js`. The stub already has the `{ meta, run }` skeleton.

2. Fill in the `meta` object:
   ```javascript
   const meta = {
     description: 'Overall health check',
     arguments: [],
     flags: []
   };
   ```

3. In the `run` function, build a result object with six sections. Use `context.config` to read from `~/.devutils/`. For each section, wrap the read in a try/catch or check for file existence first so that missing files produce clean placeholder messages, not stack traces.

4. **Section 1: Config status**
   - Use `context.config` to attempt to load `config.json`.
   - If the file exists and parses as valid JSON, report `{ exists: true, valid: true }`.
   - If the file exists but fails to parse, report `{ exists: true, valid: false }`.
   - If the file does not exist, report `{ exists: false, valid: false }`.
   - For human output, show something like:
     - "Config: OK" (green if you have color support, but plain text is fine)
     - "Config: Not found. Run 'dev config init' to get started."
     - "Config: Invalid JSON. Check ~/.devutils/config.json for syntax errors."

5. **Section 2: Machine profile**
   - Use `context.config` to read `machines/current.json`.
   - If it exists, pull out the key fields: `type` (OS name), `arch`, `hostname`, and `packageManager`.
   - If it doesn't exist, show "Machine: Not detected. Run 'dev machine detect' to set up."
   - For the structured result, return something like `{ detected: true, type: 'macos', arch: 'arm64', hostname: 'Freds-MacBook', packageManager: 'brew' }` or `{ detected: false }`.

6. **Section 3: Auth services**
   - Check the `~/.devutils/auth/` directory for token files.
   - Each JSON file in that directory (excluding the `clients/` subfolder) represents a connected service.
   - List the service names (derived from filenames, e.g., `gmail.json` -> `gmail`).
   - If the auth directory doesn't exist or is empty, show "Auth: No services connected."
   - For now, just report the count and names. Don't validate token expiry -- that's the `dev auth status` command's job.
   - Structured result: `{ services: ['gmail', 'drive'], count: 2 }` or `{ services: [], count: 0 }`.

7. **Section 4: Aliases**
   - Read `~/.devutils/aliases.json`.
   - If it exists, count the number of entries.
   - If it doesn't exist, report 0.
   - Structured result: `{ count: 5 }` or `{ count: 0 }`.
   - Human output: "Aliases: 5 registered" or "Aliases: None registered."

8. **Section 5: API plugins**
   - Read `~/.devutils/plugins.json`.
   - If it exists, count the number of installed plugins.
   - If it doesn't exist, report 0.
   - Structured result: `{ count: 3, plugins: ['gmail', 'drive', 'aws'] }` or `{ count: 0, plugins: [] }`.
   - Human output: "API Plugins: 3 installed (gmail, drive, aws)" or "API Plugins: None installed."

9. **Section 6: Sync status**
   - Read `~/.devutils/sync.json`.
   - If it exists and has a `lastBackup` timestamp, show it.
   - If it doesn't exist or has no timestamp, show "never".
   - Structured result: `{ lastBackup: '2026-03-08T12:00:00Z' }` or `{ lastBackup: null }`.
   - Human output: "Last sync: 2026-03-08 12:00 PM" or "Last sync: Never."

10. Assemble the full result object:
    ```javascript
    const result = {
      config: { /* section 1 */ },
      machine: { /* section 2 */ },
      auth: { /* section 3 */ },
      aliases: { /* section 4 */ },
      plugins: { /* section 5 */ },
      sync: { /* section 6 */ }
    };
    ```

11. Pass the result to `context.output` for formatting. The output module handles whether to render it as JSON, table, or human-friendly text based on the detected format.

12. For human-friendly output, format it as a clean vertical listing. Something like:
    ```
    DevUtils Status
    ---------------
    Config:      OK
    Machine:     macOS arm64 (brew)
    Auth:        2 services (gmail, drive)
    Aliases:     5 registered
    API Plugins: 3 installed (gmail, drive, aws)
    Last Sync:   2026-03-08 12:00 PM
    ```

## Files to Create or Modify
- `src/commands/status.js` (modify existing stub)

## Acceptance Criteria
- [ ] `dev status` outputs a summary with all six sections
- [ ] Missing config file shows a helpful "run dev config init" message instead of an error
- [ ] Missing machine profile shows a helpful "run dev machine detect" message
- [ ] Missing auth directory or empty auth shows "No services connected"
- [ ] Missing aliases file shows "None registered" with a count of 0
- [ ] Missing plugins file shows "None installed" with a count of 0
- [ ] Missing sync file shows "Never" for last backup
- [ ] `dev status --format json` outputs the full structured result object
- [ ] The command never throws an unhandled error due to missing files
- [ ] The command exports `{ meta, run }` with an accurate `meta` object

## Testing
```bash
# Before any setup (fresh install, no ~/.devutils/ directory)
dev status
# Expected: All sections show placeholder messages
# Config: Not found. Run 'dev config init' to get started.
# Machine: Not detected. Run 'dev machine detect' to set up.
# Auth: No services connected.
# Aliases: None registered.
# API Plugins: None installed.
# Last Sync: Never.

# After running config init and machine detect
dev status
# Expected: Config and Machine sections show real data, others still placeholder

# JSON output
dev status --format json
# Expected: Full JSON object with all six sections

# Piped output (no TTY)
dev status | cat
# Expected: Compact JSON (auto-detected non-TTY format)
```

## Notes
- This command is read-only. It never modifies any files. It's safe to run at any time.
- Be defensive about every file read. Assume nothing exists. The very first time a user installs DevUtils and runs `dev status`, the `~/.devutils/` directory itself might not exist yet. Check for the directory first before trying to read files inside it.
- The `context.config` module (from story 002-config/001) should provide helper methods like `configExists()`, `readConfig()`, `readMachineProfile()`, etc. Use those instead of raw `fs` calls so the file paths and directory structure stay centralized.
- Don't try to detect whether services are healthy or tokens are expired. `dev status` is a quick snapshot, not a deep diagnostic. Deeper checks belong to service-specific commands like `dev auth status gmail`.
- The human-friendly format should be compact enough to fit on one screen. Don't add extra blank lines or decorations. Users will run this frequently and want to scan it fast.
