#!/usr/bin/env node

/**
 * git-backup - Create timestamped zip backup of a git repository
 *
 * Migrated from legacy dotfiles function.
 * Original:
 *   git-backup() {
 *       local target_folder="$1"
 *       local ssh_repo="$2"
 *       local timestamp
 *       timestamp=$(date +"%Y%m%d-%H%M")
 *       ... (creates mirror clone, packages into timestamped zip, skips if no changes)
 *   }
 *
 * This script creates a complete backup of a git repository including all
 * branches, tags, and history. The backup is stored as a timestamped zip file
 * containing a mirror clone and a README with restore instructions.
 *
 * Features:
 * - Backs up current repo or a remote repo via SSH URL
 * - Creates mirror clones preserving all refs and history
 * - Skips backup if no changes since last backup (compares HEAD commits)
 * - Includes README.md with restore instructions
 *
 * Usage:
 *   git-backup <target-folder>              # Backup current repo
 *   git-backup <target-folder> <ssh-repo>   # Backup remote repo
 *
 * @module scripts/git-backup
 */

const os = require('../utils/common/os');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Helper function to check if a command exists on the system.
 * Uses 'which' on Unix-like systems and 'where' on Windows.
 *
 * @param {string} cmd - The command name to check
 * @returns {boolean} True if the command exists, false otherwise
 */
function isCommandAvailable(cmd) {
  try {
    const checkCmd = process.platform === 'win32' ? `where ${cmd}` : `which ${cmd}`;
    execSync(checkCmd, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Formats current date/time as YYYYMMDD-HHMM for timestamping backups.
 *
 * @returns {string} Formatted timestamp string
 */
function getTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}${month}${day}-${hours}${minutes}`;
}

/**
 * Generates the README.md content for the backup archive.
 * This file explains how to restore from the backup.
 *
 * @param {string} repoName - The name of the repository
 * @param {string} timestamp - The backup timestamp
 * @returns {string} README.md content
 */
function generateReadme(repoName, timestamp) {
  return `# ${repoName} Backup

This is a mirror clone of the Git repository, created on ${timestamp}.

## Usage

To clone this backup and preserve all refs and history, run:

    git clone --mirror ${repoName}.git

To clone it and create a working directory:

    git clone ${repoName}.git ${repoName}-restored

`;
}

/**
 * Gets the HEAD commit hash from a git repository directory.
 *
 * @param {string} repoPath - Path to the git repository (can be bare/mirror)
 * @returns {string|null} The HEAD commit hash, or null if unavailable
 */
function getHeadCommit(repoPath) {
  try {
    const result = execSync(`git -C "${repoPath}" rev-parse HEAD`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    return result.trim();
  } catch {
    return null;
  }
}

/**
 * Checks if we are inside a git repository.
 *
 * @param {string} [dir] - Directory to check (defaults to current directory)
 * @returns {boolean} True if inside a git repo
 */
function isInsideGitRepo(dir) {
  try {
    const opts = { stdio: ['pipe', 'pipe', 'pipe'] };
    if (dir) {
      opts.cwd = dir;
    }
    execSync('git rev-parse --is-inside-work-tree', opts);
    return true;
  } catch {
    return false;
  }
}

/**
 * Gets the root directory of the current git repository.
 *
 * @returns {string|null} The repo root path, or null if not in a repo
 */
function getRepoRoot() {
  try {
    const result = execSync('git rev-parse --show-toplevel', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    return result.trim();
  } catch {
    return null;
  }
}

/**
 * Extracts repository name from a git URL or path.
 *
 * @param {string} repoPath - Path or URL to the repository
 * @returns {string} The repository name (without .git extension)
 */
function getRepoName(repoPath) {
  // Handle SSH URLs like git@github.com:user/repo.git
  // Handle HTTPS URLs like https://github.com/user/repo.git
  // Handle local paths like /path/to/repo or /path/to/repo.git
  const baseName = path.basename(repoPath);
  // Remove .git extension if present
  return baseName.replace(/\.git$/, '');
}

/**
 * Creates a temporary directory using Node.js native APIs.
 *
 * @returns {string} Path to the created temporary directory
 */
function createTempDir() {
  const tmpBase = os.getTempDir();
  const prefix = 'git-backup-';
  // Create unique temp directory
  const tempPath = path.join(tmpBase, prefix + Date.now() + '-' + Math.random().toString(36).slice(2));
  fs.mkdirSync(tempPath, { recursive: true });
  return tempPath;
}

/**
 * Recursively removes a directory and all its contents.
 *
 * @param {string} dirPath - Path to directory to remove
 */
function removeDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
}

/**
 * Finds the most recent backup file for a repository in the target folder.
 *
 * @param {string} targetFolder - The backup target folder
 * @param {string} repoName - The repository name
 * @returns {string|null} Path to the most recent backup, or null if none found
 */
function findLatestBackup(targetFolder, repoName) {
  if (!fs.existsSync(targetFolder)) {
    return null;
  }

  const files = fs.readdirSync(targetFolder);
  // Filter for this repo's backups and sort by name (timestamp in name makes this work)
  const backups = files
    .filter(f => f.startsWith(`${repoName}-`) && f.endsWith('.zip'))
    .sort()
    .reverse();

  if (backups.length === 0) {
    return null;
  }

  return path.join(targetFolder, backups[0]);
}

/**
 * Creates a zip archive from a directory.
 * Uses the native 'zip' command on Unix or PowerShell on Windows.
 *
 * @param {string} sourceDir - Directory to zip (will be the working directory)
 * @param {string} outputPath - Full path for the output zip file
 * @param {string} platform - The platform type ('windows', 'cmd', 'powershell', 'gitbash', or Unix)
 */
function createZipArchive(sourceDir, outputPath, platform) {
  if (platform === 'windows' || platform === 'cmd' || platform === 'powershell') {
    // Use PowerShell's Compress-Archive on Windows
    execSync(
      `powershell -Command "Compress-Archive -Path '${sourceDir}\\*' -DestinationPath '${outputPath}' -Force"`,
      { stdio: 'inherit' }
    );
  } else {
    // Use native zip command on Unix-like systems
    execSync(`zip -qr "${outputPath}" .`, {
      cwd: sourceDir,
      stdio: 'inherit'
    });
  }
}

/**
 * Extracts a zip archive to a directory.
 * Uses 'unzip' on Unix or PowerShell on Windows.
 *
 * @param {string} zipPath - Path to the zip file
 * @param {string} targetDir - Directory to extract to
 * @param {string} platform - The platform type
 */
function extractZipArchive(zipPath, targetDir, platform) {
  fs.mkdirSync(targetDir, { recursive: true });

  if (platform === 'windows' || platform === 'cmd' || platform === 'powershell') {
    // Use PowerShell's Expand-Archive on Windows
    execSync(
      `powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${targetDir}' -Force"`,
      { stdio: 'pipe' }
    );
  } else {
    // Use native unzip command on Unix-like systems
    execSync(`unzip -qq "${zipPath}" -d "${targetDir}"`, { stdio: 'pipe' });
  }
}

