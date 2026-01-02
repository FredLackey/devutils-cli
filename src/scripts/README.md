# Scripts

This folder contains **Scripts** — standalone global utilities that replace shell aliases and functions from dotfiles.

## Purpose

Scripts are single-command utilities that can be invoked directly from the command line after installing the package globally. They provide cross-platform implementations of common shell aliases and functions.

## Examples

```bash
afk                    # Lock screen / sleep
clone <url>            # Clone repo and install dependencies
ll                     # Long directory listing
git-push               # Add, commit, and push in one command
docker-clean           # Remove all containers, images, volumes
```

## File Structure

Each script follows this pattern:

```javascript
#!/usr/bin/env node

/**
 * @fileoverview Brief description of the script.
 * @module scripts/script-name
 */

/**
 * Detailed description of what the script does.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function main(args) {
  // Implementation
}

module.exports = { main };

if (require.main === module) {
  main(process.argv.slice(2));
}
```

## Categories

### Git
`clone`, `git-clone`, `git-pup`, `git-push`, `git-backup`, `vpush`, `fetch-github-repos`

### Docker
`dp`, `docker-clean`

### Node/npm
`npmi`, `clean-dev`, `ncu-update-all`, `get-dependencies`, `install-dependencies-from`

### File Management
`mkd`, `ll`, `delete-files`, `refresh-files`, `get-folder`, `org-by-date`, `rm-safe`

### macOS
`afk`, `o`, `u`, `brewd`, `brewi`, `brewr`, `brews`, `brewu`, `empty-trash`

### Search
`h`, `s`

### Network
`ips`, `ccurl`, `local-ip`, `ports`

### Media
`get-tunes`, `get-video`, `get-channel`, `get-course`, `datauri`, `resize-image`

## Registration

Scripts are registered as global commands in `package.json`:

```json
{
  "bin": {
    "afk": "./src/scripts/afk.js",
    "clone": "./src/scripts/clone.js",
    "ll": "./src/scripts/ll.js"
  }
}
```

## Related

- **Commands** (`../commands/`) — Multi-word CLI operations (`dev configure`, etc.)
- **Utils** (`../utils/`) — Internal shared utilities

## Documentation

See [ai-docs/LOCAL_EXAMPLE_ENVIRONMENT.md](../../ai-docs/LOCAL_EXAMPLE_ENVIRONMENT.md) for the complete script reference.
