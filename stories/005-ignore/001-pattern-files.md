# Story 001: Populate Gitignore Pattern Files

## Goal
Fill the empty pattern files in `src/patterns/gitignore/` with real, curated gitignore patterns. These files are the data that powers `dev ignore add <technology>`. Right now they're empty `.txt` stubs. This story populates them with the patterns developers actually need, similar to what you'd find in the github/gitignore repo but tuned for DevUtils users. No JavaScript in this story -- it's all static text files.

## Prerequisites
- None. These are standalone data files with no code dependencies.

## Background
When a user runs `dev ignore add node`, DevUtils reads `src/patterns/gitignore/node.txt` and appends its contents to the project's `.gitignore`. The pattern files ship inside the npm package (the `src/` directory is included via `package.json`'s `files` array), so they're always available on the user's machine after install.

Each file covers one technology or platform. The patterns are well-established community conventions -- the same things you'd paste from gitignore.io or the github/gitignore repo. We're curating them so users get a clean, well-commented set of patterns without having to hunt them down.

The eight files to populate:
- `node.txt` -- Node.js / JavaScript projects
- `macos.txt` -- macOS system files
- `windows.txt` -- Windows system files
- `linux.txt` -- Linux system files
- `docker.txt` -- Docker projects
- `vscode.txt` -- Visual Studio Code
- `terraform.txt` -- Terraform / Infrastructure as Code
- `claude-code.txt` -- Claude Code and AI coding tool artifacts

## Technique

For each file below, replace the empty content with the patterns listed. Every file must start with a comment header that explains what it covers. Use `#` for comments (standard gitignore syntax). Group related patterns together with a blank line between groups. Keep comments brief but useful -- a junior developer should understand why each group is there.

### node.txt

```
# Node.js
# Patterns for Node.js and JavaScript/TypeScript projects.

# Dependencies
node_modules/

# Build output
dist/
build/
out/
.next/
.nuxt/

# Environment and secrets
.env
.env.*
!.env.example

# Package manager files
package-lock.json
yarn.lock
pnpm-lock.yaml
.yarn/
.pnp.*

# Debug and logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*
*.log

# Coverage and test output
coverage/
.nyc_output/
*.lcov

# TypeScript cache
*.tsbuildinfo

# Cache directories
.cache/
.parcel-cache/
.eslintcache

# Runtime data
pids/
*.pid
*.seed
*.pid.lock
```

### macos.txt

```
# macOS
# Patterns for macOS system and Finder metadata files.

# Finder metadata
.DS_Store
.AppleDouble
.LSOverride

# Thumbnail cache
._*

# Spotlight indexing
.Spotlight-V100

# Trash folder state
.Trashes

# Volume metadata
.VolumeIcon.icns
.com.apple.timemachine.donotpresent

# Finder directory metadata
.fseventsd
.apdisk

# macOS resource forks
Icon?
```

### windows.txt

```
# Windows
# Patterns for Windows system and Explorer metadata files.

# Thumbnail cache
Thumbs.db
Thumbs.db:encryptable
ehthumbs.db
ehthumbs_vista.db

# Folder config
desktop.ini
Desktop.ini

# Recycle Bin
$RECYCLE.BIN/

# Shortcut files
*.lnk

# Windows Installer files
*.cab
*.msi
*.msix
*.msm
*.msp
```

### linux.txt

```
# Linux
# Patterns for Linux system files and editor artifacts.

# Backup files
*~

# NFS temp files
.nfs*

# KDE directory preferences
.directory

# Swap files
*.swp
*.swo

# Trash directories
.Trash-*
```

### docker.txt

```
# Docker
# Patterns for Docker projects. These are files that should not be
# included in a Docker build context or committed to version control.

# Docker Compose override (local dev customization)
docker-compose.override.yml
docker-compose.override.yaml

# Docker environment files
.docker/
.dockerenv

# Local data volumes (often mounted for development)
data/
volumes/
```

### vscode.txt

```
# Visual Studio Code
# Patterns for VS Code workspace and user-level files.

# Workspace settings (user-specific)
.vscode/

# Workspace file
*.code-workspace

# VS Code local history
.history/

# VS Code extensions recommendation (optional -- remove this line
# if your team uses shared extension recommendations)
# .vscode/extensions.json
```

### terraform.txt

```
# Terraform
# Patterns for Terraform and OpenTofu infrastructure-as-code projects.

# Provider plugins and modules
.terraform/

# State files (contain secrets -- never commit these)
*.tfstate
*.tfstate.*

# Crash logs
crash.log
crash.*.log

# Variable files that may contain secrets
*.tfvars
*.tfvars.json
!*.tfvars.example

# Override files (local developer overrides)
override.tf
override.tf.json
*_override.tf
*_override.tf.json

# Plan files (binary, can contain secrets)
*.tfplan

# Lock file (commit this for consistent provider versions)
# .terraform.lock.hcl
```

