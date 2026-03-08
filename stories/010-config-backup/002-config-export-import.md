# Story 002: Config Export and Import

## Goal
Implement `src/commands/config/export.js` and `import.js`. `export` takes the current profile's config files (`config.json`, `aliases.json`, `ai.json`, `plugins.json`) and pushes them to the configured backup storage -- either a private GitHub repo or a secret gist. `import` pulls config from the remote backup and writes it locally. Both commands support a `--file` flag for local file export/import when the user just wants a portable JSON file instead of using GitHub. After a successful import, the command tells the user to run `dev alias sync` to rebuild their wrapper scripts.

## Prerequisites
- 010-config-backup/001 (GitHub helpers -- `github.js` must be working)
- 002-config/001 (config init -- `config.json` must exist with profile and backup settings from the onboarding wizard)

## Background
When a developer gets a new machine or reinstalls their OS, they need to get their DevUtils config back. The export/import flow handles this. On the old machine (or before something breaks), the user runs `dev config export` to push their config to GitHub. On the new machine, they run `dev config import` to pull it down.

The backup location (private repo or secret gist) and profile name are stored in `~/.devutils/config.json` under the `backup` key. This was set up during `dev config init` (story 002-config/001). The export command reads these settings to know where to push. The import command either uses the same settings (if config.json already exists locally) or asks the user for the backup location.

For repo-based backups, each profile is a subdirectory: `profiles/<profile-name>/`. For gist-based backups, each profile is a separate file in the gist (e.g., `default.json`).

Reference: `research/proposed/config-backup-sync.md` for the full backup design. `research/proposed/proposed-command-syntax.md` lines 255-267 for the export/import syntax.

## Technique

### Step 1: Understand what gets exported

The export bundles these files from `~/.devutils/`:

| File | Description |
|---|---|
| `config.json` | User preferences, defaults, backup settings |
| `aliases.json` | All registered alias mappings |
| `ai.json` | AI tool configurations (if it exists) |
| `plugins.json` | Installed API plugin list (if it exists) |

Auth tokens (`auth/` directory) are NOT included by default. They are sensitive and should be re-created on the new machine via `dev auth login`. A future story could add an `--include-auth` flag.

### Step 2: Implement `src/commands/config/export.js`

Fill in the `meta` object:

```javascript
const meta = {
  description: 'Push the current config profile to the remote backup (repo or gist), or export to a local file.',
  arguments: [],
  flags: [
    { name: 'file', type: 'string', description: 'Export to a local file instead of remote backup' },
    { name: 'profile', type: 'string', description: 'Export a specific profile (defaults to the active profile)' }
  ]
};
```

The `run` function handles two modes: file export and remote export.

**File export mode** (`--file`):

If the user passes `--file <path>`, bundle all config files into a single JSON object and write it to the specified path. This is a simple, self-contained backup file.

```javascript
const fs = require('fs');
const path = require('path');
const os = require('os');

const DEVUTILS_DIR = path.join(os.homedir(), '.devutils');

/**
 * Read a config file from ~/.devutils/ if it exists.
 * Returns the parsed content, or null if the file is missing.
 */
function readConfigFile(filename) {
  const filePath = path.join(DEVUTILS_DIR, filename);
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

// File export mode
if (args.flags.file) {
  const bundle = {
    exportedAt: new Date().toISOString(),
    profile: profileName,
    config: readConfigFile('config.json'),
    aliases: readConfigFile('aliases.json'),
    ai: readConfigFile('ai.json'),
    plugins: readConfigFile('plugins.json')
  };

  const outputPath = path.resolve(args.flags.file);
  fs.writeFileSync(outputPath, JSON.stringify(bundle, null, 2) + '\n');
  console.log(`Config exported to ${outputPath}`);
  return;
}
```

**Remote export mode** (default):

Read the backup settings from `config.json` to determine the backend (repo or gist) and location. Then push the config files.

```javascript
const github = require('../../lib/github');

// Read current config
const config = readConfigFile('config.json');
if (!config || !config.backup) {
  console.error('No backup storage configured.');
  console.error('Run "dev config init" to set up backup storage.');
  return;
}

const profileName = args.flags.profile || config.profile || 'default';
const backend = config.backup.backend;
const location = config.backup.location;
```

For **repo-based** backups:

1. Check if the repo has already been cloned locally (in a temp/cache directory).
2. If not, clone it.
3. Copy the config files into the profile subdirectory (`profiles/<profile-name>/`).
4. Commit and push.

