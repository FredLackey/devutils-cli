#!/usr/bin/env node

/**
 * @fileoverview Main entry point for the `dev` CLI command.
 * This file handles tab completion detection and delegates to the CLI module.
 */

// Handle tab completion before loading the full CLI
// This allows for fast completion responses
if (process.env.COMP_LINE) {
  require('../src/completion').handleCompletion();
  process.exit(0);
}

// Normal CLI execution
require('../src/cli').run();
