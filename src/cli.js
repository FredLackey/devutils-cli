#!/usr/bin/env node

/**
 * Command router. Parses arguments, resolves the service and method, applies
 * global flags, runs output format detection, and dispatches to the right
 * command file.
 *
 * This file should not contain business logic. It's routing only.
 *
 * Responsibilities:
 * - Parse `dev <service> [resource] <method> [arguments] [flags]`
 * - Apply global flags (--format, --dry-run, --verbose, --quiet, --json)
 * - Call lib/detect.js to resolve the default output format
 * - Load the matching command from commands/<service>/<method>.js
 * - Handle unknown commands with helpful suggestions
 * - Handle --version and --help at the top level
 */

// TODO: Implement command routing