```javascript
if (backend === 'repo') {
  // Check gh authentication
  const isAuth = await github.isAuthenticated();
  if (!isAuth) {
    console.error('Not authenticated with GitHub. Run: gh auth login');
    return;
  }

  const cacheDir = path.join(DEVUTILS_DIR, 'cache');
  const repoDir = path.join(cacheDir, 'config-backup');
  fs.mkdirSync(cacheDir, { recursive: true });

  // Clone or pull the repo
  if (fs.existsSync(path.join(repoDir, '.git'))) {
    // Already cloned -- pull latest
    const pullResult = await github.pullRepo(repoDir);
    if (!pullResult.success) {
      console.error('Failed to pull latest config: ' + pullResult.error);
      return;
    }
  } else {
    // First time -- need repo location
    if (!location) {
      console.error('No backup repository configured.');
      console.error('Run "dev config init --force" to set up a backup repository.');
      return;
    }

    const cloneResult = await github.cloneRepo(location, repoDir);
    if (!cloneResult.success) {
      console.error('Failed to clone backup repo: ' + cloneResult.error);
      return;
    }
  }

  // Copy config files into the profile directory
  const profileDir = path.join(repoDir, 'profiles', profileName);
  fs.mkdirSync(profileDir, { recursive: true });

  const filesToExport = ['config.json', 'aliases.json', 'ai.json', 'plugins.json'];
  for (const filename of filesToExport) {
    const sourcePath = path.join(DEVUTILS_DIR, filename);
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, path.join(profileDir, filename));
    }
  }

  // Push
  const pushResult = await github.pushRepo(
    repoDir,
    `Update profile "${profileName}" - ${new Date().toISOString()}`
  );

  if (!pushResult.success) {
    console.error('Failed to push config: ' + pushResult.error);
    return;
  }

  console.log(`Config exported to repo (profile: ${profileName}).`);
}
```

For **gist-based** backups:

1. Bundle all config files into a single JSON object (keyed by profile name).
2. If a gist ID is stored in config, update that gist.
3. If no gist ID exists, create a new gist and store the ID in config.

```javascript
if (backend === 'gist') {
  const isAuth = await github.isAuthenticated();
  if (!isAuth) {
    console.error('Not authenticated with GitHub. Run: gh auth login');
    return;
  }

  // Bundle config files into a single JSON for the gist
  const bundle = {
    config: readConfigFile('config.json'),
    aliases: readConfigFile('aliases.json'),
    ai: readConfigFile('ai.json'),
    plugins: readConfigFile('plugins.json')
  };

  const filename = `${profileName}.json`;
  const content = JSON.stringify(bundle, null, 2);

  if (location) {
    // Update existing gist
    const result = await github.updateGist(location, { [filename]: content });
    if (!result.success) {
      console.error('Failed to update gist: ' + result.error);
      return;
    }
    console.log(`Config exported to gist (profile: ${profileName}).`);
  } else {
    // Create new gist
    const result = await github.createGist(
      { [filename]: content },
      'DevUtils CLI configuration backup',
      true
    );

    if (!result.success) {
      console.error('Failed to create gist: ' + result.error);
      return;
    }

    // Save the gist ID back to config
    config.backup.location = result.id;
    fs.writeFileSync(
      path.join(DEVUTILS_DIR, 'config.json'),
      JSON.stringify(config, null, 2) + '\n'
    );

    console.log(`Config exported to new gist (profile: ${profileName}).`);
    console.log(`Gist URL: ${result.url}`);
  }
}
```

### Step 3: Implement `src/commands/config/import.js`

Fill in the `meta` object:

```javascript
const meta = {
  description: 'Pull config from remote backup and apply locally, or import from a local file.',
  arguments: [],
  flags: [
    { name: 'file', type: 'string', description: 'Import from a local file instead of remote backup' },
    { name: 'profile', type: 'string', description: 'Import a specific profile from the backup' }
  ]
};
```

**File import mode** (`--file`):

Read the JSON file, validate it, and write each config file to `~/.devutils/`.

