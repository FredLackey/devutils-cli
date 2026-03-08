# DevUtils CLI

> **Rebuild in Progress (v0.0.19)** — This project is being restructured from the ground up. The previous version (v0.0.18) tried to do too much too fast. The new approach is config-driven, user-driven, and machine-aware. If you're looking for the old code, it's been preserved in the `_rebuild/` directory.

## What Happened

The original DevUtils CLI was built as a rigid, opinionated toolkit. It assumed a specific workflow, shipped dozens of global scripts, and tried to be everything to everyone out of the gate. After real-world usage and feedback, it became clear that this approach wouldn't hold up. It was too prescriptive, too fragile across environments, and too hard for users to adapt to their own needs.

## What's Changing

The new version takes a fundamentally different approach:

### Config-Based, Not Opinion-Based

Instead of shipping a fixed set of behaviors, DevUtils will be driven by user configuration. You tell it what matters to you, and it adapts.

### User Onboarding

The first run walks you through a lightweight onboarding process. It learns who you are, what tools you care about, and how your machine is set up. No assumptions.

### Machine-Aware Profiles

Configuration is scoped to the machine you're on. A laptop, a server, and a VM can each have their own rules without conflicting.

### Rule-Based Behavior

Users define rules for folders, tools, and workflows. DevUtils enforces those rules rather than imposing its own. For example:
- "This folder always uses this git identity"
- "This machine should have these tools installed"
- "Run these checks when I open a new terminal"

### Temporary Workspace

DevUtils sets up a managed workspace inside the user's home directory for staging, caching, and intermediate state. Nothing touches system-level paths unless you ask for it.

## Installation

```bash
npm install -g @fredlackey/devutils
```

> The CLI is published but actively being rebuilt. Expect breaking changes until v0.1.0.

## Previous Version

The v0.0.18 codebase (commands, scripts, installers, utilities) has been moved to `_rebuild/` and is preserved for reference. Useful patterns and utilities will be pulled forward into the new architecture as needed.

## Roadmap

- [ ] User onboarding flow
- [ ] Config file schema (`~/.devutils/config.json`)
- [ ] Machine profile detection and storage
- [ ] Rule engine for folder and tool behaviors
- [ ] Migrate useful scripts and installers from `_rebuild/`

## Contact

**Fred Lackey**
- Email: [fred.lackey@gmail.com](mailto:fred.lackey@gmail.com)  
- Website: [fredlackey.com](https://fredlackey.com)  
- GitHub: [@FredLackey](https://github.com/FredLackey)  

## License

Apache-2.0
