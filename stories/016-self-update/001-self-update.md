# Story 001: Implement Self-Update Command

## Goal
Implement `src/commands/update.js` so that `dev update` upgrades DevUtils to the latest published version on npm. The `--check` flag lets users see if an update is available without actually installing it. This saves users from having to remember the full `npm install -g @fredlackey/devutils@latest` command and gives them a clean way to check for updates from inside the tool itself.

## Prerequisites
- 001-foundation/008 (CLI router)

## Background
The `update.js` stub already exists at `src/commands/update.js` with an empty `{ meta, run }` skeleton. The current installed version lives in `package.json` at the project root (`version` field, currently `0.0.19`). The latest published version can be queried from the npm registry by running `npm view @fredlackey/devutils version`.

The actual update mechanism is straightforward: run `npm install -g @fredlackey/devutils@latest`. But the command needs to handle several edge cases gracefully: npm might not be on the PATH, the user might not have permission to install globally, the network might be down, or the user might already be on the latest version.

This command uses `context.shell` to execute npm commands as child processes. It does not import npm as a library.

## Technique

1. Open `src/commands/update.js`.

2. Fill in the `meta` object:
   ```javascript
   const meta = {
     description: 'Self-update to the latest published version',
     arguments: [],
     flags: [
       {
         name: 'check',
         type: 'boolean',
         description: 'Check for updates without installing'
       }
     ]
   };
   ```

3. Create a helper function to get the current installed version:
   ```javascript
   function getCurrentVersion() {
     const pkg = require('../../package.json');
     return pkg.version;
   }
   ```

4. Create a helper function to get the latest version from npm. This runs `npm view @fredlackey/devutils version` and parses the output:
   ```javascript
   async function getLatestVersion(context) {
     try {
       const result = await context.shell.exec(
         'npm view @fredlackey/devutils version'
       );
       return result.stdout.trim();
     } catch (err) {
       return null;
     }
   }
   ```

5. Create a helper to compare versions. You don't need a semver library for this. Split on dots, compare each segment as a number:
   ```javascript
   function isNewer(latest, current) {
     const l = latest.split('.').map(Number);
     const c = current.split('.').map(Number);
     for (let i = 0; i < Math.max(l.length, c.length); i++) {
       const lv = l[i] || 0;
       const cv = c[i] || 0;
       if (lv > cv) return true;
       if (lv < cv) return false;
     }
     return false;
   }
   ```

6. In the `run` function, implement the main logic:

   **Step 1: Check that npm is available.**
   ```javascript
   const npmExists = await context.shell.commandExists('npm');
   if (!npmExists) {
     return context.errors.throw(
       500,
       'npm is not available on this system. Install Node.js and npm first.'
     );
   }
   ```

   **Step 2: Get the current and latest versions.**
   ```javascript
   const current = getCurrentVersion();
   const latest = await getLatestVersion(context);

   if (!latest) {
     return context.errors.throw(
       500,
       'Could not reach the npm registry. Check your network connection.'
     );
   }
   ```

   **Step 3: Compare versions.**
   If the user is already on the latest version, report that and exit:
   ```javascript
   if (!isNewer(latest, current)) {
     return context.output.render({
       current,
       latest,
       updateAvailable: false,
       message: `Already on the latest version (${current}).`
     });
   }
   ```

   **Step 4: If `--check` flag is set, report the available update but don't install.**
   ```javascript
   if (args.check) {
     return context.output.render({
       current,
       latest,
       updateAvailable: true,
       message: `Update available: ${current} -> ${latest}. Run "dev update" to install.`
     });
   }
   ```

   **Step 5: Perform the update.**
   ```javascript
   context.output.render({
     message: `Updating from ${current} to ${latest}...`
   });

   try {
     await context.shell.exec('npm install -g @fredlackey/devutils@latest');
   } catch (err) {
     const msg = err.stderr || err.message || '';
     if (msg.includes('EACCES') || msg.includes('permission')) {
       return context.errors.throw(
         403,
         'Permission denied. Try running with sudo: sudo dev update'
       );
     }
     return context.errors.throw(
       500,
       `Update failed: ${msg}`
     );
   }

   context.output.render({
     previous: current,
     current: latest,
     updateAvailable: false,
     message: `Updated to ${latest}. Restart your terminal to use the new version.`
   });
   ```

7. Export everything:
   ```javascript
   module.exports = { meta, run };
   ```

## Files to Create or Modify
- `src/commands/update.js` -- Modify existing stub. The self-update command handler.

## Acceptance Criteria
- [ ] `dev update --check` reports whether an update is available without installing
- [ ] `dev update --check` when already on latest shows "Already on the latest version"
- [ ] `dev update` installs the latest version when an update is available
- [ ] `dev update` when already on latest reports that no update is needed and does nothing
- [ ] If npm is not on the PATH, the command shows a clear error message
- [ ] If the npm registry is unreachable, the command shows a network error
- [ ] If the install fails due to permissions, the command suggests using sudo
- [ ] `dev update --format json` outputs structured JSON with `current`, `latest`, and `updateAvailable` fields
- [ ] The command exports `{ meta, run }` with an accurate `meta` object
- [ ] The command does not import npm as a library -- it shells out to `npm`

## Testing
```bash
# Check for updates without installing
dev update --check
# Expected (if on latest): { current: "0.0.19", latest: "0.0.19", updateAvailable: false, message: "Already on the latest version (0.0.19)." }
# Expected (if behind):    { current: "0.0.19", latest: "0.1.0", updateAvailable: true, message: "Update available: 0.0.19 -> 0.1.0. Run \"dev update\" to install." }

# Perform update
dev update
# Expected (if on latest): "Already on the latest version (0.0.19)."
# Expected (if behind):    "Updating from 0.0.19 to 0.1.0..." followed by "Updated to 0.1.0."

# Verify the version after update
dev version
# Expected: The new version number

# JSON output
dev update --check --format json
# Expected: Structured JSON object

# Test with npm not available (simulate by temporarily renaming npm)
# Expected: Error message about npm not being available
```

## Notes
- The `npm install -g` command replaces the currently running code. After the install completes, the current process is still running the old version. That's why the success message says "Restart your terminal." The user needs a fresh shell to pick up the new binary.
- Don't try to re-execute the CLI after updating. Reloading modules mid-process with `require` cache busting is fragile and not worth the complexity.
- The version comparison is simple integer comparison on each semver segment. This handles `0.0.19` vs `0.1.0` correctly. It does not handle pre-release tags like `1.0.0-beta.1`. If the project starts using pre-release versions, this function will need a proper semver parser.
- On macOS with Homebrew-installed Node.js, `npm install -g` usually works without sudo. On Linux with system-packaged Node.js, it often needs sudo. The permission error handling covers this.
- The command queries the npm registry every time it runs. There's no local cache of the latest version. This keeps it simple but means it needs network access. If the user is offline, `--check` will fail with a clear message instead of silently assuming they're up to date.
