# Story 001: AI Launch and Resume

## Goal
Build `dev ai launch` and `dev ai resume` so users can start and resume AI coding assistant sessions with their preferred defaults. Instead of remembering the right flags every time you open Claude Code or Gemini CLI, you configure your preferences once and `dev ai launch claude` does the right thing. `launch` reads the tool's configuration from `~/.devutils/ai.json`, builds the correct command with the right flags, and spawns it. `resume` takes a session ID and passes it to the AI tool's resume mechanism. Both commands check that the AI tool is actually installed before trying to run it. These two commands replace the old `claude-danger` script with something configurable and extensible to any AI coding tool.

## Prerequisites
- 001-foundation/008 (CLI router)
- 002-config/001 (config init, so `~/.devutils/` exists)

## Background
AI coding assistants like Claude Code and Gemini CLI are tools that developers launch from their terminal. Each has its own set of flags, modes, and session management. DevUtils wraps these tools to:

1. Store per-tool defaults so you don't retype flags every session.
2. Provide a consistent interface across different AI tools.
3. Make it easy to create aliases like `dev alias add claude-danger "dev ai launch claude"`.

The configuration lives in `~/.devutils/ai.json`. Here's what that file looks like:

```json
{
  "claude": {
    "binary": "claude",
    "mode": "danger",
    "model": null,
    "flags": [],
    "installed": true
  },
  "gemini": {
    "binary": "gemini",
    "mode": "default",
    "model": null,
    "flags": [],
    "installed": true
  }
}
```

The `mode` field maps to tool-specific behavior:
- **Claude Code**: `danger` mode adds `--dangerously-skip-permissions`. `default` mode adds nothing extra.
- **Gemini CLI**: `yolo` mode adds the equivalent permissive flag. `default` mode adds nothing extra.

The `flags` array holds additional default flags that are always passed to the tool (like `--verbose` or custom flags the user wants).

The `model` field, if set, passes the `--model` flag to the tool.

Reference: `research/proposed/proposed-command-syntax.md` lines 473-505 for the ai command syntax. `research/proposed/proposed-command-structure.md` lines 80-86 for the service overview.

## Technique

### Step 1: Define the tool registry

Create a constant object that maps tool names to their CLI specifics. This separates the tool knowledge from the command logic so adding a new AI tool is just adding an entry.

```javascript
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
    displayName: 'Claude Code'
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
    displayName: 'Gemini CLI'
  }
};
```

Keep this as a plain object in the command file for now. If more tools are added later and the object gets big, it can be moved to a shared file.

### Step 2: Fill in the meta for launch.js

```javascript
const meta = {
  description: 'Start an AI coding tool with configured defaults',
  arguments: [
    { name: 'tool', description: 'AI tool to launch (e.g., claude, gemini)', required: true }
  ],
  flags: [
    { name: 'mode', type: 'string', description: 'Override the launch mode (e.g., danger, yolo, default)' },
    { name: 'model', type: 'string', description: 'Override the model selection' },
    { name: 'prompt', type: 'string', description: 'Pass an initial prompt to the AI tool' }
  ]
};
```

### Step 3: Implement the launch run function

Follow this flow:

1. **Validate the tool name.** Check if it exists in `AI_TOOLS`. If not, list the available tools and exit.

```javascript
const toolConfig = AI_TOOLS[args.arguments.tool];
if (!toolConfig) {
  const available = Object.keys(AI_TOOLS).join(', ');
  context.output.print(`Unknown AI tool "${args.arguments.tool}". Available: ${available}`);
  return;
}
```

2. **Check that the tool is installed.** Use `context.shell.commandExists(toolConfig.binary)` to verify the binary is on PATH. If not, print a helpful message:

```javascript
const isInstalled = context.shell.commandExists(toolConfig.binary);
if (!isInstalled) {
  context.output.print(`${toolConfig.displayName} is not installed.`);
  context.output.print(`Install it and make sure "${toolConfig.binary}" is on your PATH.`);
  return;
}
```

3. **Read user configuration.** Load `~/.devutils/ai.json` and look for the tool's config. If the file doesn't exist or the tool has no entry, use defaults (mode: 'default', model: null, flags: []).

```javascript
const fs = require('fs');
const path = require('path');
const os = require('os');

const AI_CONFIG_FILE = path.join(os.homedir(), '.devutils', 'ai.json');

function readAiConfig() {
  try {
    return JSON.parse(fs.readFileSync(AI_CONFIG_FILE, 'utf8'));
  } catch (err) {
    return {};
  }
}

const aiConfig = readAiConfig();
const toolUserConfig = aiConfig[args.arguments.tool] || {};
```

4. **Build the command.** Start with the binary name and add flags based on configuration and command-line overrides.

```javascript
const parts = [toolConfig.binary];

// Determine mode: command-line flag overrides config, config overrides default
const mode = args.flags.mode || toolUserConfig.mode || 'default';
const modeFlags = toolConfig.modes[mode];
if (!modeFlags) {
  const available = Object.keys(toolConfig.modes).join(', ');
  context.output.print(`Unknown mode "${mode}" for ${toolConfig.displayName}. Available: ${available}`);
  return;
}
parts.push(...modeFlags);

// Model flag
const model = args.flags.model || toolUserConfig.model;
if (model) {
  parts.push(toolConfig.modelFlag, model);
}

// Prompt flag
if (args.flags.prompt) {
  parts.push(toolConfig.promptFlag, JSON.stringify(args.flags.prompt));
}

// User's default flags from config
if (toolUserConfig.flags && toolUserConfig.flags.length > 0) {
  parts.push(...toolUserConfig.flags);
}

// Pass through any remaining unrecognized flags from the command line
if (args.extra && args.extra.length > 0) {
  parts.push(...args.extra);
}

const command = parts.join(' ');
```

