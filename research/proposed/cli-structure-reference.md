# CLI Structure Reference

Research notes on the command structure used by Google Workspace CLI (`gws`), which serves as the model for how DevUtils CLI should be structured going forward.

**Source**: [github.com/googleworkspace/cli](https://github.com/googleworkspace/cli) (Apache-2.0, v0.4.4, March 2026)

---

## Command Hierarchy

The syntax follows an AWS CLI-style pattern:

```
<tool> <service> <resource> [sub-resource] <method> [flags]
```

Each segment narrows the scope:

| Segment | What It Represents | Example |
|---|---|---|
| `tool` | The CLI binary itself | `gws`, `dev` |
| `service` | A top-level API or domain | `drive`, `gmail`, `sheets` |
| `resource` | An entity within the service | `files`, `messages`, `spreadsheets` |
| `sub-resource` | A nested entity (optional) | `spaces messages` in `chat spaces messages create` |
| `method` | The action to perform | `list`, `get`, `create`, `delete`, `update` |
| `flags` | Parameters and options | `--params`, `--json`, `--format` |

### Real Examples

```bash
gws drive files list                          # service.resource.method
gws sheets spreadsheets create                # service.resource.method
gws chat spaces messages create               # service.resource.sub-resource.method
gws gmail users messages get                  # service.resource.sub-resource.method
gws schema drive.files.list                   # built-in: introspect any endpoint
gws auth login                                # built-in: authentication
```

### Built-In Commands

Some commands are not part of the service/resource tree. They are top-level commands that ship with the tool:

```bash
gws auth setup          # configure OAuth credentials
gws auth login          # authenticate with Google
gws auth export         # export current token
gws schema <path>       # introspect any API endpoint
gws mcp                 # start MCP server
```

### Helper Commands (Shortcut Prefix)

`gws` also ships "helper" commands prefixed with `+` that wrap common multi-step operations into a single call:

```bash
gws sheets +append --spreadsheet ID --values 'Alice,100,true'
gws drive +upload ./report.pdf --parent FOLDER_ID
gws gmail +triage --format json
```

These are convenience aliases. They do not replace the core `service resource method` pattern, they layer on top of it.

---

## Input Patterns

All input is flag-based. There is no stdin piping and no positional arguments for data.

### `--params` (Query and Path Parameters)

Used for URL path parameters and query parameters. Accepts a JSON string.

```bash
gws drive files list --params '{"pageSize": 5}'
gws gmail users messages get --params '{"userId": "me", "id": "MSG_ID"}'
```

Required path parameters are validated against the API schema. Missing required params produce a validation error.

### `--json` (Request Body)

Used for POST, PUT, and PATCH request bodies. Accepts a JSON string. Only available on methods that accept a request body.

```bash
gws sheets spreadsheets create --json '{"properties": {"title": "Q1 Budget"}}'
```

Combining both flags:

```bash
gws sheets spreadsheets values append \
  --params '{"spreadsheetId": "ID", "range": "Sheet1!A1", "valueInputOption": "USER_ENTERED"}' \
  --json '{"values": [["Name", "Score"], ["Alice", 95]]}'
```

### `--upload` (File Upload)

For multipart uploads. Available only on methods that support media upload.

```bash
gws drive files create --json '{"name": "report.pdf"}' --upload ./report.pdf
```

### `--fields` (Response Field Mask)

Limits which fields are returned. Standard Google API feature.

```bash
gws drive files list --params '{"q": "name contains \"Report\""}' --fields "files(id,name,mimeType)"
```

### No Stdin Support

Commands do not accept piped input. All data must be passed through flags. This is a deliberate design choice to keep commands self-contained and inspectable.

---

## Output Patterns

### Default: Pretty-Printed JSON to stdout

All command output is structured JSON by default. Pretty-printed for human readability.

```bash
gws drive files list --params '{"pageSize": 2}'
# {
#   "files": [
#     { "id": "abc123", "name": "report.pdf", "mimeType": "application/pdf" },
#     { "id": "def456", "name": "notes.txt", "mimeType": "text/plain" }
#   ]
# }
```

### `--format` Flag

Switches output format. Case-insensitive. Unrecognized values fall back to JSON.

| Value | Behavior |
|---|---|
| `json` | Pretty-printed JSON (default) |
| `table` | Flattened columns, nested keys become `parent.child`, 60-char column cap with ellipsis |
| `yaml` / `yml` | Double-quoted strings, block scalars for multi-line, `---` separators for paginated |
| `csv` | Standard CSV escaping (quotes doubled, commas/newlines wrapped) |

```bash
gws drive files list --format table
gws drive files list --format csv
gws drive files list --format yaml
```

### Paginated Output

When using `--page-all`, the output format changes:

- **JSON**: Switches to compact NDJSON (one JSON object per line, not pretty-printed)
- **Table/CSV**: First page includes headers, subsequent pages are data-only
- **YAML**: Each page prefixed with `---`

Pagination controls:

| Flag | Default | Purpose |
|---|---|---|
| `--page-all` | off | Enable auto-pagination |
| `--page-limit N` | 10 | Max pages to fetch |
| `--page-delay MS` | 100 | Delay between paginated requests |

### Binary Output

`--output` / `-o` streams binary responses (file downloads) to disk. Returns a JSON summary with file path, MIME type, and byte count.

```bash
gws drive files export --params '{"fileId": "ID", "mimeType": "application/pdf"}' --output ./report.pdf
```

### Error Output

All errors go to **stderr** as structured JSON. Exit code is 0 for success, 1 for any error.

```json
{
  "error": {
    "code": 403,
    "message": "Gmail API has not been used in project...",
    "reason": "accessNotConfigured",
    "enable_url": "https://console.developers.google.com/..."
  }
}
```

Error types map to HTTP-style codes: API errors use the upstream code, validation errors are 400, auth errors are 401, internal errors are 500.

### Dry Run

`--dry-run` shows the request that _would_ be made without executing it:

```json
{
  "dry_run": true,
  "url": "https://www.googleapis.com/drive/v3/files",
  "method": "GET",
  "query_params": { "pageSize": "5" },
  "body": null,
  "is_multipart_upload": false
}
```

---

## Schema Introspection

`gws schema` lets you inspect any API endpoint before using it.

### Method Schema (3+ dot-separated parts)

```bash
gws schema drive.files.list
```

Returns the full method signature:

```json
{
  "httpMethod": "GET",
  "path": "drive/v3/files",
  "description": "Lists the user's files.",
  "parameters": {
    "pageSize": {
      "type": "integer",
      "required": false,
      "location": "query",
      "description": "...",
      "format": "int32",
      "default": "100"
    }
  },
  "scopes": ["https://www.googleapis.com/auth/drive"],
  "requestBody": { "schemaRef": "File", "schema": { "..." } },
  "response": { "schemaRef": "FileList", "schema": { "..." } }
}
```

### Type Schema (2 dot-separated parts)

```bash
gws schema drive.File
```

Returns the type definition (properties, types, descriptions) for a named schema.

### Error Handling

If a schema or method is not found, the command lists available options and suggests alternatives (e.g., "did you mean `.list`?").

---

## Composability

Commands are designed to chain through standard Unix pipes, not through built-in mechanisms.

```bash
# Pipe JSON output to jq
gws drive files list --params '{"pageSize": 100}' --page-all | jq -r '.files[].name'

# Extract an ID and use it in the next command
FILE_ID=$(gws drive files list --params '{"pageSize": 1}' | jq -r '.files[0].id')
gws drive files get --params "{\"fileId\": \"$FILE_ID\"}"
```

There is no built-in pipe-input mechanism. You use `jq`, shell variables, or scripting to glue commands together.

---

## Configuration

Config lives in `~/.config/gws/` (overridable via `GOOGLE_WORKSPACE_CLI_CONFIG_DIR`).

Environment variables take precedence over config files:

| Variable | Purpose |
|---|---|
| `GOOGLE_WORKSPACE_CLI_TOKEN` | Pre-obtained auth token |
| `GOOGLE_WORKSPACE_CLI_CREDENTIALS_FILE` | Path to OAuth or service account JSON |
| `GOOGLE_WORKSPACE_CLI_CLIENT_ID` | OAuth client ID |
| `GOOGLE_WORKSPACE_CLI_CLIENT_SECRET` | OAuth client secret |
| `GOOGLE_WORKSPACE_CLI_CONFIG_DIR` | Override config directory path |

Variables can also be set in a `.env` file.

---

## How This Applies to DevUtils

### What We're Adopting

1. **Command hierarchy**: `dev <service> <resource> <method> [flags]` as the standard pattern
2. **JSON-first I/O**: Structured JSON output by default, errors on stderr as JSON
3. **`--format` flag**: Support `json`, `table`, `yaml`, `csv` output at all times
4. **`--params` and `--json` input**: Flag-based input using JSON strings
5. **`--dry-run`**: Show what would happen without doing it
6. **Schema introspection**: `dev schema <path>` to inspect available commands and their input/output shapes
7. **Exit codes**: 0 for success, 1 for error, structured error JSON on stderr

### Where We May Diverge

1. **Stdin support**: Worth considering. Allowing piped JSON input (`echo '{}' | dev config set`) would improve scriptability, especially for AI agents that generate output and pipe it forward.
2. **Format detection**: Auto-detect when output is being piped (not a TTY) and switch to compact JSON automatically, similar to how `gh` and other modern CLIs behave.
3. **Additional formats**: Could add `text` (plain human-readable) for non-structured output when the user just wants a quick answer.
4. **Command surface**: Not dynamically generated from a discovery service. Our commands are hand-authored, but the naming pattern stays consistent.
5. **Helper prefix**: The `+` prefix for shortcuts is worth evaluating. Could use a different convention if `+` causes shell escaping issues.