### claude-code.txt

```
# Claude Code
# Patterns for Claude Code, Sidecar, and other AI coding tool artifacts.

# Claude Code local state
.claude/

# Sidecar local state (TUI task runner)
.sidecar/

# Sidecar todo tracking
.todos/

# AI session artifacts
.ai-sessions/

# Cursor AI
.cursorignore
.cursorindexingignore
.cursor/

# Aider
.aider*

# Codeium
.codeium/
```

### Implementation steps

1. Open each `.txt` file in `src/patterns/gitignore/`.
2. Replace the empty content with the patterns shown above.
3. Make sure each file ends with a newline (standard Unix convention).
4. Don't add any blank lines before the first `#` comment. The file should start on line 1 with the header comment.

### Things to get right

- Every pattern that includes a trailing `/` is a directory match. Don't mix up `node_modules` (matches a file or directory anywhere) with `node_modules/` (matches only directories). Use the trailing slash when you specifically mean directories.
- The `!` prefix negates a pattern. For example, `!.env.example` means "don't ignore `.env.example` even though we're ignoring `.env.*`". Negation patterns must come after the pattern they override.
- The `*` wildcard matches within a single path component. `**` matches across path components. Most of these patterns don't need `**` because they're meant to match at any depth by default (that's how gitignore works -- a pattern without a `/` matches anywhere in the tree).
- Patterns with a `/` in them (other than a trailing slash) are anchored to the directory containing the `.gitignore`. None of the patterns above should have embedded slashes except trailing ones.

## Files to Create or Modify
- `src/patterns/gitignore/node.txt`
- `src/patterns/gitignore/macos.txt`
- `src/patterns/gitignore/windows.txt`
- `src/patterns/gitignore/linux.txt`
- `src/patterns/gitignore/docker.txt`
- `src/patterns/gitignore/vscode.txt`
- `src/patterns/gitignore/terraform.txt`
- `src/patterns/gitignore/claude-code.txt`

## Acceptance Criteria
- [ ] All eight `.txt` files contain patterns (no empty files)
- [ ] Each file starts with a `#` comment header naming the technology
- [ ] Each file ends with a trailing newline
- [ ] No file contains JavaScript or executable code
- [ ] `node.txt` includes `node_modules/`, `.env`, `dist/`, `coverage/`, and common log patterns
- [ ] `macos.txt` includes `.DS_Store`, `._*`, `.Spotlight-V100`, and `.Trashes`
- [ ] `windows.txt` includes `Thumbs.db`, `desktop.ini`, and `$RECYCLE.BIN/`
- [ ] `linux.txt` includes `*~`, `.nfs*`, and `.Trash-*`
- [ ] `docker.txt` includes `docker-compose.override.yml` and `.docker/`
- [ ] `vscode.txt` includes `.vscode/` and `*.code-workspace`
- [ ] `terraform.txt` includes `.terraform/`, `*.tfstate`, and `*.tfvars`
- [ ] `claude-code.txt` includes `.claude/`, `.sidecar/`, and `.todos/`
- [ ] Negation patterns (`!`) appear after the patterns they override

## Testing
```bash
# Verify all files have content
wc -l src/patterns/gitignore/*.txt
# Expected: Each file has 10+ lines, no zeros

# Verify each file starts with a comment
head -1 src/patterns/gitignore/*.txt
# Expected: Each file starts with "# <Technology Name>"

# Spot check a pattern
grep "node_modules" src/patterns/gitignore/node.txt
# Expected: node_modules/

grep ".DS_Store" src/patterns/gitignore/macos.txt
# Expected: .DS_Store

grep ".terraform/" src/patterns/gitignore/terraform.txt
# Expected: .terraform/
```

## Notes
- These files are the most boring part of the ignore system, but they have to be right. A bad pattern can cause a user to accidentally commit secrets (`*.tfstate` contains infrastructure credentials) or lose work (ignoring the wrong directories).
- The `terraform.txt` file comments out `.terraform.lock.hcl` intentionally. The Terraform community recommends committing the lock file for reproducible builds, but some teams don't. The comment explains the choice so users can uncomment it if they want.
- The `node.txt` file includes `!.env.example` as a negation. This is a common convention -- you want a template `.env.example` in the repo showing what variables are needed, while keeping actual `.env` files out of version control.
- The `claude-code.txt` file is specific to this project's ecosystem. It covers Claude Code, Sidecar (the TUI tool from `External/marcus/sidecar`), and other AI coding tools. This list will grow as new tools emerge.
- When adding new pattern files in the future, just drop a new `.txt` file in `src/patterns/gitignore/`. The `dev ignore list` command (story 005-ignore/003) discovers them automatically by scanning the directory.
