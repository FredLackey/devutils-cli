# Proposed Command Syntax

Exhaustive list of every command in the DevUtils CLI with its full syntax definition.

**Conventions used in this document:**

- `<required>` — argument must be provided
- `[optional]` — argument may be omitted
- `[flags]` — one or more optional flags
- `...` — accepts multiple values

---

## Global Flags

These flags are available on every command.

```
--format <json|table|yaml|csv>        Output format override
--dry-run                             Show what would happen without doing it
--verbose                             Increase output detail
--quiet                               Suppress non-essential output
--json <data>                         Pass structured input as a JSON string
--help                                Show help for the current command
```

---

## Command List

```
dev config init                            : Onboarding wizard
dev config show                            : Display configuration
dev config get                             : Read a config value
dev config set                             : Write a config value
dev config reset                           : Reset to defaults
dev config export                          : Push config to backup
dev config import                          : Pull config from backup

dev machine detect                         : Detect OS and capabilities
dev machine show                           : Display machine profile
dev machine set                            : Set a machine value
dev machine list                           : List known machines

dev identity add                           : Create identity profile
dev identity remove                        : Remove identity profile
dev identity list                          : List all identities
dev identity show                          : Show identity details
dev identity link                          : Bind identity to folder
dev identity unlink                        : Unbind identity from folder
dev identity sync                          : Regenerate SSH/git configs

dev tools install                          : Install a tool
dev tools check                            : Check if installed
dev tools list                             : List tools
dev tools search                           : Search tool registry

dev ignore add                             : Add gitignore patterns
dev ignore remove                          : Remove gitignore patterns
dev ignore list                            : List available patterns
dev ignore show                            : Show managed sections

dev util run                               : Execute a utility
dev util list                              : List utilities
dev util show                              : Show utility details
dev util add                               : Register custom utility
dev util remove                            : Unregister a utility

dev alias add                              : Create global shorthand
dev alias remove                           : Remove a shorthand
dev alias list                             : List all aliases
dev alias sync                             : Rebuild alias symlinks

dev auth login                             : Authenticate with service
dev auth logout                            : Revoke credentials
dev auth list                              : List connected services
dev auth status                            : Show auth state
dev auth refresh                           : Force token refresh

dev ai launch                              : Start AI tool
dev ai resume                              : Resume AI session
dev ai list                                : List AI tools
dev ai sessions                            : List recent sessions
dev ai show                                : Show AI tool config
dev ai set                                 : Set AI tool defaults

dev search query                           : Hybrid search (best quality)
dev search keyword                         : Fast BM25 keyword search
dev search semantic                        : Vector similarity search
dev search get                             : Retrieve a document
dev search collections add                 : Register a collection
dev search collections remove              : Remove a collection
dev search collections list                : List all collections
dev search index                           : Rebuild or update the index
dev search status                          : Show index health

dev api list                               : List API plugins
dev api enable                             : Install an API plugin
dev api disable                            : Remove an API plugin
dev api update                             : Update an API plugin

dev api gmail messages list                : List messages
dev api gmail messages get                 : Get a message
dev api gmail messages send                : Send a message
dev api gmail messages search              : Search messages
dev api gmail messages trash               : Trash a message
dev api gmail messages delete              : Delete a message
dev api gmail labels list                  : List labels
dev api gmail labels get                   : Get label details
dev api gmail drafts list                  : List drafts
dev api gmail drafts create                : Create a draft
dev api gmail drafts update                : Update a draft
dev api gmail drafts send                  : Send a draft
dev api gmail threads list                 : List threads
dev api gmail threads get                  : Get a thread
dev api gmail threads trash                : Trash a thread

dev api drive files list                   : List files
dev api drive files get                    : Get file metadata
dev api drive files upload                 : Upload a file
dev api drive files download               : Download a file
dev api drive files search                 : Search files
dev api drive files move                   : Move a file
dev api drive files delete                 : Delete a file
dev api drive folders list                 : List folders
dev api drive folders create               : Create a folder
dev api drive folders delete               : Delete a folder
dev api drive permissions list             : List permissions
dev api drive permissions add              : Add a permission
dev api drive permissions remove           : Remove a permission

dev api sheets spreadsheets list           : List spreadsheets
dev api sheets spreadsheets get            : Get spreadsheet info
dev api sheets spreadsheets create         : Create a spreadsheet
dev api sheets values get                  : Get cell values
dev api sheets values set                  : Set cell values
dev api sheets values append               : Append rows
dev api sheets values clear                : Clear cell values
dev api sheets sheets list                 : List sheets (tabs)
dev api sheets sheets add                  : Add a sheet
dev api sheets sheets remove               : Remove a sheet

dev api docs documents list                : List documents
dev api docs documents get                 : Get document content
dev api docs documents create              : Create a document
dev api docs documents export              : Export a document

dev api aws compute list                   : List EC2 instances
dev api aws compute get                    : Get instance details
dev api aws compute start                  : Start an instance
dev api aws compute stop                   : Stop an instance
dev api aws compute status                 : Get instance status
dev api aws storage buckets list           : List S3 buckets
dev api aws storage objects list           : List S3 objects
dev api aws storage objects upload         : Upload to S3
dev api aws storage objects download       : Download from S3
dev api aws functions list                 : List Lambda functions
dev api aws functions invoke               : Invoke a function
dev api aws functions logs                 : Get function logs
dev api aws groups list                    : List resource groups
dev api aws groups status                  : Get group status
dev api aws groups start                   : Start group resources
dev api aws groups stop                    : Stop group resources

dev api cloudflare zones list              : List zones
dev api cloudflare zones get               : Get zone details
dev api cloudflare zones create            : Create a zone
dev api cloudflare dns list                : List DNS records
dev api cloudflare dns get                 : Get DNS record
dev api cloudflare dns create              : Create DNS record
dev api cloudflare dns update              : Update DNS record
dev api cloudflare dns delete              : Delete DNS record
dev api cloudflare tokens list             : List API tokens
dev api cloudflare tokens verify           : Verify a token

dev api dokploy applications list          : List applications
dev api dokploy applications get           : Get application details
dev api dokploy applications create        : Create an application
dev api dokploy applications start         : Start an application
dev api dokploy applications stop          : Stop an application
dev api dokploy applications delete        : Delete an application
dev api dokploy projects list              : List projects
dev api dokploy projects get               : Get project details
dev api dokploy projects create            : Create a project
dev api dokploy domains list               : List domains
dev api dokploy domains add                : Add a domain
dev api dokploy domains remove             : Remove a domain
dev api dokploy servers list               : List servers
dev api dokploy servers get                : Get server details

dev api namecheap domains list             : List domains
dev api namecheap domains get              : Get domain details
dev api namecheap domains check            : Check domain availability
dev api namecheap dns list                 : List DNS records
dev api namecheap dns set                  : Set DNS records
dev api namecheap dns delete               : Delete DNS records
dev api namecheap ssl list                 : List SSL certificates
dev api namecheap ssl get                  : Get SSL certificate

dev api flowroute sms send                 : Send an SMS
dev api flowroute sms list                 : List SMS messages
dev api flowroute mms send                 : Send an MMS
dev api flowroute mms list                 : List MMS messages
dev api flowroute numbers list             : List phone numbers
dev api flowroute numbers get              : Get number details

dev api mailu users list                   : List email users
dev api mailu users get                    : Get user details
dev api mailu users create                 : Create a user
dev api mailu users delete                 : Delete a user
dev api mailu aliases list                 : List email aliases
dev api mailu aliases create               : Create an alias
dev api mailu aliases delete               : Delete an alias
dev api mailu domains list                 : List email domains
dev api mailu domains add                  : Add a domain

dev status                                 : Overall health check
dev update                                 : Self-update CLI
dev version                                : Show version
dev schema                                 : Introspect a command
dev help                                   : Show usage info
```

