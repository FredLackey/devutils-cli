# Story 002: AI Config Commands

## Goal
Build the four supporting AI commands: `dev ai list`, `dev ai sessions`, `dev ai show`, and `dev ai set`. `list` shows available AI tools and whether each is installed. `sessions` lists recent sessions for a tool by reading the tool's own session storage. `show` displays the current configuration for a tool from `ai.json`. `set` writes a configuration value so the user can change defaults without editing JSON by hand. Together with launch and resume from the previous story, these complete the `dev ai` service.

## Prerequisites
- 013-ai/001 (ai launch and resume, which establishes `AI_TOOLS` and the `ai.json` config file pattern)

## Background
After the user starts using `dev ai launch`, they'll need ways to manage their AI tool configurations. These four commands cover that:

- **list**: Quick overview. "What tools does DevUtils know about, and which ones do I actually have installed?" This is the first command a new user would run to see what's available.
- **sessions**: Session history. Claude Code and Gemini CLI both maintain session histories on disk. This command reads those histories so the user can find a session ID to pass to `dev ai resume`. The session storage locations are tool-specific.
- **show**: Current config. "What mode is claude set to? What model? What extra flags?" Reads from `~/.devutils/ai.json`.
- **set**: Change config. "Set claude's default mode to danger." Writes to `~/.devutils/ai.json`.

The `AI_TOOLS` registry defined in the launch story contains the information `list` needs (binary names, display names). Either import it from `launch.js` or extract it to a shared file (like `src/commands/ai/tools.js`) so all AI commands reference the same registry.

Session storage locations are tool-specific and change between versions. As of now:
- **Claude Code**: Sessions are stored in `~/.claude/` or `~/.config/claude/` depending on the platform. Session data is in JSONL files.
- **Gemini CLI**: Sessions are stored in `~/.gemini/` or `~/.config/gemini/`. Storage format varies.

Since these locations are not stable APIs, the `sessions` command should degrade gracefully. If it can't find or parse session data, it should say so rather than crash.

## Technique

### Step 1: Extract the shared tool registry

Pull the `AI_TOOLS` object out of `launch.js` and into `src/commands/ai/tools.js`. Add session storage paths to each tool's config:

```javascript
// src/commands/ai/tools.js
'use strict';

const path = require('path');
const os = require('os');

const AI_TOOLS = {
  claude: {
    binary: 'claude',
    modes: {
      default: [],
      danger: ['--dangerously-skip-permissions']
    },
    modelFlag: '--model',
    promptFlag: '--prompt',
    resumeFlag: '--resume',
    displayName: 'Claude Code',
    sessionPaths: [
      path.join(os.homedir(), '.claude', 'projects'),
      path.join(os.homedir(), '.config', 'claude', 'projects')
    ]
  },
  gemini: {
    binary: 'gemini',
    modes: {
      default: [],
      yolo: ['--sandbox=false']
    },
    modelFlag: '--model',
    promptFlag: '--prompt',
    resumeFlag: '--resume',
    displayName: 'Gemini CLI',
    sessionPaths: [
      path.join(os.homedir(), '.gemini', 'sessions'),
      path.join(os.homedir(), '.config', 'gemini', 'sessions')
    ]
  }
};

module.exports = { AI_TOOLS };
```

Update `launch.js` and `resume.js` to import from `tools.js`.

### Step 2: Implement list.js

Fill in the meta:

```javascript
const meta = {
  description: 'List available AI coding tools and their install status',
  arguments: [],
  flags: []
};
```

In the `run` function:

1. Loop through `AI_TOOLS`.
2. For each tool, check if the binary is installed using `context.shell.commandExists(tool.binary)`.
3. Read `~/.devutils/ai.json` to check if there's a configuration entry for the tool.
4. Build a result array:

```javascript
const results = Object.entries(AI_TOOLS).map(([name, tool]) => ({
  name: name,
  displayName: tool.displayName,
  binary: tool.binary,
  installed: context.shell.commandExists(tool.binary),
  configured: !!aiConfig[name],
  mode: aiConfig[name]?.mode || 'default',
  availableModes: Object.keys(tool.modes)
}));
```

5. Pass to `context.output.render()`.

For human-readable output:

```
AI Tools:
  claude    Claude Code      installed    mode: danger     (available: default, danger)
  gemini    Gemini CLI       not installed                  (available: default, yolo)
```

### Step 3: Implement sessions.js

Fill in the meta:

