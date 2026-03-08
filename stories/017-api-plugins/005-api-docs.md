# Story 005: Build the Google Docs API Plugin

## Goal
Build the Google Docs plugin as a separate git repo and npm package (`@fredlackey/devutils-api-docs`). It wraps the Google Docs API into 4 commands under a single resource: documents (list/get/create/export). Auth service: `google`. This is the smallest of the Google plugins, making it a quick build.

## Prerequisites
- 017-api-plugins/001 (plugin template)
- 011-auth/001 (auth service)

## Background
Google Docs is the fourth and final Google service plugin. Like the Sheets plugin, listing documents requires the Drive API (there is no `docs.list` endpoint), while get and create use the Docs API directly. Export uses the Drive API's export functionality.

The plugin uses `googleapis`, specifically `google.docs('v1')` and `google.drive('v3')`. Command signatures are defined in `research/proposed/proposed-command-syntax.md` lines 806-831.

### Docs API Endpoint Mapping

| Command | API Method | Notes |
|---------|-----------|-------|
| documents list | drive.files.list (filtered) | Filter by `application/vnd.google-apps.document` MIME type |
| documents get | docs.documents.get | Returns document metadata and content structure |
| documents create | docs.documents.create | Creates a new empty document with a title |
| documents export | drive.files.export | Exports document as PDF, text, DOCX, or HTML |

## Technique

### Step 1: Create the repo and scaffold

1. Create the repo at `git@github.com:FredLackey/devutils-api-docs.git`.
2. Copy and customize the plugin template: `<service>` -> `docs`, auth -> `google`.
3. Add `googleapis` to `dependencies`.

### Step 2: Set up `index.js`

```javascript
module.exports = {
  name: 'docs',
  description: 'Google Docs (documents)',
  version: '1.0.0',
  auth: 'google',
  resources: {
    documents: {
      description: 'Google Docs documents',
      commands: {
        list:   () => require('./commands/documents/list'),
        get:    () => require('./commands/documents/get'),
        create: () => require('./commands/documents/create'),
        export: () => require('./commands/documents/export'),
      }
    }
  }
};
```

### Step 3: Create the shared helper

Create `commands/_helpers.js`:
```javascript
const { google } = require('googleapis');

function getDocsClient(context) {
  return google.docs({ version: 'v1', auth: context.auth });
}

function getDriveClient(context) {
  return google.drive({ version: 'v3', auth: context.auth });
}

module.exports = { getDocsClient, getDriveClient };
```

### Step 4: Implement each command

Create the directory structure:
```
commands/
├── _helpers.js
└── documents/
    ├── list.js        # --limit flag. Uses Drive API filtered by mimeType
    ├── get.js         # <id> argument
    ├── create.js      # <title> argument
    └── export.js      # <id> argument, --output (required) and --type flags
```

Key implementation details:

- **documents list**: Use the Drive API, same pattern as the Sheets plugin's `spreadsheets list`: `drive.files.list({ q: "mimeType='application/vnd.google-apps.document'", pageSize: args.limit || 20 })`.

- **documents get**: Call `docs.documents.get({ documentId: args.id })`. This returns the full document structure including the body content. The response is complex (it's a tree of structural elements), but just return the raw response and let `context.output` handle formatting.

- **documents create**: Call `docs.documents.create({ requestBody: { title: args.title } })`. Returns the new document's metadata including its ID.

- **documents export**: Use the Drive API's export: `drive.files.export({ fileId: args.id, mimeType }, { responseType: 'stream' })`. Pipe the stream to `fs.createWriteStream(args.output)`. Map the `--type` flag to MIME types:
  ```javascript
  const EXPORT_TYPES = {
    pdf:  'application/pdf',
    txt:  'text/plain',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    html: 'text/html'
  };
  ```
  Default to `pdf` if `--type` is not specified.

### Step 5: Publish

Verify with `npm pack --dry-run`, then `npm publish --access public`.

## Files to Create or Modify
- `package.json` -- New file. Package metadata.
- `index.js` -- New file. Plugin contract with 1 resource and 4 command loaders.
- `commands/_helpers.js` -- New file. Shared client builders.
- `commands/documents/list.js` -- New file.
- `commands/documents/get.js` -- New file.
- `commands/documents/create.js` -- New file.
- `commands/documents/export.js` -- New file.
- `README.md` -- New file.
- `.gitignore` -- New file.

## Acceptance Criteria
- [ ] The plugin repo exists at `git@github.com:FredLackey/devutils-api-docs.git`
- [ ] `index.js` exports the correct contract with `name: 'docs'`, `auth: 'google'`
- [ ] All 4 command files exist and export `{ meta, run }`
- [ ] `dev api enable docs` installs the plugin
- [ ] `dev api docs documents list` returns a list of documents
- [ ] `dev api docs documents get <id>` returns document content
- [ ] `dev api docs documents create "My Doc"` creates a new document
- [ ] `dev api docs documents export <id> --output ./doc.pdf` exports to PDF
- [ ] `dev api docs documents export <id> --output ./doc.txt --type txt` exports to plain text
- [ ] `dev schema api.docs` lists the documents resource
- [ ] API errors are caught and returned as structured errors
- [ ] The npm package publishes successfully

## Testing
```bash
# Install and verify
dev api enable docs
dev api list
dev schema api.docs

# Test document operations (requires google auth)
dev auth login google
dev api docs documents list --limit 5 --format json
dev api docs documents create "Test Document" --format json

# Get a document's content
dev api docs documents get <id> --format json

# Export in different formats
dev api docs documents export <id> --output ./test.pdf
dev api docs documents export <id> --output ./test.txt --type txt
dev api docs documents export <id> --output ./test.docx --type docx

# Verify exported file exists
ls -la ./test.pdf
```

## Notes
- The `documents get` response from the Google Docs API is very large and deeply nested. It includes the entire document structure: paragraphs, text runs, tables, lists, etc. Don't try to simplify or transform it -- just return it as-is. Users who need specific parts can pipe the JSON output through `jq`.
- The `documents export` command writes binary data to disk (for PDF and DOCX) or text data (for TXT and HTML). Use streaming (`responseType: 'stream'`) to avoid loading the entire document into memory.
- If `--output` points to a path where the parent directory doesn't exist, create it with `fs.mkdirSync(dir, { recursive: true })`.
- The `documents list` command, like `spreadsheets list`, uses the Drive API because the Docs API has no list endpoint. This is a pattern across Google Workspace: Drive is the file system, and the individual service APIs are for working with file contents.
- This is the simplest Google plugin (only 4 commands, 1 resource). It's a good one to implement quickly to build confidence before tackling the larger non-Google plugins.