---

## config

```
dev config init [--force] [--profile <name>]
```
First-run onboarding wizard. Walks through user info, backup storage, and profile setup.
`--force` re-runs even if already configured. `--profile` sets the profile name.

```
dev config show [--profile <name>]
```
Display the current configuration. `--profile` shows a specific profile instead of
the active one.

```
dev config get <key>
```
Read a specific config value by dot-notation key (e.g., `user.email`, `defaults.license`).

```
dev config set <key> <value>
```
Write a specific config value. For structured values, use the global `--json` flag instead
of positional `<value>`.

```
dev config reset [--confirm]
```
Reset configuration to defaults. Prompts for confirmation unless `--confirm` is passed.

```
dev config export [--file <path>] [--profile <name>]
```
Push the active profile to the remote backup (repo or gist). If `--file` is provided,
exports to a local file instead. `--profile` exports a specific profile.

```
dev config import [--file <path>] [--profile <name>]
```
Pull configuration from the remote backup. If `--file` is provided, imports from a local
file instead. `--profile` selects which remote profile to import.

---

## machine

```
dev machine detect
```
Detect the current machine's OS, architecture, package managers, and capabilities.

```
dev machine show
```
Display the current machine profile.

```
dev machine set <key> <value>
```
Set a value in the machine profile.