```javascript
const meta = {
  description: 'List recent sessions for an AI tool',
  arguments: [
    { name: 'tool', description: 'AI tool name (e.g., claude, gemini)', required: true }
  ],
  flags: [
    { name: 'limit', type: 'number', description: 'Maximum number of sessions to show (default: 10)' }
  ]
};
```

In the `run` function:

1. Validate the tool name.
2. Check the tool's session paths. Try each path in the `sessionPaths` array until one exists.
3. If no session directory is found, print "No session data found for <tool>. Sessions may be stored in a location DevUtils doesn't know about yet." and exit.
4. Read the session directory. The exact approach depends on the tool:

**For Claude Code:**
Claude stores session data in project-specific directories under `~/.claude/projects/`. Each project directory contains JSONL files. Scan for directories, and within each look for session files. Extract the session ID (typically the filename or a field in the JSONL) and the last-modified timestamp.

**For Gemini CLI:**
Gemini's session storage format is less documented. Scan for session files in the sessions directory and extract what you can.

5. Sort sessions by last-modified date, most recent first.
6. Apply the `--limit` flag (default 10).
7. Return an array of session objects:

```javascript
{
  id: 'abc-123-def',
  tool: 'claude',
  project: '/path/to/project',
  lastActive: '2026-03-08T12:00:00Z',
  resumeCommand: 'dev ai resume claude abc-123-def'
}
```

8. Pass to `context.output.render()`.

**Important**: This is inherently fragile because we're reading another tool's internal storage. Wrap everything in try/catch. If any session file is unreadable or has an unexpected format, skip it and move on. Never crash.

### Step 4: Implement show.js

Fill in the meta:

```javascript
const meta = {
  description: 'Show the current configuration for an AI tool',
  arguments: [
    { name: 'tool', description: 'AI tool name (e.g., claude, gemini)', required: true }
  ],
  flags: []
};
```

In the `run` function:

1. Validate the tool name.
2. Read `~/.devutils/ai.json`.
3. If no config exists for this tool, show the defaults:

```javascript
const config = aiConfig[toolName] || {
  mode: 'default',
  model: null,
  flags: []
};
```

4. Build the output object by merging the user config with tool metadata:

```javascript
{
  tool: toolName,
  displayName: toolConfig.displayName,
  binary: toolConfig.binary,
  installed: context.shell.commandExists(toolConfig.binary),
  mode: config.mode || 'default',
  model: config.model || '(not set)',
  flags: config.flags || [],
  availableModes: Object.keys(toolConfig.modes)
}
```

5. Pass to `context.output.render()`.

For human-readable output:

```
Claude Code Configuration:
  Binary:          claude
  Installed:       yes
  Mode:            danger
  Model:           (not set)
  Extra flags:     (none)
  Available modes: default, danger
```

### Step 5: Implement set.js

Fill in the meta:

```javascript
const meta = {
  description: 'Set a default configuration value for an AI tool',
  arguments: [
    { name: 'tool', description: 'AI tool name (e.g., claude, gemini)', required: true },
    { name: 'key', description: 'Configuration key to set (mode, model, flags)', required: true },
    { name: 'value', description: 'Value to set', required: true }
  ],
  flags: []
};
```

In the `run` function:

1. Validate the tool name.
2. Validate the key. Only allow known keys: `mode`, `model`, `flags`. If the key is unrecognized, print the list of valid keys and exit.
3. Validate the value based on the key:
   - **mode**: Must be one of the modes in `AI_TOOLS[tool].modes`. If invalid, list available modes.
   - **model**: Any string is fine. Set to `null` if the value is `"none"` or `"null"` (to clear it).
   - **flags**: Parse as a comma-separated list of flag strings. Store as an array.
4. Read the current `ai.json` (or start with an empty object).
5. Update the tool's config entry:

```javascript
const aiConfig = readAiConfig();
if (!aiConfig[toolName]) {
  aiConfig[toolName] = {};
}
aiConfig[toolName][key] = parsedValue;
fs.writeFileSync(AI_CONFIG_FILE, JSON.stringify(aiConfig, null, 2) + '\n');
```

6. Print confirmation: "Set <tool>.<key> = <value>".

### Step 6: Code style

- CommonJS modules
- 2-space indentation, LF line endings
- JSDoc comments on exported functions
- `'use strict';` at the top
- Use `context.shell.commandExists()` for binary detection
- JSON file writes use `JSON.stringify(data, null, 2) + '\n'`

