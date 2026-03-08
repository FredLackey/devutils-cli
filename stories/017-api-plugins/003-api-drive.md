# Story 003: Build the Google Drive API Plugin

## Goal
Build the Google Drive plugin as a separate git repo and npm package (`@fredlackey/devutils-api-drive`). It wraps the Google Drive API into 12 commands across 3 resources: files (list/get/upload/download/search/move/delete), folders (list/create/delete), and permissions (list/add/remove). Auth service: `google`.

## Prerequisites
- 017-api-plugins/001 (plugin template)
- 011-auth/001 (auth service)

## Background
Google Drive is the second Google service plugin. It shares the same auth service (`google`) as Gmail, so a user who already ran `dev auth login google` can use both plugins without re-authenticating (assuming the OAuth scopes include Drive).

The plugin uses the `googleapis` npm package, specifically `google.drive('v3')`. Command signatures are defined in `research/proposed/proposed-command-syntax.md` lines 680-748.

### Drive API Endpoint Mapping

| Command | API Method | Notes |
|---------|-----------|-------|
| files list | files.list | Supports folder scoping via `--folder` and MIME type filtering via `--type` |
| files get | files.get | Returns file metadata (not content) |
| files upload | files.create (multipart) | Uploads a local file, optionally into a target folder |
| files download | files.get (alt=media) | Downloads file content to a local path |
| files search | files.list (with q param) | Uses Drive search syntax |
| files move | files.update | Changes the parent folder |
| files delete | files.delete | Permanent delete, requires `--confirm` |
| folders list | files.list (mimeType filter) | Filters by `application/vnd.google-apps.folder` |
| folders create | files.create | Creates with folder MIME type |
| folders delete | files.delete | Permanent delete, requires `--confirm` |
| permissions list | permissions.list | Lists permissions on a file or folder |
| permissions add | permissions.create | Adds a permission (reader/writer/commenter) |
| permissions remove | permissions.delete | Removes a permission by ID |

## Technique

### Step 1: Create the repo and scaffold

1. Create a new repo at `git@github.com:FredLackey/devutils-api-drive.git`.
2. Copy the plugin template from `research/plugin-template/`.
3. Replace all placeholders: `<service>` -> `drive`, `<Service display name>` -> `Google Drive`, `<auth-service>` -> `google`.
4. Add `googleapis` to `dependencies` in `package.json`.
5. Run `npm install`.

### Step 2: Set up `index.js`

```javascript
module.exports = {
  name: 'drive',
  description: 'Google Drive (files, folders, permissions)',
  version: '1.0.0',
  auth: 'google',
  resources: {
    files: {
      description: 'Files in Google Drive',
      commands: {
        list:     () => require('./commands/files/list'),
        get:      () => require('./commands/files/get'),
        upload:   () => require('./commands/files/upload'),
        download: () => require('./commands/files/download'),
        search:   () => require('./commands/files/search'),
        move:     () => require('./commands/files/move'),
        delete:   () => require('./commands/files/delete'),
      }
    },
    folders: {
      description: 'Drive folders',
      commands: {
        list:   () => require('./commands/folders/list'),
        create: () => require('./commands/folders/create'),
        delete: () => require('./commands/folders/delete'),
      }
    },
    permissions: {
      description: 'File and folder permissions',
      commands: {
        list:   () => require('./commands/permissions/list'),
        add:    () => require('./commands/permissions/add'),
        remove: () => require('./commands/permissions/remove'),
      }
    }
  }
};
```

### Step 3: Create the shared helper

Create `commands/_helpers.js`:
```javascript
const { google } = require('googleapis');

function getClient(context) {
  return google.drive({ version: 'v3', auth: context.auth });
}

module.exports = { getClient };
```

### Step 4: Implement each command

Create the directory structure:
```
commands/
├── _helpers.js
├── files/
│   ├── list.js        # --limit, --folder, --type flags
│   ├── get.js         # <id> argument
│   ├── upload.js      # <path> argument, --folder, --name flags
│   ├── download.js    # <id> argument, --output flag (required)
│   ├── search.js      # <query> argument, --limit flag
│   ├── move.js        # <id> argument, --folder flag (required)
│   └── delete.js      # <id> argument, --confirm flag
├── folders/
│   ├── list.js        # --parent flag
│   ├── create.js      # <name> argument, --parent flag
│   └── delete.js      # <id> argument, --confirm flag
└── permissions/
    ├── list.js        # <file-id> argument
    ├── add.js         # <file-id> argument, --email and --role flags (required)
    └── remove.js      # <file-id> and <permission-id> arguments
```