```
dev machine list
```
List all known machine profiles from the backup storage.

---

## identity

```
dev identity add <name> --email <email> [--ssh-key <path>] [--gpg-key <id>]
```
Create a new identity profile. `--email` is required. SSH and GPG keys are optional
and can be generated or linked.

```
dev identity remove <name> [--confirm]
```
Remove an identity profile. Prompts for confirmation unless `--confirm` is passed.

```
dev identity list
```
List all configured identities.

```
dev identity show <name>
```
Show full details of one identity including email, keys, and linked folders.

```
dev identity link <name> <folder> [--remote <url>]
```
Bind an identity to a folder path. Optionally associate a remote URL.
Commits in that folder will use this identity automatically.

```
dev identity unlink <folder>
```
Remove an identity binding from a folder.

```
dev identity sync
```
Regenerate SSH configs and git configs from all identity definitions.

---

## tools

```
dev tools install <name> [--force]
```
Install a tool by name. Resolves and installs dependencies automatically. `--force`
reinstalls even if already present.

```
dev tools check <name>
```
Check if a specific tool is installed and report its version.

```
dev tools list [--installed] [--available] [--platform <name>]
```
List tools. `--installed` shows only what's on this machine. `--available` shows all
tools in the registry. `--platform` filters by a specific platform.

```
dev tools search <query>
```
Search the tool registry by name or keyword.

---

## ignore

```
dev ignore add <technology> [--path <folder>]
```
Append patterns for a technology to `.gitignore`. Defaults to the current directory.
`--path` targets a different folder.

```
dev ignore remove <technology> [--path <folder>]
```
Remove a managed pattern section from `.gitignore`.

```
dev ignore list
```
List all available technology pattern files.

```
dev ignore show [--path <folder>]
```
Show the managed sections currently in `.gitignore`.

---

## util

```
dev util run <name> [args...]
```
Execute a utility by name. Any additional arguments are passed through to the utility.

```
dev util list [--built-in] [--custom]
```
List available utilities. `--built-in` shows only packaged utilities. `--custom` shows
only user-added ones.

```
dev util show <name>
```
Show details, description, supported platforms, and accepted arguments for a utility.

```
dev util add <name> <path>
```
Register a custom utility. `<path>` is the path to the utility script or directory.

```
dev util remove <name>
```
Unregister a custom utility.

---

## alias

```
dev alias add <name> <command>
```
Create a global shorthand. `<name>` is the command name to create in PATH.
`<command>` is the full `dev` command it maps to (quoted).

```
dev alias remove <name>
```
Remove a shorthand and delete its symlink.

```
dev alias list
```
List all registered aliases and what they map to.

```
dev alias sync
```
Rebuild all alias symlinks from config. Used after importing config on a new machine.

---

## auth

```
dev auth login <service> [--scopes <scope,...>]
```
Authenticate with an external service. Opens the browser for OAuth. `--scopes` limits
the requested permissions.

