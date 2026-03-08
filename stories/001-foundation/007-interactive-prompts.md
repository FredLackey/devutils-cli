# Story 007: Interactive Prompts

## Goal
Build the interactive prompt module that commands use to ask the user questions during setup wizards, confirmations, and configuration flows. The key feature is that prompts are aware of who is calling. When a human is at a terminal, they see the prompt and type their answer. When an AI tool, CI pipeline, or piped script is calling, prompts skip the interaction entirely and return their default values. This lets the same command code work in both interactive and non-interactive contexts without `if/else` branches everywhere.

## Prerequisites
- Story 003: Output Detection (prompt.js uses `detectOutputMode()` to know if the caller is interactive)

## Background
DevUtils has several commands that need user input: `dev config init` asks for your name and email, `dev tools install` might ask for confirmation before installing something, and `dev identity add` needs SSH key details. In the legacy code, these prompts were scattered and didn't handle non-interactive environments at all -- if Claude Code ran `dev configure`, it would hang waiting for input that would never come.

This module uses Node.js's built-in `readline` module. No external prompt libraries. We keep it simple: ask a question, get a string back. The four prompt types cover everything DevUtils needs.

Reference: `research/proposed/proposed-package-structure.md` lines 407-408.

## Technique

### Step 1: Create the interactive check helper

Before showing any prompt, we need to know if the environment is interactive. Import `detectOutputMode` from `detect.js` and check the `caller` field.

```javascript
const { detectOutputMode } = require('./detect');

function isInteractive() {
  const { caller } = detectOutputMode();
  return caller === 'tty';
}
```

Only `'tty'` is interactive. AI tools (`'ai'`), CI systems (`'ci'`), and piped output (`'pipe'`) are all non-interactive.

### Step 2: Create a readline helper

Since all four prompt functions need readline, write a shared helper that opens a readline interface, asks one question, and closes it.

```javascript
const readline = require('readline');

function askReadline(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stderr  // Write prompts to stderr, not stdout
    });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}
```

**Important**: The `output` is `process.stderr`, not `process.stdout`. This is intentional. When someone pipes DevUtils output, like `dev config show | jq '.name'`, the prompt text would corrupt the JSON on stdout. Writing prompts to stderr keeps stdout clean for data while still showing the prompt in the terminal.

### Step 3: Implement `ask(question, defaultValue)`

Asks a free-text question. Returns the user's answer, or the default value in non-interactive mode.

```javascript
async function ask(question, defaultValue = '') {
  if (!isInteractive()) {
    return defaultValue;
  }

  const suffix = defaultValue ? ` (${defaultValue})` : '';
  const answer = await askReadline(`${question}${suffix}: `);
  return answer.trim() || defaultValue;
}
```

If the user just presses Enter without typing anything, return the default value. This is standard CLI behavior.

### Step 4: Implement `confirm(question, defaultValue)`

Asks a yes/no question. Returns `true` or `false`.

```javascript
async function confirm(question, defaultValue = false) {
  if (!isInteractive()) {
    return defaultValue;
  }

  const hint = defaultValue ? '(Y/n)' : '(y/N)';
  const answer = await askReadline(`${question} ${hint}: `);
  const trimmed = answer.trim().toLowerCase();

  if (trimmed === '') return defaultValue;
  return trimmed === 'y' || trimmed === 'yes';
}
```

The hint shows which option is the default: `(Y/n)` means yes is default, `(y/N)` means no is default. The capital letter is the default -- this is a long-standing CLI convention.

### Step 5: Implement `choose(question, choices)`

Presents a numbered list of choices and asks the user to pick one. Returns the selected choice string.

```javascript
async function choose(question, choices, defaultIndex = 0) {
  if (!isInteractive()) {
    return choices[defaultIndex] || choices[0];
  }

  // Display the choices
  process.stderr.write(`${question}\n`);
  for (let i = 0; i < choices.length; i++) {
    const marker = i === defaultIndex ? '>' : ' ';
    process.stderr.write(`  ${marker} ${i + 1}. ${choices[i]}\n`);
  }

  const answer = await askReadline(`Choice (1-${choices.length}) [${defaultIndex + 1}]: `);
  const trimmed = answer.trim();

  if (trimmed === '') return choices[defaultIndex];

  const index = parseInt(trimmed, 10) - 1;
  if (isNaN(index) || index < 0 || index >= choices.length) {
    // Invalid input, return default
    process.stderr.write(`Invalid choice. Using default: ${choices[defaultIndex]}\n`);
    return choices[defaultIndex];
  }

  return choices[index];
}
```

