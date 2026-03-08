# Story 003: Implement ignore list and ignore show Commands

## Goal
Implement `src/commands/ignore/list.js` and `src/commands/ignore/show.js` so users can discover what pattern technologies are available and inspect what's already in their `.gitignore`. `list` scans the `src/patterns/gitignore/` directory and returns the available technology names. `show` reads the current `.gitignore` and reports which DevUtils-managed sections are present, listing each section's technology name and how many pattern lines it contains. Together with `add` and `remove`, these two commands round out the ignore service.

## Prerequisites
- 005-ignore/002 (ignore add and remove -- establishes the marker format)

## Background
The `list` command answers "what can I add?" and the `show` command answers "what have I already added?" Both are read-only -- they don't modify any files.

`list` works by scanning the pattern files directory. Any `.txt` file in `src/patterns/gitignore/` is an available technology. The technology name is the filename without the `.txt` extension. This means adding a new technology to DevUtils is as simple as dropping a new `.txt` file in that directory -- no code changes needed. The `list` command picks it up automatically.

`show` works by scanning the target `.gitignore` for the section markers established in story 005-ignore/002. It looks for lines matching `# >>> devutils:<name>` and `# <<< devutils:<name>`, extracts the technology name from each pair, and counts the lines between them (excluding the markers themselves).

## Technique

### list.js

1. Open `src/commands/ignore/list.js`. Fill in the `meta` object:
   ```javascript
   const meta = {
     description: 'List available gitignore pattern technologies',
     arguments: [],
     flags: []
   };
   ```

2. At the top of the file, require what you need:
   ```javascript
   const path = require('path');
   const fs = require('fs');
   ```

3. Create a helper to resolve the patterns directory:
   ```javascript
   function getPatternsDir() {
     return path.resolve(__dirname, '../../patterns/gitignore');
   }
   ```

4. In the `run` function:

   **Step A: Read the patterns directory.**
   - Use `fs.readdirSync(getPatternsDir())` to get the file list.
   - Filter to only `.txt` files (in case any non-pattern files end up in there).
   - Map each filename to a technology name by stripping the `.txt` extension: `'node.txt'` becomes `'node'`.
   - Sort the names alphabetically.

   **Step B: Optionally read the first comment line from each file as a description.**
   - This is a nice touch but not required. If you do it, read the first line of each `.txt` file. If it starts with `# `, strip the `# ` prefix and use the rest as a description.
   - For example, `node.txt` starts with `# Node.js`, so the description would be `"Node.js"`.
   - The second comment line (e.g., `# Patterns for Node.js and JavaScript/TypeScript projects.`) could serve as a longer description if you want to show it.

   **Step C: Build the result.**
   - Structured result:
     ```javascript
     {
       technologies: [
         { name: 'claude-code', description: 'Claude Code' },
         { name: 'docker', description: 'Docker' },
         { name: 'linux', description: 'Linux' },
         { name: 'macos', description: 'macOS' },
         { name: 'node', description: 'Node.js' },
         { name: 'terraform', description: 'Terraform' },
         { name: 'vscode', description: 'Visual Studio Code' },
         { name: 'windows', description: 'Windows' }
       ],
       count: 8
     }
     ```

   **Step D: Format the output.**
   - Human-friendly output: a simple list, one technology per line:
     ```
     Available technologies:
       claude-code   Claude Code
       docker        Docker
       linux         Linux
       macos         macOS
       node          Node.js
       terraform     Terraform
       vscode        Visual Studio Code
       windows       Windows

     Use "dev ignore add <technology>" to add patterns to .gitignore.
     ```
   - JSON output: the structured result object from Step C.