```
dev auth logout <service>
```
Revoke and remove stored credentials for a service.

```
dev auth list
```
List all connected services and their token status (valid, expired, missing).

```
dev auth status <service>
```
Show detailed auth state for one service including scopes, expiry, and account info.

```
dev auth refresh <service>
```
Force a token refresh for a service without re-authenticating.

---

## ai

```
dev ai launch <tool> [--mode <mode>] [--model <model>] [--prompt <text>] [flags...]
```
Start an AI coding tool with configured defaults. `--mode` overrides the stored mode
(e.g., `danger`, `yolo`). `--model` overrides the model selection. `--prompt` passes
an initial prompt. Additional flags are passed through to the underlying tool.

```
dev ai resume <tool> <session-id>
```
Resume a previous session by its ID.

```
dev ai list
```
List all available and configured AI tools.

```
dev ai sessions <tool> [--limit <n>]
```
List recent sessions for a specific tool. `--limit` caps the number returned.

```
dev ai show <tool>
```
Show the current configuration for a tool (mode, model, flags, etc.).

```
dev ai set <tool> <key> <value>
```
Set a default launch configuration value for a tool. For structured values, use the
global `--json` flag.

---

## search

*Requires QMD installed separately (`bun install -g @tobilu/qmd`). If QMD is not
found on the system, all `dev search` commands return an error with installation
instructions.*

```
dev search query <query> [--collection <name>] [--limit <n>] [--min-score <score>]
```
Hybrid search combining BM25 keyword matching, vector similarity, and LLM re-ranking.
Highest quality results but slowest. `--collection` restricts to one collection.
`--min-score` filters by relevance (0.0–1.0).

```
dev search keyword <query> [--collection <name>] [--limit <n>]
```
Fast BM25 full-text keyword search. No model loading required. Best for exact lookups.

```
dev search semantic <query> [--collection <name>] [--limit <n>]
```
Vector cosine similarity search. Requires embeddings to be generated first
(via `dev search index`). Finds conceptually similar content even without exact
keyword matches.

```
dev search get <path-or-id> [--full] [--line <n>] [--max-lines <n>]
```
Retrieve a document by file path or document ID (e.g., `#abc123`). `--full` returns
the entire document instead of a snippet. `--line` and `--max-lines` return a specific
range.

```
dev search collections add <path> --name <name> [--mask <glob>]
```
Register a directory as a searchable collection. `--mask` limits which files are
indexed (e.g., `"**/*.md"`).

```
dev search collections remove <name> [--confirm]
```
Remove a collection from the index.

```
dev search collections list
```
List all registered collections.

```
dev search index [--force]
```
Update the search index. Re-indexes new or changed documents and generates
embeddings for vector search. `--force` re-indexes everything from scratch.

```
dev search status
```
Show index health, collection count, document count, and embedding status.

---

## api (plugin management)

```
dev api list [--installed] [--available]
```
List API plugins. Shows installed plugins with versions and available plugins from the
registry. `--installed` shows only what's on this machine. `--available` shows all
known plugins.

```
dev api enable <name> [--source <npm|git>] [--url <package-or-url>]
```
Install an API plugin. Resolves the short name to `@fredlackey/devutils-api-<name>` on
npm by default. `--source git` with `--url` installs from a git repo instead. The plugin
is installed into `~/.devutils/plugins/` and registered in `plugins.json`.

```
dev api disable <name> [--confirm]
```
Remove an installed API plugin. Deletes the package from `~/.devutils/plugins/` and
removes the entry from `plugins.json`.

```
dev api update <name>
```
Update an installed plugin to the latest version from its original source.

---

## api gmail

*Plugin: `@fredlackey/devutils-api-gmail`*

```
dev api gmail messages list [--limit <n>] [--label <name>] [--query <query>]
```
List messages. `--limit` caps results. `--label` filters by label. `--query` uses
Gmail search syntax.

```
dev api gmail messages get <id>
```
Get a single message by ID.

```
dev api gmail messages send --to <address> --subject <text> --body <text> [--cc <address>] [--bcc <address>]
```
Send a message.

