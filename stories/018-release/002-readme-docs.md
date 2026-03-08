# Story 002: Project README and Documentation

## Goal

Write the project README.md so that someone finding this package on npm or GitHub knows what it does, how to install it, and how to use it. Also update CLAUDE.md if anything in the architecture section no longer matches the final implementation. Good documentation is the difference between a tool people use and a tool people skip.

## Prerequisites

- 018-release/001 (end-to-end testing — confirms everything works before documenting it)

## Background

The current README.md is either missing or minimal. The package is about to be published to npm as `@fredlackey/devutils`. People will see the README on the npm package page and on the GitHub repo. It needs to answer three questions fast: (1) what is this, (2) how do I install it, (3) how do I use it.

The command list from `research/proposed/proposed-command-syntax.md` is the source of truth for what commands exist.

## Technique

### Step 1: Write the README structure

The README should have these sections in this order:

1. **Title and one-line description** — `@fredlackey/devutils` — A config-driven CLI toolkit for bootstrapping and managing development environments.

2. **Install** — `npm install -g @fredlackey/devutils` then `dev config init`.

3. **Quick Start** — 5-6 commands that show the core workflow:
   - `dev config init` — first-run setup
   - `dev machine detect` — see what the CLI knows about this machine
   - `dev tools install node` — install a tool
   - `dev ignore add node` — add gitignore patterns
   - `dev identity add work --email you@company.com` — set up a git identity
   - `dev status` — see the overall state

4. **Command Reference** — The full command list (copy from proposed-command-syntax.md's Command List section). This is the quick-scan section. Don't repeat the full syntax here — link to the detailed docs for that.

5. **Services** — One paragraph per service explaining what it does:
   - config, machine, identity, tools, ignore, util, alias, auth, ai, search, api

6. **API Plugins** — Brief explanation of the plugin system. How to install a plugin (`dev api enable gmail`), how to list available plugins, link to the plugin architecture doc.

7. **Supported Platforms** — Table showing macOS, Ubuntu, Raspberry Pi OS, Amazon Linux, Windows, Git Bash with their package managers.

8. **Configuration** — Where config lives (`~/.devutils/`), how backup works (one paragraph), link to config-backup-sync.md for details.

9. **For AI Agents** — Brief section explaining that the CLI auto-detects AI tool environments and returns JSON. Mention `dev schema` for command introspection.

10. **License** — Apache-2.0.

### Step 2: Keep it scannable

Use short paragraphs, code blocks for commands, and tables where they help. A developer should be able to skim the whole README in 2 minutes and know if this tool is for them.

### Step 3: Don't over-document

The README is not a manual. Link to the research/proposed docs for deep dives. The goal is to get someone from "what is this" to "I installed it and ran my first command" in under 5 minutes.

### Step 4: Review CLAUDE.md

Read through the project CLAUDE.md and check that the Architecture section, Project Structure, and Code Patterns still match the actual implementation. Update anything that's stale. For example:
- The terminology table should still be accurate
- The project structure tree should match the real directory layout
- Code patterns should reflect any changes made during implementation

### Step 5: Add .npmignore or verify files field

Make sure the `files` field in package.json only includes `src/`. Verify that `research/`, `stories/`, `_rebuild/`, `test/`, and `.vscode/` are NOT included in the published package.

## Files to Create or Modify

- `README.md` — Full project README (create or overwrite)
- `CLAUDE.md` — Review and update architecture section if needed
- `package.json` — Verify `files` field is correct

## Acceptance Criteria

- [ ] README.md exists at the project root
- [ ] README has install instructions that work (`npm install -g @fredlackey/devutils`)
- [ ] README has a quick start section with runnable commands
- [ ] README has the full command list
- [ ] README explains the API plugin system
- [ ] README lists all supported platforms
- [ ] CLAUDE.md architecture section matches the real project structure
- [ ] `npm pack` produces a tarball that does NOT include research/, stories/, or test/

## Testing

```bash
# Verify the package contents
npm pack --dry-run

# Expected: only src/ files and package.json, README.md, CLAUDE.md, LICENSE

# Verify README renders correctly (if you have a markdown previewer)
# Or just read through it and make sure all code blocks are valid
# and all referenced commands exist
```

## Notes

- Don't use emojis in the README unless the user asks for them.
- Keep the tone professional but conversational. Write like you're explaining it to a smart friend, not writing a press release.
- The command list will be long (59 core commands). That's fine — it's a reference section. People will Ctrl+F through it.
- Make sure every example command in the README actually works. Don't show commands that haven't been implemented.
- If linking to research docs, use relative paths so they work both on GitHub and locally.
