'use strict';

const path = require('path');
const os = require('os');

/**
 * Registry of known AI coding tools.
 * Maps tool names to their CLI configuration, including binary names,
 * mode flags, session storage paths, and display names.
 *
 * Adding a new AI tool is just adding an entry here.
 */
const AI_TOOLS = {
  claude: {
    binary: 'claude',
    modes: {
      default: [],
      danger: ['--dangerously-skip-permissions']
    },
    modelFlag: '--model',
    promptFlag: '--prompt',
    resumeFlag: '--resume',
    displayName: 'Claude Code',
    sessionPaths: [
      path.join(os.homedir(), '.claude', 'projects'),
      path.join(os.homedir(), '.config', 'claude', 'projects')
    ]
  },
  gemini: {
    binary: 'gemini',
    modes: {
      default: [],
      yolo: ['--sandbox=false']
    },
    modelFlag: '--model',
    promptFlag: '--prompt',
    resumeFlag: '--resume',
    displayName: 'Gemini CLI',
    sessionPaths: [
      path.join(os.homedir(), '.gemini', 'sessions'),
      path.join(os.homedir(), '.config', 'gemini', 'sessions')
    ]
  }
};

module.exports = { AI_TOOLS };