```
dev api gmail messages search <query> [--limit <n>]
```
Search messages using Gmail search syntax.

```
dev api gmail messages trash <id>
```
Move a message to trash.

```
dev api gmail messages delete <id> [--confirm]
```
Permanently delete a message.

```
dev api gmail labels list
```
List all labels.

```
dev api gmail labels get <id>
```
Get details for a single label.

```
dev api gmail drafts list [--limit <n>]
```
List drafts.

```
dev api gmail drafts create --to <address> --subject <text> --body <text>
```
Create a new draft.

```
dev api gmail drafts update <id> [--to <address>] [--subject <text>] [--body <text>]
```
Update an existing draft.

```
dev api gmail drafts send <id>
```
Send an existing draft.

```
dev api gmail threads list [--limit <n>] [--query <query>]
```
List threads.

```
dev api gmail threads get <id>
```
Get a single thread with all its messages.

```
dev api gmail threads trash <id>
```
Move a thread to trash.

---

## api drive

*Plugin: `@fredlackey/devutils-api-drive`*

```
dev api drive files list [--limit <n>] [--folder <id>] [--type <mime-type>]
```
List files. `--folder` scopes to a folder. `--type` filters by MIME type.

```
dev api drive files get <id>
```
Get metadata for a single file.

```
dev api drive files upload <path> [--folder <id>] [--name <name>]
```
Upload a local file. `--folder` sets the parent folder. `--name` overrides the filename.

```
dev api drive files download <id> --output <path>
```
Download a file to a local path.

```
dev api drive files search <query> [--limit <n>]
```
Search files using Drive search syntax.

```
dev api drive files move <id> --folder <id>
```
Move a file to a different folder.

```
dev api drive files delete <id> [--confirm]
```
Permanently delete a file.

```
dev api drive folders list [--parent <id>]
```
List folders. `--parent` scopes to a parent folder.

```
dev api drive folders create <name> [--parent <id>]
```
Create a new folder.

```
dev api drive folders delete <id> [--confirm]
```
Delete a folder.

```
dev api drive permissions list <file-id>
```
List permissions on a file or folder.

```
dev api drive permissions add <file-id> --email <address> --role <reader|writer|commenter>
```
Add a permission to a file or folder.

```
dev api drive permissions remove <file-id> <permission-id>
```
Remove a permission.

---

## api sheets

*Plugin: `@fredlackey/devutils-api-sheets`*

```
dev api sheets spreadsheets list [--limit <n>]
```
List spreadsheets.

```
dev api sheets spreadsheets get <id>
```
Get metadata for a spreadsheet.

```
dev api sheets spreadsheets create <title>
```
Create a new spreadsheet.

```
dev api sheets values get <spreadsheet-id> <range>
```
Get cell values for a range (e.g., `Sheet1!A1:C10`).

```
dev api sheets values set <spreadsheet-id> <range>
```
Set cell values for a range. Pass data via the global `--json` flag.

```
dev api sheets values append <spreadsheet-id> <range>
```
Append rows to a range. Pass data via the global `--json` flag.

```
dev api sheets values clear <spreadsheet-id> <range>
```
Clear cell values in a range.

```
dev api sheets sheets list <spreadsheet-id>
```
List sheets (tabs) within a spreadsheet.

```
dev api sheets sheets add <spreadsheet-id> <title>
```
Add a new sheet to a spreadsheet.

```
dev api sheets sheets remove <spreadsheet-id> <sheet-id> [--confirm]
```
Remove a sheet from a spreadsheet.

---

## api docs

*Plugin: `@fredlackey/devutils-api-docs`*

```
dev api docs documents list [--limit <n>]
```
List documents.

```
dev api docs documents get <id>
```
Get metadata and content for a document.

```
dev api docs documents create <title>
```
Create a new document.

```
dev api docs documents export <id> --output <path> [--type <pdf|txt|docx|html>]
```
Export a document to a local file. `--type` sets the export format.

---

## api aws

*Plugin: `@fredlackey/devutils-api-aws`*

