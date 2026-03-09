# @fredlackey/devutils-api-<service>

<Service display name> plugin for [DevUtils CLI](https://github.com/FredLackey/devutils-cli).

## Installation

Install through the DevUtils CLI:

    dev api enable <service>

Or install directly from npm:

    npm install @fredlackey/devutils-api-<service>

## Authentication

This plugin requires authentication with <auth-service>:

    dev auth login <auth-service>

## Commands

| Command | Description |
|---------|-------------|
| `dev api <service> sample list` | List sample resources |

## Development

### Setup

1. Clone the repo:

       git clone git@github.com:FredLackey/devutils-api-<service>.git
       cd devutils-api-<service>

2. Install dependencies (if any):

       npm install

3. Link for local testing:

       cd ~/.devutils/plugins
       npm install /path/to/devutils-api-<service>

4. Verify the plugin loads:

       dev api list
       dev schema api.<service>

### Adding a command

1. Create a new file under `commands/<resource>/<method>.js`.
2. Export `{ meta, run }` following the pattern in `commands/sample/list.js`.
3. Register it in `index.js` under the appropriate resource's `commands` map.
4. Test it: `dev api <service> <resource> <method>`.

### Testing

There is no test framework dependency. Test by running commands directly:

    dev api <service> sample list --format json
    dev schema api.<service>.sample.list

## License

Apache-2.0
