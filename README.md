# DevUtils CLI

> **Early Development (v0.0.1)** — This project is currently a proof of concept. Core functionality is being built and tested. You're welcome to:
> - Use it as-is and provide feedback
> - Participate in development
> - Watch for future releases (v0.1.0 for beta, v1.0.0 for stable)
> - [Reach out](#contact) with questions or suggestions

Stop wasting hours setting up new machines. One command, any platform, ready to code.

## The Problem

Every developer knows the pain:
- New laptop? Spend a day installing tools and configuring dotfiles
- Switch between work and personal projects? Juggle SSH keys and git configs
- Help a teammate set up their environment? Walk them through 50 different steps
- Work on macOS at home, Linux in prod? Remember two sets of commands

## The Solution

```bash
npm install -g devutils-cli
dev setup
```

That's it. DevUtils CLI detects your operating system and installs everything you need. Your configuration travels with you.

## Installation

```bash
npm install -g devutils-cli
```

**Requirements:** Node.js 18+

## Quick Start

```bash
# Install essential tools (git, ssh, gpg, etc.)
dev setup

# Set up your developer profile
dev configure

# Install your favorite tools
dev install vscode
dev install docker
dev install node
```

## Key Features

### Cross-Platform Package Installation

Forget whether it's `brew install`, `apt-get install`, or `choco install`. Just run:

```bash
dev install docker
dev install node
dev install vscode
```

DevUtils CLI figures out the right command for macOS, Ubuntu, Debian, Amazon Linux, Fedora, or Windows.

### Git Identity Management

Manage multiple git identities for work, personal, and client projects:

```bash
# Create identities with SSH and GPG keys
dev identity add work --email you@company.com
dev identity add personal --email you@gmail.com

# Link identities to folders - commits automatically use the right credentials
dev identity link work ~/work
dev identity link personal ~/personal https://github.com/yourusername
```

Clone with any URL format. DevUtils CLI routes it through the correct SSH key automatically.

### Smart .gitignore Management

```bash
dev ignore node      # Add Node.js patterns
dev ignore macos     # Add .DS_Store and friends
dev ignore vscode    # Add .vscode/ patterns
```

Patterns are managed in sections—run it twice and it won't duplicate.

### Portable Configuration

Your `~/.devutils` file stores your preferences:

```json
{
  "user": {
    "name": "Jane Developer",
    "email": "jane@example.com"
  },
  "identities": {
    "work": { "email": "jane@company.com", "sshKey": "~/.ssh/id_ed25519_work" },
    "personal": { "email": "jane@gmail.com", "sshKey": "~/.ssh/id_ed25519_personal" }
  }
}
```

Copy this file to a new machine and run `dev identity sync` to regenerate all your SSH configs.

## Supported Platforms

| Platform | Package Manager |
|----------|-----------------|
| macOS | Homebrew |
| Ubuntu / Debian | APT |
| Raspberry Pi OS | APT |
| Amazon Linux / RHEL / Fedora | DNF / YUM |
| Windows | Chocolatey / winget |
| WSL | APT (with Windows integration) |

## Available Commands

| Command | Description |
|---------|-------------|
| `dev setup` | Install essential development tools |
| `dev configure` | Set up your developer profile |
| `dev install <tool>` | Install a tool (cross-platform) |
| `dev identity add` | Create a new git identity with keys |
| `dev identity link` | Link an identity to a folder or remote |
| `dev identity unlink` | Remove a folder link |
| `dev ignore <tech>` | Add .gitignore patterns |
| `dev status` | Show current configuration |

## Why DevUtils CLI?

- **Zero memorization** — Same commands on every platform
- **Identity isolation** — Never accidentally commit with the wrong email again
- **Reproducible setups** — New machine? `dev setup && dev identity sync`
- **No lock-in** — Standard tools, standard configs. Uninstall anytime

## Contributing

Contributions welcome! Feel free to open issues or submit pull requests.

## Contact

Questions, suggestions, or just want to chat about the project?

**Fred Lackey**
- Email: [fred.lackey@gmail.com](mailto:fred.lackey@gmail.com)
- Website: [fredlackey.com](https://fredlackey.com)
- GitHub: [@FredLackey](https://github.com/FredLackey)

## License

Apache-2.0
