# Commands

This folder contains the implementation logic for **Commands** — multi-word CLI operations invoked with the `dev` prefix.

## Structure

```
dev <action> [subcommand] [arguments] [options]
```

## Examples

```bash
dev configure              # Configure developer profile
dev status                 # Show current configuration
dev install vscode         # Install VS Code
dev ignore node            # Add Node.js patterns to .gitignore
dev identity add           # Add a new identity profile
dev identity remove        # Remove an identity profile
dev identity link          # Link identity to a source folder
```

## Files

| File | Command | Description |
|------|---------|-------------|
| `configure.js` | `dev configure` | Interactive configuration wizard |
| `status.js` | `dev status` | Display current configuration |
| `install.js` | `dev install <name>` | Install development tools |
| `ignore.js` | `dev ignore <technology>` | Append patterns to .gitignore |
| `identity.js` | `dev identity <action>` | Manage identity profiles (add, remove, link) |

## Related

- **Scripts** (`../scripts/`) — Standalone global utilities (e.g., `afk`, `clone`)
- **Installs** (`../installs/`) — Platform-specific installation logic
- **Utils** (`../utils/`) — Internal shared utilities

## Documentation

See [docs/COMMANDS.md](../../docs/COMMANDS.md) for the complete command specification.
