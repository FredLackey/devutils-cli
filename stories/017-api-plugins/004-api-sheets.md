# Story 004: Build the Google Sheets API Plugin

## Goal
Build the Google Sheets plugin as a separate git repo and npm package (`@fredlackey/devutils-api-sheets`). It wraps the Google Sheets API into 9 commands across 3 resources: spreadsheets (list/get/create), values (get/set/append/clear), and sheets (list/add/remove). Auth service: `google`.

## Prerequisites
- 017-api-plugins/001 (plugin template)
- 011-auth/001 (auth service)

## Background
Google Sheets is the third Google service plugin. It shares auth with Gmail and Drive. The Sheets API has a slightly different structure than the other Google APIs because it has two distinct concerns: spreadsheet-level metadata and cell-level data. The `spreadsheets` resource handles metadata. The `values` resource handles reading and writing cell data. The `sheets` resource manages individual tabs within a spreadsheet.

The plugin uses `googleapis`, specifically `google.sheets('v4')`. Command signatures are defined in `research/proposed/proposed-command-syntax.md` lines 750-804.

### Sheets API Endpoint Mapping

| Command | API Method | Notes |
|---------|-----------|-------|
| spreadsheets list | drive.files.list (filtered) | Sheets API doesn't have a list endpoint; use Drive API filtered by spreadsheet MIME type |
| spreadsheets get | spreadsheets.get | Returns spreadsheet metadata and sheet (tab) info |
| spreadsheets create | spreadsheets.create | Creates a new spreadsheet with a title |
| values get | spreadsheets.values.get | Reads cell values from a range |
| values set | spreadsheets.values.update | Writes cell values to a range |
| values append | spreadsheets.values.append | Appends rows after existing data |
| values clear | spreadsheets.values.clear | Clears cell values in a range |
| sheets list | spreadsheets.get (sheets property) | Returns the list of sheets/tabs |
| sheets add | spreadsheets.batchUpdate (addSheet) | Adds a new sheet/tab |
| sheets remove | spreadsheets.batchUpdate (deleteSheet) | Removes a sheet/tab, requires `--confirm` |

## Technique

### Step 1: Create the repo and scaffold

1. Create the repo at `git@github.com:FredLackey/devutils-api-sheets.git`.
2. Copy and customize the plugin template: `<service>` -> `sheets`, auth -> `google`.
3. Add `googleapis` to `dependencies`.

### Step 2: Set up `index.js`

```javascript
module.exports = {
  name: 'sheets',
  description: 'Google Sheets (spreadsheets, values, sheets)',
  version: '1.0.0',
  auth: 'google',
  resources: {
    spreadsheets: {
      description: 'Spreadsheet metadata',
      commands: {
        list:   () => require('./commands/spreadsheets/list'),
        get:    () => require('./commands/spreadsheets/get'),
        create: () => require('./commands/spreadsheets/create'),
      }
    },
    values: {
      description: 'Cell values',
      commands: {
        get:    () => require('./commands/values/get'),
        set:    () => require('./commands/values/set'),
        append: () => require('./commands/values/append'),
        clear:  () => require('./commands/values/clear'),
      }
    },
    sheets: {
      description: 'Sheets (tabs) within a spreadsheet',
      commands: {
        list:   () => require('./commands/sheets/list'),
        add:    () => require('./commands/sheets/add'),
        remove: () => require('./commands/sheets/remove'),
      }
    }
  }
};
```

### Step 3: Create the shared helper

Create `commands/_helpers.js`:
```javascript
const { google } = require('googleapis');

function getSheetsClient(context) {
  return google.sheets({ version: 'v4', auth: context.auth });
}

function getDriveClient(context) {
  return google.drive({ version: 'v3', auth: context.auth });
}

module.exports = { getSheetsClient, getDriveClient };
```

Note: you need both clients because `spreadsheets list` uses the Drive API to find spreadsheets.

### Step 4: Implement each command

Create the directory structure:
```
commands/
├── _helpers.js
├── spreadsheets/
│   ├── list.js        # --limit flag. Uses Drive API filtered by mimeType
│   ├── get.js         # <id> argument
│   └── create.js      # <title> argument
├── values/
│   ├── get.js         # <spreadsheet-id> and <range> arguments
│   ├── set.js         # <spreadsheet-id> and <range> arguments, data via --json
│   ├── append.js      # <spreadsheet-id> and <range> arguments, data via --json
│   └── clear.js       # <spreadsheet-id> and <range> arguments
└── sheets/
    ├── list.js        # <spreadsheet-id> argument
    ├── add.js         # <spreadsheet-id> and <title> arguments
    └── remove.js      # <spreadsheet-id> and <sheet-id> arguments, --confirm flag
```

