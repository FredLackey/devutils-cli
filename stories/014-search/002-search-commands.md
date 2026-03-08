# Story 002: Search Commands

## Goal
Build the five remaining search commands: `dev search query`, `dev search keyword`, `dev search semantic`, `dev search get`, and `dev search index`. Each is a thin wrapper around a corresponding QMD command. `query` runs hybrid search (BM25 + vector + LLM re-ranking) for the highest quality results. `keyword` runs BM25-only for fast exact matching. `semantic` runs vector-only for conceptual similarity. `get` retrieves a specific document by path or ID. `index` rebuilds or updates the search index. All five check for QMD availability first using the shared `checkQmd()` function from the previous story, then shell out to QMD, capture the output, and format it through `context.output`. These are deliberately thin wrappers. DevUtils does not reimplement any search logic. It delegates everything to QMD and adds consistent formatting, error handling, and the QMD install check.

## Prerequisites
- 014-search/001 (QMD check, status, and collections)

## Background
QMD provides three search modes, each with different trade-offs:

- **Hybrid (query)**: Combines BM25 keyword matching and vector similarity, then uses an LLM to re-rank the combined results. Best result quality, but slowest because it involves an LLM call.
- **Keyword (keyword)**: Pure BM25 full-text search. Fast, no model loading. Good for finding exact terms and phrases. Returns results ranked by term frequency and relevance.
- **Semantic (semantic)**: Vector cosine similarity search. Requires embeddings to be generated first (via the index command). Finds conceptually similar content even when the exact words don't match. Slower than keyword but faster than hybrid.

Each mode maps to a QMD CLI command. DevUtils adds value by:
1. Checking for QMD installation before running.
2. Passing results through `context.output` for consistent JSON/table/human formatting.
3. Providing a unified `dev search` namespace so users don't need to remember QMD's own CLI syntax.
4. Handling errors gracefully and showing helpful messages.

The `get` command retrieves a single document by its file path or a QMD document ID (which looks like `#abc123`). This is useful for fetching the full content of a search result.

The `index` command triggers a re-index of all collections. This needs to happen after adding new collections, after files change on disk, or when the user wants to regenerate embeddings for vector search.

Reference: `research/proposed/proposed-command-syntax.md` lines 515-565 for the exact command syntax and flags.

## Technique

### Step 1: Implement query.js

Fill in the meta:

```javascript
const meta = {
  description: 'Hybrid search combining BM25 keyword matching, vector similarity, and LLM re-ranking',
  arguments: [
    { name: 'query', description: 'Search query text', required: true }
  ],
  flags: [
    { name: 'collection', type: 'string', description: 'Restrict search to a specific collection' },
    { name: 'limit', type: 'number', description: 'Maximum number of results to return (default: 10)' },
    { name: 'min-score', type: 'number', description: 'Minimum relevance score between 0.0 and 1.0' }
  ]
};
```

In the `run` function:

1. Run the QMD check using `checkQmd(context)`. Exit if not available.
2. Build the QMD command:

```javascript
let cmd = `qmd query "${args.arguments.query}"`;

if (args.flags.collection) {
  cmd += ` --collection "${args.flags.collection}"`;
}
if (args.flags.limit) {
  cmd += ` --limit ${args.flags.limit}`;
}
if (args.flags['min-score']) {
  cmd += ` --min-score ${args.flags['min-score']}`;
}
```

3. Execute and capture output:

```javascript
const result = await context.shell.exec(cmd);
```

4. Parse the output. QMD returns search results, typically one per line or as a JSON structure. The parsing depends on QMD's output format. Try parsing as JSON first. If that fails, treat the output as line-delimited text and structure it into an array of result objects:

```javascript
function parseSearchResults(output) {
  // Try JSON first
  try {
    return JSON.parse(output);
  } catch (err) {
    // Fall back to line parsing
  }

  // Parse line-delimited results
  const lines = output.trim().split('\n').filter(Boolean);
  return lines.map(line => ({ raw: line }));
}
```

5. Pass the structured results to `context.output.render()`.

For human-readable output, format each result as:

```
1. path/to/document.md (score: 0.92)
   First line of the matching excerpt...

2. path/to/other.md (score: 0.85)
   Another matching excerpt...
```

6. If QMD returns an error (non-zero exit code), pass the error message through `context.errors.throw()`.

### Step 2: Implement keyword.js

Fill in the meta:

```javascript
const meta = {
  description: 'Fast BM25 full-text keyword search',
  arguments: [
    { name: 'query', description: 'Search query text', required: true }
  ],
  flags: [
    { name: 'collection', type: 'string', description: 'Restrict search to a specific collection' },
    { name: 'limit', type: 'number', description: 'Maximum number of results to return (default: 10)' }
  ]
};
```

The implementation follows the same pattern as `query.js`:

1. QMD check.
2. Build the command: `qmd keyword "<query>" [--collection <name>] [--limit <n>]`
3. Execute and capture output.
4. Parse results (reuse the same `parseSearchResults` helper).
5. Pass to `context.output.render()`.

