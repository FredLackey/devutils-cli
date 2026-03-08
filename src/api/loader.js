/**
 * Plugin discovery, loading, and command registration.
 *
 * Reads ~/.devutils/plugins.json to find installed plugins, then loads
 * the requested plugin package from ~/.devutils/plugins/node_modules/.
 *
 * Each plugin exports a standard contract (see proposed-api-plugin-architecture.md):
 * - name, description, version, auth
 * - resources: { <resource>: { description, commands: { <method>: () => require(...) } } }
 */

// TODO: Implement plugin loader
