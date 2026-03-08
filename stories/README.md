# User Stories

Implementation stories for building DevUtils CLI v1.0. Each group builds on the previous one. A developer should work through these sequentially from 001 to 018.

## Story Groups

| Group | Feature | Stories | Description |
|---|---|---|---|
| 001-foundation | Core Framework | 8 | Platform detection, shell utilities, output formatting, error handling, config manager, prompts, CLI router |
| 002-config | Config Service | 3 | Onboarding wizard, show/get, set/reset |
| 003-machine | Machine Profiles | 2 | Detect/show, set/list |
| 004-core-commands | Top-Level Commands | 2 | version/help, status |
| 005-ignore | Gitignore Patterns | 3 | Pattern files, add/remove, list/show |
| 006-tools | Tool Installation | 5 | Installer framework, commands, git/node/homebrew installers |
| 007-identity | Git Identities | 3 | Add/remove, list/show, link/unlink/sync |
| 008-util | Utility Functions | 5 | Framework, add/remove, git-status, clone, git-push |
| 009-alias | Shorthand Commands | 2 | Add/remove, list/sync |
| 010-config-backup | Backup and Sync | 2 | GitHub helpers, export/import |
| 011-auth | Authentication | 2 | Login/logout, list/status/refresh |
| 012-api-system | Plugin Framework | 2 | Plugin loader, list/enable/disable/update |
| 013-ai | AI Launcher | 2 | Launch/resume, config commands |
| 014-search | QMD Search | 2 | QMD check + collections/status, query/keyword/semantic/get/index |
| 015-schema | Introspection | 1 | dev schema command |
| 016-self-update | CLI Updates | 1 | dev update command |
| 017-api-plugins | API Plugins | 11 | Plugin template + 10 service plugins (separate repos) |
| 018-release | Release | 3 | End-to-end tests, README, npm publish |
| | **Total** | **59** | |

## Story Format

Each story includes: Goal, Prerequisites, Background, Technique, Files to Create or Modify, Acceptance Criteria, Testing, and Notes.

## Dependency Flow

```
001-foundation (core lib modules)
  ├── 002-config (config service)
  │     └── 010-config-backup (export/import)
  ├── 003-machine (machine profiles)
  ├── 004-core-commands (version, help, status)
  ├── 005-ignore (gitignore patterns)
  ├── 006-tools (installer framework + installers)
  ├── 007-identity (git identities + SSH)
  ├── 008-util (utility functions)
  ├── 009-alias (shorthand wrapper scripts)
  ├── 011-auth (OAuth + credentials)
  │     └── 012-api-system (plugin loader + commands)
  │           └── 017-api-plugins (individual plugins)
  ├── 013-ai (AI tool launcher)
  ├── 014-search (QMD integration)
  ├── 015-schema (command introspection)
  └── 016-self-update (npm update)

018-release (tests, docs, publish) -- depends on everything above
```