```
dev api aws compute list [--region <region>] [--state <running|stopped|all>] [--tag <key=value>]
```
List EC2 instances. `--state` filters by instance state. `--tag` filters by tag.

```
dev api aws compute get <instance-id> [--region <region>]
```
Get details for a single instance.

```
dev api aws compute start <instance-id> [--region <region>]
```
Start a stopped instance.

```
dev api aws compute stop <instance-id> [--region <region>]
```
Stop a running instance.

```
dev api aws compute status <instance-id> [--region <region>]
```
Get the current status of an instance.

```
dev api aws storage buckets list [--region <region>]
```
List S3 buckets.

```
dev api aws storage objects list <bucket> [--prefix <path>] [--limit <n>]
```
List objects in a bucket. `--prefix` scopes to a key prefix.

```
dev api aws storage objects upload <path> <bucket> <key> [--region <region>]
```
Upload a local file to S3.

```
dev api aws storage objects download <bucket> <key> --output <path> [--region <region>]
```
Download an S3 object to a local file.

```
dev api aws functions list [--region <region>]
```
List Lambda functions.

```
dev api aws functions invoke <name> [--payload <data>] [--region <region>]
```
Invoke a Lambda function. `--payload` is the input JSON (or use global `--json` flag).

```
dev api aws functions logs <name> [--limit <n>] [--since <duration>] [--region <region>]
```
Get recent CloudWatch logs for a function. `--since` accepts durations like `1h`, `30m`.

```
dev api aws groups list [--tag <key=value>] [--region <region>]
```
List resource groups by tag.

```
dev api aws groups status <tag-key> <tag-value> [--region <region>]
```
Get status of all resources in a tag group.

```
dev api aws groups start <tag-key> <tag-value> [--region <region>]
```
Start all startable resources in a tag group.

```
dev api aws groups stop <tag-key> <tag-value> [--region <region>]
```
Stop all stoppable resources in a tag group.

---

## api cloudflare

*Plugin: `@fredlackey/devutils-api-cloudflare`*

```
dev api cloudflare zones list [--limit <n>]
```
List all zones (domains) in the account.

```
dev api cloudflare zones get <zone-id>
```
Get details for a single zone.

```
dev api cloudflare zones create <domain>
```
Add a new zone to the account.

```
dev api cloudflare dns list <zone-id> [--type <A|AAAA|CNAME|MX|TXT|...>] [--name <name>]
```
List DNS records for a zone. `--type` filters by record type. `--name` filters by name.

```
dev api cloudflare dns get <zone-id> <record-id>
```
Get a single DNS record.

```
dev api cloudflare dns create <zone-id> --type <type> --name <name> --content <value> [--ttl <seconds>] [--proxied]
```
Create a DNS record. `--proxied` enables Cloudflare proxying.

```
dev api cloudflare dns update <zone-id> <record-id> [--type <type>] [--name <name>] [--content <value>] [--ttl <seconds>] [--proxied]
```
Update an existing DNS record.

```
dev api cloudflare dns delete <zone-id> <record-id> [--confirm]
```
Delete a DNS record.

```
dev api cloudflare tokens list
```
List API tokens for the account.

```
dev api cloudflare tokens verify [--token <token>]
```
Verify that a token is valid and show its permissions.

---

## api dokploy

*Plugin: `@fredlackey/devutils-api-dokploy`*

```
dev api dokploy applications list [--project <id>]
```
List applications. `--project` scopes to a specific project.

```
dev api dokploy applications get <app-id>
```
Get details for a single application.

```
dev api dokploy applications create <name> --project <id> [--type <type>]
```
Create a new application within a project.

```
dev api dokploy applications start <app-id>
```
Start a stopped application.

```
dev api dokploy applications stop <app-id>
```
Stop a running application.

```
dev api dokploy applications delete <app-id> [--confirm]
```
Delete an application.

```
dev api dokploy projects list
```
List all projects.

```
dev api dokploy projects get <project-id>
```
Get details for a single project.

```
dev api dokploy projects create <name>
```
Create a new project.