## Files to Create or Modify
- `src/commands/ai/tools.js` — New file. Shared AI tool registry.
- `src/commands/ai/list.js` — Replace the stub with the list implementation.
- `src/commands/ai/sessions.js` — Replace the stub with the sessions implementation.
- `src/commands/ai/show.js` — Replace the stub with the show implementation.
- `src/commands/ai/set.js` — Replace the stub with the set implementation.
- `src/commands/ai/launch.js` — Update to import from `tools.js`.
- `src/commands/ai/resume.js` — Update to import from `tools.js`.

## Acceptance Criteria
- [ ] `dev ai list` shows all known AI tools with their install status and current mode
- [ ] `dev ai list` checks each tool's binary via `commandExists`
- [ ] `dev ai list` outputs structured JSON when `--format json` is used
- [ ] `dev ai sessions claude` lists recent sessions sorted by most recent first
- [ ] `dev ai sessions claude --limit 5` caps the output to 5 sessions
- [ ] `dev ai sessions claude` when no session data is found prints a helpful message instead of crashing
- [ ] `dev ai show claude` displays the current configuration (mode, model, flags)
- [ ] `dev ai show claude` when no config exists shows defaults
- [ ] `dev ai set claude mode danger` updates `~/.devutils/ai.json` with mode: 'danger'
- [ ] `dev ai set claude model sonnet` updates the model field
- [ ] `dev ai set claude flags "--verbose,--no-cache"` stores flags as an array
- [ ] `dev ai set claude model none` clears the model (sets to null)
- [ ] `dev ai set claude mode invalid` prints available modes and exits
- [ ] `dev ai set claude badkey value` prints valid keys and exits
- [ ] All four commands export `{ meta, run }`

## Testing

```bash
# List tools
dev ai list
# Expected: Shows claude and gemini with install status

dev ai list --format json
# Expected: JSON array with name, displayName, installed, mode, etc.

# Show config before setting anything
dev ai show claude
# Expected: Shows defaults (mode: default, model: not set, flags: none)

# Set configuration
dev ai set claude mode danger
# Expected: "Set claude.mode = danger"

dev ai set claude model sonnet
# Expected: "Set claude.model = sonnet"

# Verify the config was written
cat ~/.devutils/ai.json
# Expected: { "claude": { "mode": "danger", "model": "sonnet" } }

# Show config after setting
dev ai show claude
# Expected: mode: danger, model: sonnet

# Set invalid mode
dev ai set claude mode turbo
# Expected: "Unknown mode 'turbo' for Claude Code. Available modes: default, danger"

# Set invalid key
dev ai set claude theme dark
# Expected: "Unknown configuration key 'theme'. Valid keys: mode, model, flags"

# Clear model
dev ai set claude model none
# Expected: "Set claude.model = (cleared)"

# Sessions (depends on having used claude before)
dev ai sessions claude
# Expected: List of recent sessions with IDs, or "No session data found" if none

dev ai sessions claude --limit 3
# Expected: At most 3 sessions
```

## Notes
- The `sessions` command is the most fragile part of this story. Claude Code and Gemini CLI store their sessions in internal formats that can change between versions. The implementation should be defensive: wrap all file reads in try/catch, skip unparseable entries, and include a note in the output if any sessions were skipped due to format issues. If both tools completely change their storage format, the command should degrade to "No session data found" rather than crashing.
- For the `sessions` command, Claude Code stores project sessions under `~/.claude/projects/`. Inside each project directory (named by a hash of the project path), there are JSONL session files. The session ID is typically part of the filename. Read the directory listing, sort by file modification time, and extract IDs. Don't try to parse the full JSONL content unless you need to show extra details.
- The `flags` key in `set` is a special case because it stores an array while `mode` and `model` store strings. When parsing the flags value, split on commas and trim whitespace from each entry. Reject empty strings. Example: `"--verbose, --no-cache"` becomes `["--verbose", "--no-cache"]`.
- When `set` creates `ai.json` for the first time, write the full file. When updating, read the existing file, modify the specific tool's config, and write it back. This preserves config for other tools.
- The `show` command should display defaults even when `ai.json` doesn't exist or has no entry for the tool. Never print "no configuration found" — instead, show what the tool would use (which is the built-in defaults).
- Tool names are case-sensitive. `claude` works, `Claude` doesn't. If someone passes a name with wrong casing, the validation will catch it and show the list of valid names. Don't try to be clever with case-insensitive matching.
