'use strict';

const readline = require('readline');
const { detectOutputMode } = require('./detect');

/**
 * Checks if the current environment is interactive (human at a terminal).
 * Only 'tty' callers are interactive. AI tools, CI systems, and piped output
 * are all non-interactive.
 *
 * @returns {boolean}
 */
function isInteractive() {
  const { caller } = detectOutputMode();
  return caller === 'tty';
}

/**
 * Opens a readline interface, asks one question, and closes it.
 * Writes prompt text to stderr (not stdout) so piped output stays clean.
 *
 * @param {string} question - The question text to display.
 * @returns {Promise<string>} The user's answer.
 */
function askReadline(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stderr,
    });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

/**
 * Asks a free-text question. Returns the user's answer, or the default value
 * in non-interactive mode or when the user presses Enter without typing.
 *
 * @param {string} question - The question to ask.
 * @param {string} [defaultValue=''] - The default value if no input is given.
 * @returns {Promise<string>}
 */
async function ask(question, defaultValue = '') {
  if (!isInteractive()) {
    return defaultValue;
  }

  const suffix = defaultValue ? ` (${defaultValue})` : '';
  const answer = await askReadline(`${question}${suffix}: `);
  return answer.trim() || defaultValue;
}

/**
 * Asks a yes/no question. Returns true or false.
 * The hint shows which option is default: (Y/n) means yes, (y/N) means no.
 *
 * @param {string} question - The question to ask.
 * @param {boolean} [defaultValue=false] - The default value.
 * @returns {Promise<boolean>}
 */
async function confirm(question, defaultValue = false) {
  if (!isInteractive()) {
    return defaultValue;
  }

  const hint = defaultValue ? '(Y/n)' : '(y/N)';
  const answer = await askReadline(`${question} ${hint}: `);
  const trimmed = answer.trim().toLowerCase();

  if (trimmed === '') return defaultValue;
  return trimmed === 'y' || trimmed === 'yes';
}

/**
 * Presents a numbered list of choices and asks the user to pick one.
 * Returns the selected choice string.
 * Invalid input falls back to the default with a message.
 *
 * @param {string} question - The question to display above the choices.
 * @param {string[]} choices - The list of choices.
 * @param {number} [defaultIndex=0] - The index of the default choice.
 * @returns {Promise<string>}
 */
async function choose(question, choices, defaultIndex = 0) {
  if (!isInteractive()) {
    return choices[defaultIndex] || choices[0];
  }

  // Display the choices on stderr
  process.stderr.write(`${question}\n`);
  for (let i = 0; i < choices.length; i++) {
    const marker = i === defaultIndex ? '>' : ' ';
    process.stderr.write(`  ${marker} ${i + 1}. ${choices[i]}\n`);
  }

  const answer = await askReadline(`Choice (1-${choices.length}) [${defaultIndex + 1}]: `);
  const trimmed = answer.trim();

  if (trimmed === '') return choices[defaultIndex];

  const index = parseInt(trimmed, 10) - 1;
  if (isNaN(index) || index < 0 || index >= choices.length) {
    process.stderr.write(`Invalid choice. Using default: ${choices[defaultIndex]}\n`);
    return choices[defaultIndex];
  }

  return choices[index];
}

/**
 * Asks for sensitive input (passwords, API keys). The input is not echoed.
 * Returns an empty string in non-interactive mode.
 *
 * @param {string} question - The prompt text.
 * @returns {Promise<string>}
 */
async function password(question) {
  if (!isInteractive()) {
    return '';
  }

  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stderr,
      terminal: true,
    });

    const origWrite = rl.output.write.bind(rl.output);
    let muted = false;

    rl.output.write = function(chunk) {
      if (muted) return;
      return origWrite(chunk);
    };

    rl.question(`${question}: `, (answer) => {
      muted = false;
      rl.output.write('\n');
      rl.close();
      resolve(answer);
    });

    muted = true;
  });
}

/**
 * Alias for ask(). Command stories may use context.prompt.input().
 */
const input = ask;

/**
 * Alias for choose(). Command stories may use context.prompt.select().
 */
const select = choose;

module.exports = { ask, input, confirm, choose, select, password, isInteractive };
