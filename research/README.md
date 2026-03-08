# Research

Design documents and reference material for the DevUtils CLI rebuild (v0.0.19).

## proposed/

Architecture and design decisions for the new CLI. These documents define what
gets built and how it fits together.

| Document | Purpose |
|---|---|
| `proposed-command-structure.md` | Command hierarchy, service priority tiers, util/alias design, excluded items |
| `proposed-command-syntax.md` | Every command with full syntax (arguments, flags, descriptions), quick-reference command list |
| `proposed-package-structure.md` | Directory layout, module patterns, file naming, flow diagrams |
| `proposed-api-plugin-architecture.md` | How API wrappers ship as installable plugins instead of bundled code |
| `api-wrapper-architecture.md` | How individual API wrappers work internally (pagination, auth, error format) |
| `config-backup-sync.md` | Profile-based config backup and restore via private repo or secret gist |
| `cli-structure-reference.md` | Google Workspace CLI (gws) analysis used as the structural model |

## legacy/

Documentation of the v0.0.18 codebase that lives in `_rebuild/`. Reference material
for understanding what existed before and what's being carried forward.

| Document | Purpose |
|---|---|
| `previous-installers.md` | All 93 installers from v0.0.18, organized by category |
| `previous-commands-and-functions.md` | Commands, scripts, utility modules, ignore patterns, and config schema |
| `previous-bin-mappings.md` | All 84 global bin entries with collision risk analysis |