/**
 * Pure Node.js implementation of the git backup logic.
 * This handles most of the backup process using Node.js APIs,
 * but delegates to git and zip commands which are required dependencies.
 *
 * @param {string[]} args - Command line arguments [target-folder, ssh-repo?]
 * @param {string} platformType - The platform type for zip handling
 * @returns {Promise<void>}
 */
async function do_git_backup_nodejs(args, platformType) {
  const targetFolder = args[0];
  const sshRepo = args[1];

  // Validate required argument
  if (!targetFolder) {
    console.log('Usage: git-backup <target-folder> [ssh-repo]');
    console.log('');
    console.log('Arguments:');
    console.log('  target-folder  Directory where the backup zip will be saved');
    console.log('  ssh-repo       Optional SSH URL to backup (defaults to current repo)');
    console.log('');
    console.log('Examples:');
    console.log('  git-backup ./backups                          # Backup current repo');
    console.log('  git-backup ./backups git@github.com:user/repo.git  # Backup remote repo');
    process.exit(1);
  }

  // Check for required dependencies
  if (!isCommandAvailable('git')) {
    console.error('Error: git is required but not installed.');
    console.error('Please install git to use this command.');
    process.exit(1);
  }

  // Check for zip/unzip availability (different check for Windows)
  const isWindowsPlatform = platformType === 'windows' || platformType === 'cmd' || platformType === 'powershell';
  if (!isWindowsPlatform && !isCommandAvailable('zip')) {
    console.error('Error: zip is required but not installed.');
    console.error('Install it with:');
    console.error('  macOS: brew install zip');
    console.error('  Ubuntu/Debian: sudo apt install zip');
    console.error('  Amazon Linux/RHEL: sudo yum install zip');
    process.exit(1);
  }

  // Create timestamp for this backup
  const timestamp = getTimestamp();

  // Ensure target folder exists
  fs.mkdirSync(targetFolder, { recursive: true });

  let workDir;
  let repoName;
  let repoPath;

  try {
    if (sshRepo) {
      // Backup from remote SSH URL
      workDir = createTempDir();
      const mirrorPath = path.join(workDir, 'mirror');

      console.log(`Cloning mirror of ${sshRepo}...`);
      execSync(`git clone --mirror "${sshRepo}" "${mirrorPath}"`, {
        stdio: 'pipe'
      });

      repoName = getRepoName(sshRepo);
      repoPath = mirrorPath;
    } else {
      // Backup current repository
      if (!isInsideGitRepo()) {
        console.error('Error: not inside a Git repository.');
        console.error('Either run this command from within a git repo, or provide an SSH URL.');
        process.exit(1);
      }

      const currentRepoRoot = getRepoRoot();
      if (!currentRepoRoot) {
        console.error('Error: could not determine repository root.');
        process.exit(1);
      }

      repoName = getRepoName(currentRepoRoot);
      workDir = createTempDir();
      const mirrorPath = path.join(workDir, 'mirror');

      console.log(`Creating mirror of ${repoName}...`);
      execSync(`git clone --mirror "${currentRepoRoot}" "${mirrorPath}"`, {
        stdio: 'pipe'
      });

      repoPath = mirrorPath;
    }

    // Create wrapper directory structure
    const wrapperDir = path.join(workDir, 'wrapper');
    const gitDir = path.join(wrapperDir, `${repoName}.git`);
    fs.mkdirSync(wrapperDir, { recursive: true });

    // Move mirror to wrapper with proper name
    fs.renameSync(repoPath, gitDir);

    // Create README.md with restore instructions
    const readmePath = path.join(wrapperDir, 'README.md');
    fs.writeFileSync(readmePath, generateReadme(repoName, timestamp), 'utf8');

    // Get the HEAD commit of the new backup
    const newHeadCommit = getHeadCommit(gitDir);

    // Check for existing backups and compare
    const latestBackup = findLatestBackup(targetFolder, repoName);
    if (latestBackup && newHeadCommit) {
      // Extract latest backup temporarily to compare
      const tempExtract = createTempDir();
      try {
        extractZipArchive(latestBackup, tempExtract, platformType);

        // Find the .git directory in the extracted backup
        const extractedDirs = fs.readdirSync(tempExtract);
        let oldHeadCommit = null;

        for (const dir of extractedDirs) {
          const potentialGitDir = path.join(tempExtract, dir, `${repoName}.git`);
          if (fs.existsSync(potentialGitDir)) {
            oldHeadCommit = getHeadCommit(potentialGitDir);
            break;
          }
          // Also check if .git dir is at root level
          const rootGitDir = path.join(tempExtract, `${repoName}.git`);
          if (fs.existsSync(rootGitDir)) {
            oldHeadCommit = getHeadCommit(rootGitDir);
            break;
          }
        }

        if (oldHeadCommit && newHeadCommit && oldHeadCommit === newHeadCommit) {
          console.log('No changes since last backup. Skipping new archive.');
          removeDir(tempExtract);
          removeDir(workDir);
          return;
        }
      } catch (err) {
        // If comparison fails, proceed with backup anyway
        console.log('Warning: Could not compare with previous backup, creating new backup.');
      } finally {
        removeDir(tempExtract);
      }
    }

    // Create the archive
    const archiveName = `${repoName}-${timestamp}.zip`;
    const archivePath = path.join(path.resolve(targetFolder), archiveName);

    console.log('Creating backup archive...');
    createZipArchive(wrapperDir, archivePath, platformType);

    console.log(`Backup created at: ${archivePath}`);

  } finally {
    // Cleanup temp directory
    if (workDir) {
      removeDir(workDir);
    }
  }
}