5. **Spawn the tool.** Use `context.shell.spawn()` (or `execSync` with `stdio: 'inherit'`) to run the command interactively. The AI tool needs full control of the terminal (stdin, stdout, stderr), so use `inherit` for all stdio streams.

```javascript
context.output.print(`Launching ${toolConfig.displayName}...`);
await context.shell.exec(command, { stdio: 'inherit' });
```

The key here is `stdio: 'inherit'`. This hands the terminal over to the AI tool. DevUtils gets out of the way and the user interacts directly with Claude or Gemini.

### Step 4: Fill in the meta for resume.js

```javascript
const meta = {
  description: 'Resume a previous AI coding session by ID',
  arguments: [
    { name: 'tool', description: 'AI tool to resume (e.g., claude, gemini)', required: true },
    { name: 'session', description: 'Session ID to resume', required: true }
  ],
  flags: []
};
```

### Step 5: Implement the resume run function

Resume is simpler than launch. It doesn't need mode or model — it just passes the session ID to the tool's resume flag.

1. Validate the tool name (same as launch).
2. Check the tool is installed (same as launch).
3. Build the command: `<binary> <resumeFlag> <sessionId>`.
4. Pass through any extra flags from the command line.
5. Spawn with `stdio: 'inherit'`.

```javascript
const toolConfig = AI_TOOLS[args.arguments.tool];
// ... validation and install check ...

const parts = [
  toolConfig.binary,
  toolConfig.resumeFlag,
  args.arguments.session
];

// Pass through extra flags
if (args.extra && args.extra.length > 0) {
  parts.push(...args.extra);
}

const command = parts.join(' ');
context.output.print(`Resuming ${toolConfig.displayName} session ${args.arguments.session}...`);
await context.shell.exec(command, { stdio: 'inherit' });
```

### Step 6: Code style

- CommonJS modules
- 2-space indentation, LF line endings
- JSDoc comments on exported functions
- `'use strict';` at the top
- Use `context.shell` for command execution and binary detection
- Never call `child_process` directly

## Files to Create or Modify
- `src/commands/ai/launch.js` — Replace the stub with the full launch implementation
- `src/commands/ai/resume.js` — Replace the stub with the full resume implementation

## Acceptance Criteria
- [ ] `dev ai launch claude` spawns the `claude` binary with flags from `~/.devutils/ai.json`
- [ ] `dev ai launch claude --mode danger` adds `--dangerously-skip-permissions` to the claude command
- [ ] `dev ai launch gemini --mode yolo` adds the permissive flag to the gemini command
- [ ] `dev ai launch claude --model sonnet` passes `--model sonnet` to claude
- [ ] `dev ai launch claude --prompt "Fix the bug in auth.js"` passes the prompt to claude
- [ ] `dev ai launch nonexistent` lists available tools
- [ ] `dev ai launch claude` when claude is not installed prints a clear install message
- [ ] Launch mode defaults come from `ai.json` and can be overridden by the `--mode` flag
- [ ] Extra flags from the command line are passed through to the AI tool
- [ ] `dev ai resume claude abc123` runs `claude --resume abc123`
- [ ] Both commands hand the terminal to the AI tool (stdio: inherit)
- [ ] Both commands export `{ meta, run }`

## Testing

```bash
# Check if claude is installed
which claude
# If installed, proceed with tests

# Launch with defaults (assumes ai.json doesn't exist yet - uses defaults)
dev ai launch claude
# Expected: Launches claude with no extra flags

# Launch with mode override
dev ai launch claude --mode danger
# Expected: Launches claude with --dangerously-skip-permissions

# Launch with model
dev ai launch claude --model sonnet
# Expected: Launches claude with --model sonnet

# Launch unknown tool
dev ai launch copilot
# Expected: "Unknown AI tool 'copilot'. Available: claude, gemini"

# Launch uninstalled tool (test with a fake name by temporarily modifying AI_TOOLS)
# Expected: "<tool> is not installed. Install it and make sure '<binary>' is on your PATH."

# Resume
dev ai resume claude some-session-id
# Expected: Launches claude --resume some-session-id

# Resume unknown tool
dev ai resume foobar abc123
# Expected: "Unknown AI tool 'foobar'. Available: claude, gemini"
```

## Notes
- The `stdio: 'inherit'` option is critical. Without it, the AI tool won't have access to the terminal and interactive features like prompts, color output, and keyboard shortcuts won't work. This is different from most DevUtils commands, which capture stdout and format it. AI tools need full terminal control.
- The `args.extra` array captures flags that the CLI router didn't recognize. This is the pass-through mechanism. If the user types `dev ai launch claude --verbose --some-claude-flag`, the `--verbose` might be consumed as a global flag, but `--some-claude-flag` passes through to claude.
- When the prompt flag value contains spaces or special characters, it needs to be properly quoted in the shell command. Using `JSON.stringify()` handles the quoting, but test this with prompts that contain quotes and newlines.
- The `mode` field in `ai.json` is optional. If it's not set and the user doesn't pass `--mode`, default to `'default'` which adds no extra flags. This means a bare `dev ai launch claude` is equivalent to just typing `claude` directly, until the user configures a preferred mode.
- Don't validate session IDs. They're opaque strings managed by the AI tool. Just pass them through.
- If `~/.devutils/ai.json` doesn't exist, that's fine. Use empty defaults. The file gets created by `dev ai set` (built in the next story). Don't create it in launch.
- The tool registry (`AI_TOOLS`) is hardcoded for now. If users want to add custom AI tools, that's a future enhancement. For this story, just support Claude Code and Gemini CLI.