Key implementation details:

- **spreadsheets list**: There is no Sheets API endpoint for listing spreadsheets. Use the Drive API instead: `drive.files.list({ q: "mimeType='application/vnd.google-apps.spreadsheet'", pageSize: args.limit || 20 })`.
- **values get**: Call `sheets.spreadsheets.values.get({ spreadsheetId, range })`. The range uses A1 notation (e.g., `Sheet1!A1:C10`).
- **values set**: Call `sheets.spreadsheets.values.update` with `valueInputOption: 'USER_ENTERED'` and the data from the `--json` flag. The JSON should be `{ "values": [["row1col1", "row1col2"], ["row2col1", "row2col2"]] }`.
- **values append**: Similar to `set` but uses `sheets.spreadsheets.values.append`. Appends after the last row with data.
- **sheets add**: Uses `sheets.spreadsheets.batchUpdate` with the `addSheet` request: `{ requests: [{ addSheet: { properties: { title } } }] }`.
- **sheets remove**: Uses `sheets.spreadsheets.batchUpdate` with `deleteSheet`: `{ requests: [{ deleteSheet: { sheetId: parseInt(sheetId) } }] }`. Note that `sheetId` is a number, not a string.

### Step 5: Publish

Verify with `npm pack --dry-run`, then `npm publish --access public`.

## Files to Create or Modify
- `package.json` -- New file. Package metadata.
- `index.js` -- New file. Plugin contract with 3 resources and 9 command loaders.
- `commands/_helpers.js` -- New file. Shared client builders.
- `commands/spreadsheets/list.js` -- New file.
- `commands/spreadsheets/get.js` -- New file.
- `commands/spreadsheets/create.js` -- New file.
- `commands/values/get.js` -- New file.
- `commands/values/set.js` -- New file.
- `commands/values/append.js` -- New file.
- `commands/values/clear.js` -- New file.
- `commands/sheets/list.js` -- New file.
- `commands/sheets/add.js` -- New file.
- `commands/sheets/remove.js` -- New file.
- `README.md` -- New file.
- `.gitignore` -- New file.

## Acceptance Criteria
- [ ] The plugin repo exists at `git@github.com:FredLackey/devutils-api-sheets.git`
- [ ] `index.js` exports the correct contract with `name: 'sheets'`, `auth: 'google'`
- [ ] All 9 command files exist and export `{ meta, run }`
- [ ] `dev api enable sheets` installs the plugin
- [ ] `dev api sheets spreadsheets list` returns spreadsheets
- [ ] `dev api sheets values get <id> "Sheet1!A1:C10"` returns cell values
- [ ] `dev api sheets values set <id> "Sheet1!A1" --json '{"values":[["hello"]]}'` writes a value
- [ ] `dev api sheets sheets list <id>` lists tabs in a spreadsheet
- [ ] `dev schema api.sheets` lists all 3 resources
- [ ] API errors are caught and returned as structured errors
- [ ] The npm package publishes successfully

## Testing
```bash
# Install and verify
dev api enable sheets
dev api list
dev schema api.sheets

# Test spreadsheet operations (requires google auth)
dev auth login google
dev api sheets spreadsheets list --limit 5 --format json
dev api sheets spreadsheets create "Test Sheet" --format json

# Test cell operations
dev api sheets values get <spreadsheet-id> "Sheet1!A1:C10" --format json
dev api sheets values append <spreadsheet-id> "Sheet1!A1" --json '{"values":[["Alice",95],["Bob",87]]}' --format json

# Test sheet/tab operations
dev api sheets sheets list <spreadsheet-id> --format json
dev api sheets sheets add <spreadsheet-id> "New Tab" --format json
```

## Notes
- The `spreadsheets list` command is a special case because the Sheets API itself doesn't provide a list endpoint. You have to use the Drive API and filter by MIME type. This means the helper file needs to export both a Sheets client and a Drive client. This is fine -- they share the same auth token.
- Range notation uses A1 style. Examples: `Sheet1!A1:C10`, `Sheet1!A:A`, `Sheet1!1:1`. If the user omits the sheet name, the API defaults to the first sheet. Document this in the command's `meta.description` or as a note in the flag descriptions.
- The `values set` and `values append` commands take data through the global `--json` flag. The core CLI parses `--json` and passes the parsed object to the command via `args.json`. The data shape must be `{ values: [[...], [...]] }` -- an array of arrays where each inner array is a row.
- Sheet IDs (used in `sheets remove`) are numeric. They are not the same as the spreadsheet ID (which is a long alphanumeric string). You can get sheet IDs from the `spreadsheets get` or `sheets list` response.
- The `sheets remove` command deletes a tab permanently. There is no undo. Require `--confirm`.