Display goes to stderr (same reason as the prompt text). The `>` marker shows which option is the default. Invalid input falls back to the default with a message, rather than re-prompting. This keeps the implementation simple and avoids infinite loops.

### Step 6: Implement `password(question)`

Asks for sensitive input (like a password or API key). The input is not echoed to the screen.

```javascript
async function password(question) {
  if (!isInteractive()) {
    return '';
  }

  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stderr,
      terminal: true
    });

    // Disable echo by intercepting the output
    const origWrite = rl.output.write.bind(rl.output);
    let muted = false;

    rl.output.write = function(chunk) {
      if (muted) return;  // Suppress the echo
      return origWrite(chunk);
    };

    rl.question(`${question}: `, (answer) => {
      muted = false;
      rl.output.write('\n');  // Add newline after hidden input
      rl.close();
      resolve(answer);
    });

    muted = true;
  });
}
```

This works by intercepting the output stream's write method and suppressing it while the user types. After they press Enter, we un-suppress and write a newline (since the Enter keypress wasn't echoed). This is a well-known technique for password input with Node.js's built-in readline.

In non-interactive mode, `password()` returns an empty string. If a command needs a password and it's running non-interactively, the command should check for the empty string and either fail with an error or look for the value in an environment variable.

### Step 7: Aliases

Some command stories reference these prompt functions by different names via the `context.prompt` object. Define aliases so both names work:

```javascript
const input = ask;      // context.prompt.input(question, opts) — alias for ask
const select = choose;  // context.prompt.select(question, choices) — alias for choose
```

`input` is an alias for `ask`. Command stories that call `context.prompt.input(question, opts)` are calling `ask` under the hood. `select` is an alias for `choose`. Command stories that call `context.prompt.select(question, choices)` are calling `choose` under the hood.

### Step 8: Exports

```javascript
module.exports = { ask, input, confirm, choose, select, password, isInteractive };
```

Export `isInteractive` too. Some commands might want to check interactivity without calling a prompt (e.g., to decide whether to show a progress spinner or a progress percentage). The `input` and `select` aliases are exported so that both naming conventions work.

## Files to Create or Modify
- `src/lib/prompt.js` - All prompt functions (`ask`, `input`, `confirm`, `choose`, `select`, `password`) and the `isInteractive` helper