```
dev api dokploy domains list <app-id>
```
List domains bound to an application.

```
dev api dokploy domains add <app-id> --host <hostname> [--https]
```
Add a domain to an application. `--https` enables SSL.

```
dev api dokploy domains remove <app-id> <domain-id> [--confirm]
```
Remove a domain from an application.

```
dev api dokploy servers list
```
List all connected servers.

```
dev api dokploy servers get <server-id>
```
Get details for a single server.

---

## api namecheap

*Plugin: `@fredlackey/devutils-api-namecheap`*

```
dev api namecheap domains list [--limit <n>]
```
List all domains in the account.

```
dev api namecheap domains get <domain>
```
Get registration and status details for a domain.

```
dev api namecheap domains check <domain>
```
Check if a domain is available for registration.

```
dev api namecheap dns list <domain>
```
List DNS host records for a domain.

```
dev api namecheap dns set <domain>
```
Set DNS host records for a domain. Pass records via the global `--json` flag.

```
dev api namecheap dns delete <domain> <record-id> [--confirm]
```
Delete a DNS host record.

```
dev api namecheap ssl list [--limit <n>]
```
List SSL certificates in the account.

```
dev api namecheap ssl get <cert-id>
```
Get details for an SSL certificate.

---

## api flowroute

*Plugin: `@fredlackey/devutils-api-flowroute`*

```
dev api flowroute sms send --to <number> --from <number> --body <text>
```
Send an SMS message.

```
dev api flowroute sms list [--limit <n>] [--start-date <date>]
```
List sent and received SMS messages.

```
dev api flowroute mms send --to <number> --from <number> --body <text> [--media <url>]
```
Send an MMS message. `--media` attaches a media URL.

```
dev api flowroute mms list [--limit <n>] [--start-date <date>]
```
List sent and received MMS messages.

```
dev api flowroute numbers list [--limit <n>]
```
List phone numbers on the account.

```
dev api flowroute numbers get <number>
```
Get details for a single phone number.

---

## api mailu

*Plugin: `@fredlackey/devutils-api-mailu`*

```
dev api mailu users list [--domain <domain>]
```
List email users. `--domain` filters by domain.

```
dev api mailu users get <email>
```
Get details for a single user.

```
dev api mailu users create <email> --password <password> [--display-name <name>]
```
Create a new email user.

```
dev api mailu users delete <email> [--confirm]
```
Delete an email user.

```
dev api mailu aliases list [--domain <domain>]
```
List email aliases. `--domain` filters by domain.

```
dev api mailu aliases create <alias> --destination <email>
```
Create an email alias that forwards to a destination address.

```
dev api mailu aliases delete <alias> [--confirm]
```
Delete an email alias.

```
dev api mailu domains list
```
List all configured email domains.

```
dev api mailu domains add <domain>
```
Add a new email domain.

---

## Top-Level Commands

```
dev status
```
Overall health check. Shows config state, machine profile, connected services,
identity status, and sync status.

```
dev update [--check]
```
Self-update to the latest published version. `--check` reports whether an update
is available without installing it.

```
dev version
```
Show the current installed version.

```
dev schema <path>
```
Introspect a command, service, or API endpoint by dot-notation path
(e.g., `config.set`, `api.gmail.messages.list`). Returns the command's accepted
arguments, flags, and output shape.

```
dev help [command...]
```
Show usage information. When called with a command path (e.g., `dev help config set`),
shows help for that specific command.

---

## Command Count

| Service | Commands |
|---|---|
| config | 7 |
| machine | 4 |
| identity | 7 |
| tools | 4 |
| ignore | 4 |
| util | 5 |
| alias | 4 |
| auth | 5 |
| ai | 6 |
| search | 9 |
| api (core) | 4 |
| api gmail | 15 |
| api drive | 12 |
| api sheets | 9 |
| api docs | 4 |
| api aws | 15 |
| api cloudflare | 10 |
| api dokploy | 14 |
| api namecheap | 8 |
| api flowroute | 6 |
| api mailu | 9 |
| top-level | 5 |
| **Total** | **158** |