The command string changes but the flow is identical. To avoid duplicating the parse-and-render logic, create a shared helper in `qmd.js`:

```javascript
// Add to src/commands/search/qmd.js

async function runQmdSearch(cmd, context) {
  const result = await context.shell.exec(cmd);

  if (result.exitCode !== 0) {
    context.errors.throw(1, result.stderr || `QMD command failed: ${cmd}`);
    return null;
  }

  return parseSearchResults(result.stdout);
}

function parseSearchResults(output) {
  if (!output || !output.trim()) {
    return [];
  }
  try {
    const parsed = JSON.parse(output);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (err) {
    // Treat as line-delimited text
    return output.trim().split('\n').filter(Boolean).map(line => ({ raw: line }));
  }
}
```

Then each search command becomes:

```javascript
const results = await runQmdSearch(cmd, context);
if (results === null) return; // error already reported
if (results.length === 0) {
  context.output.print('No results found.');
  return;
}
context.output.render(results);
```

### Step 3: Implement semantic.js

Fill in the meta:

```javascript
const meta = {
  description: 'Vector cosine similarity search for conceptually related content',
  arguments: [
    { name: 'query', description: 'Search query text', required: true }
  ],
  flags: [
    { name: 'collection', type: 'string', description: 'Restrict search to a specific collection' },
    { name: 'limit', type: 'number', description: 'Maximum number of results to return (default: 10)' }
  ]
};
```

Same pattern: QMD check, build `qmd semantic "<query>"` with flags, execute, parse, render.

If embeddings haven't been generated yet (the index command hasn't been run with vector indexing), QMD may return an error. Catch this and print: "No embeddings found. Run `dev search index` to generate them before using semantic search."

### Step 4: Implement get.js

Fill in the meta:

```javascript
const meta = {
  description: 'Retrieve a document by file path or QMD document ID',
  arguments: [
    { name: 'target', description: 'File path or document ID (e.g., #abc123)', required: true }
  ],
  flags: [
    { name: 'full', type: 'boolean', description: 'Return the entire document instead of a snippet' },
    { name: 'line', type: 'number', description: 'Start at a specific line number' },
    { name: 'max-lines', type: 'number', description: 'Maximum number of lines to return' }
  ]
};
```

In the `run` function:

1. QMD check.
2. Build the command:

```javascript
let cmd = `qmd get "${args.arguments.target}"`;

if (args.flags.full) {
  cmd += ' --full';
}
if (args.flags.line) {
  cmd += ` --line ${args.flags.line}`;
}
if (args.flags['max-lines']) {
  cmd += ` --max-lines ${args.flags['max-lines']}`;
}
```

3. Execute and capture output.
4. For `get`, the output is the document content rather than a list of search results. Don't try to parse it as search results. Return it as-is for human output, or wrap it in a structured object for JSON:

```javascript
if (result.exitCode !== 0) {
  context.errors.throw(1, result.stderr || `Document not found: ${args.arguments.target}`);
  return;
}

const output = {
  target: args.arguments.target,
  content: result.stdout
};

context.output.render(output);
```

5. If the document isn't found, QMD returns a non-zero exit code. Pass that error through.

### Step 5: Implement index-cmd.js

The file is named `index-cmd.js` (not `index.js`) to avoid shadowing the service's `index.js` file. This is already established in the project structure.

Fill in the meta:

```javascript
const meta = {
  description: 'Rebuild or update the search index and generate embeddings',
  arguments: [],
  flags: [
    { name: 'force', type: 'boolean', description: 'Re-index everything from scratch (ignores incremental updates)' }
  ]
};
```

In the `run` function:

1. QMD check.
2. Build the command:

```javascript
let cmd = 'qmd index';
if (args.flags.force) {
  cmd += ' --force';
}
```

3. Execute. Indexing can take a while for large collections, so print a progress message before starting:

```javascript
context.output.print('Updating search index...');
if (args.flags.force) {
  context.output.print('Force flag set — re-indexing all documents from scratch.');
}

const result = await context.shell.exec(cmd);
```

4. Parse the result. The index command typically reports how many documents were indexed, how many were new vs. updated, and whether embeddings were generated:

```javascript
if (result.exitCode !== 0) {
  context.errors.throw(1, result.stderr || 'Index update failed.');
  return;
}

context.output.print(result.stdout || 'Index updated successfully.');
```

5. Pass through QMD's output. The index command's output is informational, not structured data. Print it directly rather than trying to parse it into a table.

### Step 6: Code style

- CommonJS modules
- 2-space indentation, LF line endings
- JSDoc comments on exported functions
- `'use strict';` at the top
- Use `context.shell.exec()` for all QMD commands
- Always quote query strings and paths in shell commands (they will contain spaces)
- Reuse helpers from `qmd.js` for the QMD check and result parsing