## Acceptance Criteria
- [ ] `ask('Name?', 'Fred')` shows a prompt and returns the user's input in a terminal
- [ ] `ask('Name?', 'Fred')` returns `'Fred'` without prompting when called from AI/CI/pipe
- [ ] `ask()` returns the default value when the user presses Enter without typing
- [ ] `confirm('Continue?', true)` shows `(Y/n)` and returns a boolean
- [ ] `confirm('Continue?', false)` shows `(y/N)` and returns a boolean
- [ ] `confirm()` returns the default value without prompting in non-interactive mode
- [ ] `choose('Pick one', ['a', 'b', 'c'])` shows a numbered list and returns the selection
- [ ] `choose()` returns the default choice without prompting in non-interactive mode
- [ ] `choose()` handles invalid input gracefully (returns default, doesn't crash or loop)
- [ ] `input()` is an alias for `ask()` (same function)
- [ ] `select()` is an alias for `choose()` (same function)
- [ ] `password('API Key')` hides the user's input while typing
- [ ] `password()` returns an empty string in non-interactive mode
- [ ] `isInteractive()` returns `true` in a terminal, `false` in AI/CI/pipe contexts
- [ ] All prompt text goes to stderr, not stdout
- [ ] No external dependencies are added to package.json (uses Node.js built-in `readline`)

## Testing

Interactive tests must be run in a real terminal (not piped). Non-interactive tests use env vars.

```bash
# Test isInteractive in a terminal
node -e "const p = require('./src/lib/prompt'); console.log(p.isInteractive())"
# Expected: true

# Test isInteractive with AI env
CLAUDECODE=1 node -e "const p = require('./src/lib/prompt'); console.log(p.isInteractive())"
# Expected: false

# Test input alias (should be the same function as ask)
node -e "const p = require('./src/lib/prompt'); console.log(p.input === p.ask)"
# Expected: true

# Test select alias (should be the same function as choose)
node -e "const p = require('./src/lib/prompt'); console.log(p.select === p.choose)"
# Expected: true

# Test input (alias for ask) in non-interactive mode
CLAUDECODE=1 node -e "
  const p = require('./src/lib/prompt');
  p.input('Name?', 'Fred').then(v => console.log('Got:', v));
"
# Expected: Got: Fred  (no prompt shown)

# Test select (alias for choose) in non-interactive mode
CLAUDECODE=1 node -e "
  const p = require('./src/lib/prompt');
  p.select('Pick', ['apple', 'banana', 'cherry'], 1).then(v => console.log('Got:', v));
"
# Expected: Got: banana  (no prompt shown)

# Test ask in non-interactive mode (returns default)
CLAUDECODE=1 node -e "
  const p = require('./src/lib/prompt');
  p.ask('Name?', 'Fred').then(v => console.log('Got:', v));
"
# Expected: Got: Fred  (no prompt shown)

# Test confirm in non-interactive mode (returns default)
CLAUDECODE=1 node -e "
  const p = require('./src/lib/prompt');
  p.confirm('Continue?', true).then(v => console.log('Got:', v));
"
# Expected: Got: true  (no prompt shown)

CI=true node -e "
  const p = require('./src/lib/prompt');
  p.confirm('Continue?', false).then(v => console.log('Got:', v));
"
# Expected: Got: false  (no prompt shown)

# Test choose in non-interactive mode (returns default)
CLAUDECODE=1 node -e "
  const p = require('./src/lib/prompt');
  p.choose('Pick', ['apple', 'banana', 'cherry'], 1).then(v => console.log('Got:', v));
"
# Expected: Got: banana  (no prompt shown)

# Test password in non-interactive mode (returns empty string)
CLAUDECODE=1 node -e "
  const p = require('./src/lib/prompt');
  p.password('Secret').then(v => console.log('Got:', JSON.stringify(v)));
"
# Expected: Got: ""  (no prompt shown)

# Test that prompts go to stderr not stdout
# (pipe stdout to /dev/null -- if you still see the prompt, it's on stderr)
CLAUDECODE=1 node -e "
  const p = require('./src/lib/prompt');
  p.ask('Name?', 'test').then(v => { process.stdout.write(v); });
" > /dev/null
# Expected: nothing visible (the default 'test' goes to stdout which is /dev/null)

# Interactive tests (run manually in a terminal):
# node -e "const p = require('./src/lib/prompt'); p.ask('What is your name?', 'Fred').then(v => console.log('Got:', v))"
# → Type "Alice" and press Enter → Got: Alice
# → Just press Enter → Got: Fred

# node -e "const p = require('./src/lib/prompt'); p.confirm('Install node?', true).then(v => console.log('Got:', v))"
# → Type "y" and press Enter → Got: true
# → Type "n" and press Enter → Got: false
# → Just press Enter → Got: true

# node -e "const p = require('./src/lib/prompt'); p.choose('Pick a color', ['red', 'green', 'blue']).then(v => console.log('Got:', v))"
# → Type "2" and press Enter → Got: green
# → Just press Enter → Got: red (default is index 0)
# → Type "99" and press Enter → Got: red (invalid, falls back to default)
```

## Notes
- Prompts write to stderr, not stdout. This is critical for pipeline compatibility. If someone runs `dev config show --format json | jq '.name'`, prompt text on stdout would break the JSON parsing. Stderr is visible in the terminal but doesn't interfere with piped data.
- The `choose()` function does not re-prompt on invalid input. It shows a message and returns the default. This keeps the implementation simple and avoids edge cases like "what if the user keeps entering garbage forever." For a CLI tool, falling back to a sensible default is better than an infinite retry loop.
- The `password()` function uses a technique that intercepts readline's output write. This is a common approach in Node.js CLI tools. It works, but it's not bulletproof -- if the user presses Ctrl+C during password input, the terminal might be left in a weird state. The readline `close` event handles most cleanup, but be aware of this edge case.
- All four prompt functions are async (return Promises). Even `isInteractive()` is sync, but the prompt functions need to be async because readline is callback-based and we wrap it in Promises.
- Don't overthink the UI. These prompts are functional, not fancy. No colors, no animations, no fancy cursor movement. They work, they're readable, and they handle non-interactive environments. That's enough.