```javascript
if (args.flags.file) {
  const filePath = path.resolve(args.flags.file);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }

  let bundle;
  try {
    bundle = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    console.error('Invalid JSON file: ' + err.message);
    return;
  }

  // Validate the bundle has expected fields
  if (!bundle.config) {
    console.error('Invalid export file: missing config data.');
    return;
  }

  // Write each file
  fs.mkdirSync(DEVUTILS_DIR, { recursive: true });

  const filesToImport = {
    'config.json': bundle.config,
    'aliases.json': bundle.aliases,
    'ai.json': bundle.ai,
    'plugins.json': bundle.plugins
  };

  for (const [filename, data] of Object.entries(filesToImport)) {
    if (data) {
      fs.writeFileSync(
        path.join(DEVUTILS_DIR, filename),
        JSON.stringify(data, null, 2) + '\n'
      );
    }
  }

  console.log(`Config imported from ${filePath}`);
  console.log('');
  console.log('Next step: run "dev alias sync" to rebuild alias wrapper scripts.');
  return;
}
```

**Remote import mode** (default):

Read the backup settings and pull config from the remote.

For **repo-based** imports, the flow is:

1. Clone or pull the backup repo.
2. List available profiles in the `profiles/` directory.
3. Let the user pick a profile (or use `--profile`).
4. Copy the config files from the profile directory into `~/.devutils/`.

```javascript
if (backend === 'repo') {
  // Clone or pull (same logic as export)
  // ...

  // List available profiles
  const profilesDir = path.join(repoDir, 'profiles');
  if (!fs.existsSync(profilesDir)) {
    console.error('No profiles found in backup repository.');
    return;
  }

  const profiles = fs.readdirSync(profilesDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  if (profiles.length === 0) {
    console.error('No profiles found in backup repository.');
    return;
  }

  // Select profile
  let profileName = args.flags.profile;
  if (!profileName) {
    if (profiles.length === 1) {
      profileName = profiles[0];
    } else {
      // Let the user pick
      profileName = await context.prompt.select(
        'Which profile do you want to import?',
        profiles.map(p => ({ value: p, label: p }))
      );
    }
  }

  const profileDir = path.join(profilesDir, profileName);
  if (!fs.existsSync(profileDir)) {
    console.error(`Profile "${profileName}" not found in backup.`);
    console.error(`Available profiles: ${profiles.join(', ')}`);
    return;
  }

  // Copy config files
  const filesToImport = ['config.json', 'aliases.json', 'ai.json', 'plugins.json'];
  let imported = 0;

  for (const filename of filesToImport) {
    const sourcePath = path.join(profileDir, filename);
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, path.join(DEVUTILS_DIR, filename));
      imported++;
    }
  }

  console.log(`Imported ${imported} config file(s) from profile "${profileName}".`);
}
```

For **gist-based** imports:

1. Fetch the gist content.
2. Parse the profile JSON.
3. Write each config file.

```javascript
if (backend === 'gist') {
  if (!location) {
    console.error('No backup gist configured.');
    console.error('Run "dev config init --force" to set up a backup gist.');
    return;
  }

  const gistResult = await github.getGist(location);
  if (!gistResult.success) {
    console.error('Failed to read gist: ' + gistResult.error);
    return;
  }

  // List available profiles (each is a .json file in the gist)
  const profileFiles = Object.keys(gistResult.files).filter(f => f.endsWith('.json'));
  const profiles = profileFiles.map(f => f.replace('.json', ''));

  let profileName = args.flags.profile;
  if (!profileName) {
    if (profiles.length === 1) {
      profileName = profiles[0];
    } else {
      profileName = await context.prompt.select(
        'Which profile do you want to import?',
        profiles.map(p => ({ value: p, label: p }))
      );
    }
  }

  const filename = profileName + '.json';
  const content = gistResult.files[filename];
  if (!content) {
    console.error(`Profile "${profileName}" not found in gist.`);
    return;
  }

  let bundle;
  try {
    bundle = JSON.parse(content);
  } catch {
    console.error('Failed to parse profile data from gist.');
    return;
  }

  // Write each file
  const filesToImport = {
    'config.json': bundle.config,
    'aliases.json': bundle.aliases,
    'ai.json': bundle.ai,
    'plugins.json': bundle.plugins
  };

  let imported = 0;
  for (const [fname, data] of Object.entries(filesToImport)) {
    if (data) {
      fs.writeFileSync(
        path.join(DEVUTILS_DIR, fname),
        JSON.stringify(data, null, 2) + '\n'
      );
      imported++;
    }
  }

  console.log(`Imported ${imported} config file(s) from profile "${profileName}".`);
}
```

### Step 4: Always suggest alias sync after import

Both import modes should end with this reminder:

```javascript
console.log('');
console.log('Next steps:');
console.log('  1. Run "dev alias sync" to rebuild alias wrapper scripts');
console.log('  2. Run "dev status" to verify your configuration');
```

### Step 5: Update the sync timestamp

After a successful export or import, write the current timestamp to `~/.devutils/sync.json` so that future sync checks know when the last operation happened.

```javascript
const syncPath = path.join(DEVUTILS_DIR, 'sync.json');
const syncData = {
  lastSync: new Date().toISOString(),
  direction: 'export', // or 'import'
  profile: profileName
};
fs.writeFileSync(syncPath, JSON.stringify(syncData, null, 2) + '\n');
```

## Files to Create or Modify
- `src/commands/config/export.js` -- Replace the stub with the full export logic (file and remote modes)
- `src/commands/config/import.js` -- Replace the stub with the full import logic (file and remote modes)

## Acceptance Criteria
- [ ] `dev config export` pushes config files to the configured backup repo
- [ ] `dev config export` pushes config files to the configured backup gist
- [ ] `dev config export --file ./backup.json` writes a portable JSON file
- [ ] `dev config export --profile work` exports the "work" profile
- [ ] `dev config import` pulls config from the configured backup repo
- [ ] `dev config import` pulls config from the configured backup gist
- [ ] `dev config import --file ./backup.json` reads from a local JSON file
- [ ] `dev config import --profile work` imports the "work" profile
- [ ] When multiple profiles exist in the backup, import prompts the user to pick one
- [ ] After import, the command suggests running `dev alias sync`
- [ ] After export or import, the sync timestamp is updated in `sync.json`
- [ ] Export without backup configuration shows a clear error pointing to `dev config init`
- [ ] Import without backup configuration shows a clear error pointing to `dev config init`
- [ ] Both commands check GitHub authentication before network operations
- [ ] Auth tokens are NOT included in the export (only config, aliases, ai, plugins)
- [ ] File export and import round-trip correctly (export then import produces the same config)

## Testing

```bash
# Test file export
dev config export --file /tmp/devutils-backup.json
# Expected: Config exported to /tmp/devutils-backup.json

# Verify the exported file
cat /tmp/devutils-backup.json | python3 -m json.tool
# Expected: JSON with exportedAt, profile, config, aliases fields

# Test file import on a clean setup
# (Back up your config first!)
cp -r ~/.devutils ~/.devutils-backup

dev config import --file /tmp/devutils-backup.json
# Expected: Config imported from /tmp/devutils-backup.json
# Expected: Suggests running dev alias sync

# Verify config was written
cat ~/.devutils/config.json | python3 -m json.tool
# Expected: Matches the original config

# Restore original config
rm -rf ~/.devutils
mv ~/.devutils-backup ~/.devutils

# Test remote export (requires GitHub auth and backup to be configured)
dev config export
# Expected: Config exported to repo/gist (depending on config)

# Test remote import
dev config import
# Expected: Prompts for profile if multiple exist, imports config

# Test export without backup configured
# (temporarily remove backup settings)
# Expected: Error about no backup storage configured

# Clean up
rm /tmp/devutils-backup.json
```

## Notes
- The `cache/config-backup/` directory inside `~/.devutils/` is used as a local clone of the backup repo. This directory is not exported or backed up -- it is just a working copy for git operations. If it gets corrupted, deleting it and running export/import again will re-clone.
- Auth tokens are deliberately excluded from export. Including OAuth tokens or API keys in a git repo (even a private one) or a gist is a security risk. The user should re-authenticate on new machines. A future story could add encrypted auth export for advanced users.
- The gist-based approach stores each profile as a separate file in a single gist. This keeps things organized but means the gist can only hold a limited number of profiles (GitHub limits files per gist). For most users, one or two profiles is typical.
- The import command creates `~/.devutils/` if it does not exist. This handles the case where a user installs DevUtils on a fresh machine and runs `dev config import` before `dev config init`. The import provides enough config to get started.
- After import, the `backup` settings in the imported `config.json` may reference a repo or gist that is specific to the old machine. The import preserves these settings so that future exports go to the same location. If the user wants to change the backup location, they can run `dev config init --force`.
- The `--profile` flag on both commands lets the user manage multiple configurations. For example, a user might have a "work" profile with corporate identities and a "personal" profile with open-source settings. Different machines can use different profiles.
- The `sync.json` timestamp is used by a future "change detection" feature that will notify users when another machine has pushed an updated config. For now, it is just written and not read. But writing it now establishes the convention.
