# @fredlackey/devutils-api-gmail

Gmail plugin for [DevUtils CLI](https://github.com/FredLackey/devutils-cli).

## Installation

Install through the DevUtils CLI:

    dev api enable gmail

Or install directly from npm:

    npm install @fredlackey/devutils-api-gmail

## Authentication

This plugin requires authentication with Google:

    dev auth login google

The plugin uses OAuth 2.0 to access the Gmail API. You will need to configure
Google API credentials before any commands will work. See the
[Google API Console](https://console.developers.google.com/) to create
credentials with the `gmail.readonly` and `gmail.send` scopes (or broader
scopes depending on which commands you need).

## Commands

| Command | Description |
|---------|-------------|
| `dev api gmail messages list` | List messages in the authenticated mailbox |
| `dev api gmail messages get <id>` | Get a single message by ID |
| `dev api gmail messages send` | Send an email message |
| `dev api gmail messages delete <id>` | Delete a message by ID |
| `dev api gmail labels list` | List all labels in the mailbox |
| `dev api gmail labels get <id>` | Get a label by ID |
| `dev api gmail labels create <name>` | Create a new label |
| `dev api gmail labels delete <id>` | Delete a label by ID |
| `dev api gmail drafts list` | List drafts in the mailbox |
| `dev api gmail drafts get <id>` | Get a draft by ID |
| `dev api gmail drafts create` | Create a new draft message |
| `dev api gmail drafts send <id>` | Send a draft by ID |
| `dev api gmail drafts delete <id>` | Delete a draft by ID |
| `dev api gmail threads list` | List conversation threads |
| `dev api gmail threads get <id>` | Get a thread by ID |

## Flags Reference

### Messages

- `messages list --limit <n>` -- Maximum number of messages to return (default 25)
- `messages list --label <name>` -- Filter by label (e.g. INBOX, SENT, STARRED)
- `messages list --query <q>` -- Gmail search query (same syntax as the Gmail search bar)
- `messages get <id> --full` -- Return the full message payload including headers and body
- `messages send --to <addr> --subject <text> --body <text>` -- Required flags for sending
- `messages send --cc <addr> --bcc <addr>` -- Optional CC and BCC recipients
- `messages delete <id> --confirm` -- Skip the confirmation prompt

### Labels

- `labels delete <id> --confirm` -- Skip the confirmation prompt

### Drafts

- `drafts list --limit <n>` -- Maximum number of drafts to return (default 25)
- `drafts create --to <addr> --subject <text> --body <text>` -- Required flags for creating
- `drafts delete <id> --confirm` -- Skip the confirmation prompt

### Threads

- `threads list --limit <n>` -- Maximum number of threads to return (default 25)
- `threads list --label <name>` -- Filter by label (e.g. INBOX, SENT, STARRED)

## Development

### Setup

1. Clone the repo:

       git clone git@github.com:FredLackey/devutils-api-gmail.git
       cd devutils-api-gmail

2. Install dependencies:

       npm install

3. Link for local testing:

       cd ~/.devutils/plugins
       npm install /path/to/devutils-api-gmail

4. Verify the plugin loads:

       dev api list
       dev schema api.gmail

### Adding a command

1. Create a new file under `commands/<resource>/<method>.js`.
2. Export `{ meta, run }` following the pattern in any existing command file.
3. Register it in `index.js` under the appropriate resource's `commands` map.
4. Test it: `dev api gmail <resource> <method>`.

### Testing

There is no test framework dependency. Test by running commands directly:

    dev api gmail messages list --format json
    dev schema api.gmail.messages.list

## License

Apache-2.0