/**
 * Create timestamped zip backup on macOS.
 * macOS has native zip command available and uses standard git.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_git_backup_macos(args) {
  return do_git_backup_nodejs(args, 'macos');
}

/**
 * Create timestamped zip backup on Ubuntu.
 * Ubuntu has zip available via apt and uses standard git.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_git_backup_ubuntu(args) {
  return do_git_backup_nodejs(args, 'ubuntu');
}

/**
 * Create timestamped zip backup on Raspberry Pi OS.
 * Raspberry Pi OS (Raspbian) has zip available via apt and uses standard git.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_git_backup_raspbian(args) {
  return do_git_backup_nodejs(args, 'raspbian');
}

/**
 * Create timestamped zip backup on Amazon Linux.
 * Amazon Linux has zip available via yum/dnf and uses standard git.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_git_backup_amazon_linux(args) {
  return do_git_backup_nodejs(args, 'amazon_linux');
}

/**
 * Create timestamped zip backup on Windows Command Prompt.
 * Uses PowerShell's Compress-Archive for zip functionality.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_git_backup_cmd(args) {
  return do_git_backup_nodejs(args, 'cmd');
}

/**
 * Create timestamped zip backup on Windows PowerShell.
 * Uses native PowerShell Compress-Archive cmdlet for zip functionality.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_git_backup_powershell(args) {
  return do_git_backup_nodejs(args, 'powershell');
}

/**
 * Create timestamped zip backup in Git Bash on Windows.
 * Git Bash provides Unix-like environment but we use PowerShell for zip
 * to ensure compatibility.
 *
 * @param {string[]} args - Command line arguments
 * @returns {Promise<void>}
 */