Each command follows the `{ meta, run }` pattern from the Gmail plugin. Key implementation details:

- **files upload**: Use `drive.files.create` with `media` and `requestBody` options. Read the local file with `fs.createReadStream()`. Set the MIME type using a lookup based on the file extension or let Google detect it.
- **files download**: Call `drive.files.get({ fileId, alt: 'media' }, { responseType: 'stream' })` and pipe the response to `fs.createWriteStream()` at the `--output` path.
- **files move**: Call `drive.files.update` with `addParents` and `removeParents` parameters. You need to first call `files.get` to find the current parent.
- **folders list**: Same as `files list` but add `q: "mimeType='application/vnd.google-apps.folder'"` to the query.
- **folders create**: Call `drive.files.create` with `requestBody: { name, mimeType: 'application/vnd.google-apps.folder', parents: [parentId] }`.
- **permissions add**: Call `drive.permissions.create` with `fileId` and `requestBody: { type: 'user', role, emailAddress }`.

### Step 5: Publish

1. Verify the package with `npm pack --dry-run`.
2. Publish: `npm publish --access public`.

## Files to Create or Modify
- `package.json` -- New file. Package metadata.
- `index.js` -- New file. Plugin contract with 3 resources and 12 command loaders.
- `commands/_helpers.js` -- New file. Shared Drive client builder.
- `commands/files/list.js` -- New file.
- `commands/files/get.js` -- New file.
- `commands/files/upload.js` -- New file.
- `commands/files/download.js` -- New file.
- `commands/files/search.js` -- New file.
- `commands/files/move.js` -- New file.
- `commands/files/delete.js` -- New file.
- `commands/folders/list.js` -- New file.
- `commands/folders/create.js` -- New file.
- `commands/folders/delete.js` -- New file.
- `commands/permissions/list.js` -- New file.
- `commands/permissions/add.js` -- New file.
- `commands/permissions/remove.js` -- New file.
- `README.md` -- New file.
- `.gitignore` -- New file.

## Acceptance Criteria
- [ ] The plugin repo exists at `git@github.com:FredLackey/devutils-api-drive.git`
- [ ] `index.js` exports the correct contract with `name: 'drive'`, `auth: 'google'`
- [ ] All 12 command files exist and export `{ meta, run }`
- [ ] `dev api enable drive` installs the plugin
- [ ] `dev api drive files list` returns a list of files
- [ ] `dev api drive files upload ./test.txt` uploads a file
- [ ] `dev api drive files download <id> --output ./test.txt` downloads a file
- [ ] `dev api drive folders list` lists folders
- [ ] `dev api drive permissions list <file-id>` lists permissions
- [ ] `dev schema api.drive` lists all 3 resources
- [ ] API errors are caught and returned as structured errors
- [ ] The npm package publishes successfully

## Testing
```bash
# Install and verify
dev api enable drive
dev api list
dev schema api.drive

# Test file operations (requires google auth)
dev auth login google
dev api drive files list --limit 5 --format json
dev api drive folders list --format json
dev api drive files upload ./test.txt --format json
dev api drive files search "name contains 'test'" --format json

# Test permissions
dev api drive permissions list <file-id> --format json
```

## Notes
- Files upload requires reading from the local filesystem. Use `fs.createReadStream()` for memory efficiency -- don't load the entire file into memory with `readFileSync`.
- Files download writes to the local filesystem. Always verify the `--output` path's parent directory exists before writing. Use `fs.mkdirSync(path.dirname(output), { recursive: true })` to create it.
- The `files move` command needs two API calls: one to get the current parents, one to update. Wrap both in the same try/catch.
- Google Drive's `files.delete` is permanent (bypasses trash). The `--confirm` flag requirement protects against accidental deletion. Without `--confirm`, show what would be deleted and ask for confirmation (or fail in non-interactive mode).
- Folders are just files with MIME type `application/vnd.google-apps.folder` in Google Drive. The `folders` resource is a convenience wrapper around the same `files` API.