## Files to Create or Modify
- `src/commands/search/qmd.js` — Add `runQmdSearch()` and `parseSearchResults()` helpers
- `src/commands/search/query.js` — Replace the stub with hybrid search
- `src/commands/search/keyword.js` — Replace the stub with keyword search
- `src/commands/search/semantic.js` — Replace the stub with semantic search
- `src/commands/search/get.js` — Replace the stub with document retrieval
- `src/commands/search/index-cmd.js` — Replace the stub with index management

## Acceptance Criteria
- [ ] `dev search query "how to configure SSH"` runs hybrid search and returns formatted results
- [ ] `dev search query "SSH" --collection docs --limit 5` passes collection and limit flags to QMD
- [ ] `dev search query "SSH" --min-score 0.8` filters results by minimum relevance score
- [ ] `dev search keyword "SSH key"` runs BM25 keyword search
- [ ] `dev search keyword "SSH" --collection docs` restricts to a specific collection
- [ ] `dev search semantic "remote server access"` runs vector similarity search
- [ ] `dev search semantic` without embeddings prints a message about running `dev search index`
- [ ] `dev search get path/to/document.md` retrieves the document content
- [ ] `dev search get "#abc123"` retrieves a document by QMD document ID
- [ ] `dev search get path/to/doc.md --full` returns the entire document
- [ ] `dev search get path/to/doc.md --line 10 --max-lines 20` returns a specific range
- [ ] `dev search get nonexistent.md` prints a "not found" error
- [ ] `dev search index` updates the search index
- [ ] `dev search index --force` re-indexes everything from scratch
- [ ] All commands return "QMD is not installed" with install instructions when QMD is missing
- [ ] All commands return "No results found" when a search matches nothing (not an empty output)
- [ ] All commands output structured JSON when `--format json` is used
- [ ] All five commands export `{ meta, run }`

## Testing

```bash
# Prerequisite: QMD installed and at least one collection indexed
# If QMD is not installed, all commands should show the install message

# QMD not installed test
# (temporarily rename qmd or test on a clean machine)
dev search query "test"
# Expected: "QMD is not installed. Install it with: bun install -g @tobilu/qmd"

# With QMD installed and an indexed collection:

# Hybrid search
dev search query "how to configure git identities"
# Expected: List of results with scores, paths, and excerpts

# Hybrid with filters
dev search query "git" --collection notes --limit 3
# Expected: At most 3 results from the notes collection

# Keyword search
dev search keyword "SSH"
# Expected: BM25 results, typically faster than hybrid

# Semantic search
dev search semantic "remote server access"
# Expected: Conceptually similar documents (may not contain exact words)

# Get by path
dev search get ~/notes/ssh-config.md
# Expected: Document content (snippet by default)

dev search get ~/notes/ssh-config.md --full
# Expected: Full document content

dev search get ~/notes/ssh-config.md --line 5 --max-lines 10
# Expected: Lines 5-14 of the document

# Get nonexistent document
dev search get /does/not/exist.md
# Expected: Error message

# Index
dev search index
# Expected: "Updating search index..." followed by indexing output

dev search index --force
# Expected: Full re-index with progress output

# JSON output
dev search keyword "test" --format json
# Expected: JSON array of result objects
```

## Notes
- These commands are intentionally thin. The search logic, scoring, ranking, and embedding generation all happen inside QMD. DevUtils just handles the plumbing: check for QMD, build the command, run it, capture output, format it. Resist the temptation to add search features in DevUtils — that's QMD's job.
- Query strings often contain special characters, quotes, and operators. When building the shell command, the query needs to be properly escaped. Using double quotes around the query in the shell command handles most cases, but if the query itself contains double quotes, they need to be escaped. Consider using `JSON.stringify()` or a manual escaping function for the query argument.
- The `parseSearchResults` function tries JSON first because QMD might output structured JSON. If it doesn't (or if a future version changes the format), the line-based fallback ensures the command doesn't crash. Always prefer structured parsing but have a text fallback.
- The `index` command can be slow for large collections (thousands of documents, generating embeddings). Consider printing the progress output in real-time rather than capturing it all and printing at the end. If `context.shell.exec()` supports streaming output (pipe stdout to process.stdout), use that for the index command specifically.
- The file is named `index-cmd.js` to avoid conflicting with the service's `index.js` file in the same directory. The CLI router maps the `index` command name to this file through the search service's `index.js` command registration:
  ```javascript
  // In src/commands/search/index.js (service registration)
  commands: {
    // ...
    index: () => require('./index-cmd'),
    // ...
  }
  ```
- For the `get` command, when the target starts with `#`, it's a QMD document ID. When it doesn't, it's a file path. QMD handles both, so DevUtils doesn't need to distinguish. Just pass the target through as-is.
- If a search returns zero results, print "No results found." explicitly. Don't leave the output empty. An empty output is confusing for both humans and AI agents. Zero results is useful information.
- The `--min-score` flag on `query` accepts a decimal between 0.0 and 1.0. Don't validate the range in DevUtils. Let QMD handle validation. If someone passes `--min-score 5.0`, QMD will either reject it or return no results. DevUtils passes it through and lets QMD be authoritative about its own flags.