async function do_git_backup_gitbash(args) {
  // Git Bash runs on Windows - check if native zip is available
  // If not, fall back to PowerShell
  if (isCommandAvailable('zip')) {
    return do_git_backup_nodejs(args, 'gitbash');
  }
  return do_git_backup_nodejs(args, 'powershell');
}

/**
 * Main entry point - detects environment and executes appropriate implementation.
 *
 * Creates a timestamped zip backup of a git repository. The backup includes:
 * - A mirror clone with all branches, tags, and refs
 * - A README.md with instructions for restoring the backup
 *
 * The backup is intelligent:
 * - Skips creating a new backup if no changes since the last one
 * - Uses timestamps to allow multiple backups over time
 * - Preserves complete git history
 *
 * @param {string[]} args - Command line arguments [target-folder, ssh-repo?]
 * @returns {Promise<void>}
 */
async function do_git_backup(args) {
  const platform = os.detect();

  const handlers = {
    'macos': do_git_backup_macos,
    'ubuntu': do_git_backup_ubuntu,
    'debian': do_git_backup_ubuntu,
    'raspbian': do_git_backup_raspbian,
    'amazon_linux': do_git_backup_amazon_linux,
    'rhel': do_git_backup_amazon_linux,
    'fedora': do_git_backup_ubuntu,
    'linux': do_git_backup_ubuntu,
    'wsl': do_git_backup_ubuntu,
    'cmd': do_git_backup_cmd,
    'windows': do_git_backup_cmd,
    'powershell': do_git_backup_powershell,
    'gitbash': do_git_backup_gitbash
  };

  const handler = handlers[platform.type];
  if (!handler) {
    console.error(`Platform '${platform.type}' is not supported for this command.`);
    console.error('');
    console.error('Supported platforms:');
    console.error('  - macOS');
    console.error('  - Ubuntu, Debian, and other Linux distributions');
    console.error('  - Raspberry Pi OS');
    console.error('  - Amazon Linux, RHEL, Fedora');
    console.error('  - Windows (CMD, PowerShell, Git Bash)');
    process.exit(1);
  }

  await handler(args);
}

module.exports = {
  main: do_git_backup,
  do_git_backup,
  do_git_backup_nodejs,
  do_git_backup_macos,
  do_git_backup_ubuntu,
  do_git_backup_raspbian,
  do_git_backup_amazon_linux,
  do_git_backup_cmd,
  do_git_backup_powershell,
  do_git_backup_gitbash
};

if (require.main === module) {
  do_git_backup(process.argv.slice(2));
}