5. Edge case: if the patterns directory is missing or empty (shouldn't happen in a normal install, but be defensive), return an empty list with a message suggesting the installation may be corrupted.

### show.js

1. Open `src/commands/ignore/show.js`. Fill in the `meta` object:
   ```javascript
   const meta = {
     description: 'Show managed gitignore sections in the current directory',
     arguments: [],
     flags: [
       { name: 'path', description: 'Target directory (defaults to current directory)', type: 'string', default: '.' }
     ]
   };
   ```

2. Import the marker constants from the shared file (if you created `markers.js` in story 005-ignore/002) or define them locally:
   ```javascript
   const { MARKER_START, MARKER_END } = require('./markers');
   ```
   If you didn't create a shared file, define them the same way:
   ```javascript
   const MARKER_START = (name) => `# >>> devutils:${name}`;
   const MARKER_END = (name) => `# <<< devutils:${name}`;
   ```

3. In the `run` function:

   **Step A: Resolve the `.gitignore` path.**
   - Use the `--path` flag (default `.`).
   - Resolve to absolute: `path.resolve(flagPath, '.gitignore')`.

   **Step B: Read the file.**
   - If it doesn't exist, report "No .gitignore found" and return an empty result. Not an error.

   **Step C: Parse managed sections.**
   - Split the content into lines.
   - Walk through the lines looking for start markers. A start marker is any line that matches the pattern `# >>> devutils:<name>`. Extract `<name>` from it.
   - For each start marker, find the corresponding end marker `# <<< devutils:<name>`.
   - Count the lines between the markers (not including the markers themselves). These are the pattern lines.
   - Collect each section as `{ technology: '<name>', lines: <count>, startLine: <lineNumber>, endLine: <lineNumber> }`.

   **Step D: Parse the start marker to extract the technology name.**
   - The marker format is `# >>> devutils:<name>`. To extract the name:
     ```javascript
     const prefix = '# >>> devutils:';
     if (line.trim().startsWith(prefix)) {
       const name = line.trim().slice(prefix.length);
       // ...
     }
     ```
   - Don't use a complex regex for this. Simple string operations are clearer.

   **Step E: Handle orphaned markers.**
   - If a start marker is found without a matching end marker, include it in the results but flag it: `{ technology: '<name>', lines: null, error: 'Missing end marker' }`.
   - Same if an end marker is found without a start marker: report it but don't crash.

   **Step F: Build the result.**
   - Structured result:
     ```javascript
     {
       path: '/path/to/.gitignore',
       sections: [
         { technology: 'node', lines: 25, startLine: 1, endLine: 27 },
         { technology: 'macos', lines: 12, startLine: 29, endLine: 42 }
       ],
       count: 2
     }
     ```

   **Step G: Format the output.**
   - Human-friendly:
     ```
     Managed sections in .gitignore:
       node      25 patterns  (lines 1-27)
       macos     12 patterns  (lines 29-42)

     2 managed sections.
     ```
   - If no managed sections are found: `"No DevUtils-managed sections found in .gitignore."`
   - JSON: the structured result from Step F.

4. Also report any unmanaged lines. Count lines that are outside any DevUtils section and are not blank or comments. Include this in the result as `unmanagedLines: <count>`. This gives the user a sense of how much of their `.gitignore` is manually maintained vs. DevUtils-managed. For human output, add a line like `"Plus 8 unmanaged lines."` at the end if the count is greater than zero.

## Files to Create or Modify
- `src/commands/ignore/list.js` (modify existing stub)
- `src/commands/ignore/show.js` (modify existing stub)

## Acceptance Criteria
- [ ] `dev ignore list` shows all available technology names from the patterns directory
- [ ] The list is sorted alphabetically
- [ ] Each technology shows a description derived from the pattern file's header comment
- [ ] `dev ignore list --format json` returns a structured JSON array with technology names and descriptions
- [ ] `dev ignore show` reports all DevUtils-managed sections in the current directory's `.gitignore`
- [ ] Each section shows the technology name and pattern line count
- [ ] `dev ignore show --path /some/dir` targets a different directory
- [ ] `dev ignore show` on a file with no managed sections reports "No DevUtils-managed sections found"
- [ ] `dev ignore show` on a nonexistent `.gitignore` reports "No .gitignore found" (not an error)
- [ ] `dev ignore show --format json` returns a structured result with sections array
- [ ] Orphaned markers (start without end, or end without start) are reported as warnings, not crashes
- [ ] Both commands export `{ meta, run }` with accurate meta objects

## Testing
```bash
# Setup: create a .gitignore with some managed sections
mkdir /tmp/test-ignore-show && cd /tmp/test-ignore-show
dev ignore add node
dev ignore add macos

# List available technologies
dev ignore list
# Expected: All 8 technologies listed alphabetically with descriptions
#   claude-code, docker, linux, macos, node, terraform, vscode, windows

# List as JSON
dev ignore list --format json
# Expected: { "technologies": [...], "count": 8 }

# Show managed sections
dev ignore show
# Expected:
#   node     25 patterns  (lines 1-27)
#   macos    12 patterns  (lines 29-42)
#   2 managed sections.

# Show as JSON
dev ignore show --format json
# Expected: { "path": "...", "sections": [...], "count": 2 }

# Show with --path flag
dev ignore show --path /tmp/test-ignore-show
# Expected: Same result as above

# Show on directory with no .gitignore
dev ignore show --path /tmp
# Expected: "No .gitignore found at /tmp"

# Add some manual lines, then check show
echo "# My custom patterns" >> .gitignore
echo "my-secret-file.txt" >> .gitignore
dev ignore show
# Expected: 2 managed sections + "Plus 2 unmanaged lines."

# Cleanup
rm -rf /tmp/test-ignore-show
```

## Notes
- The `list` command discovers technologies dynamically from the filesystem. If someone adds a new `.txt` file to `src/patterns/gitignore/`, it shows up in `list` immediately with no code changes. This is intentional -- it makes the pattern system extensible without touching JavaScript.
- The `show` command counts "pattern lines" as lines between the markers that are not blank and not comments. Or you could count all lines between markers (blank lines included). Either approach is defensible. Pick one and be consistent. The simpler approach (count all lines between markers) is probably fine -- it matches what the user sees in the file.
- The line numbers in the `show` output are 1-indexed (matching what you'd see in a text editor). Don't use 0-indexed line numbers.
- The `list` command doesn't need the `--path` flag because it's listing technologies from the installed package, not from the user's project. The `show` command does need `--path` because it's reading the user's `.gitignore`.
- Both commands are read-only. They never write files. This makes them safe to run at any time without side effects.
- If the patterns directory somehow contains a non-`.txt` file (like a `.DS_Store` from macOS), the `list` command should filter it out. Only `.txt` files are technologies.
