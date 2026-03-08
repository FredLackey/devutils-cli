# Scripts

This folder contains **Scripts** — standalone global utilities that replace shell aliases and functions from dotfiles.

## Purpose

Scripts are single-command utilities that can be invoked directly from the command line after installing the package globally. They provide cross-platform implementations of common shell aliases and functions.

## File Structure

Each script follows the cross-platform pattern with these exports:

```javascript
module.exports = {
  main: do_scriptname,           // Entry point (alias)
  do_scriptname,                 // Main dispatcher with platform routing
  do_scriptname_nodejs,          // Pure Node.js implementation
  do_scriptname_macos,           // macOS implementation
  do_scriptname_ubuntu,          // Ubuntu/Debian implementation
  do_scriptname_raspbian,        // Raspberry Pi OS implementation
  do_scriptname_amazon_linux,    // Amazon Linux/RHEL implementation
  do_scriptname_cmd,             // Windows CMD implementation
  do_scriptname_powershell,      // Windows PowerShell implementation
  do_scriptname_gitbash          // Git Bash implementation
};
```

---

## Categories

### Backup & Sync

#### `backup-all`
```bash
backup-all /path/to/backup/destination
```
Backs up multiple user directories (Desktop, Documents, Downloads, Source, etc.) to a timestamped destination folder using rsync. Excludes common development artifacts like node_modules, .git, and cache directories.

#### `backup-source`
```bash
backup-source /path/to/backup/destination
```
Backs up the ~/Source directory to a timestamped destination folder using rsync or robocopy. Useful for creating snapshots of your code repositories.

#### `git-backup`
```bash
git-backup /path/to/backup [git-url]
```
Creates a timestamped zip backup of a git repository (including all branches and history via mirror clone). Skips backup if no changes since last backup.

#### `get-folder`
```bash
get-folder /source/folder [/destination/folder]
```
Copies files from source to destination, skipping files that already exist with the same size. Uses rsync on Unix or robocopy on Windows.

#### `refresh-files`
```bash
refresh-files /source/folder [/target/folder]
```
Updates files in the target directory from the source directory, but only for files that already exist in both locations. Does not add or remove files.

---

### Directory Navigation

#### `d`
```bash
cd $(d)
```
Outputs the path to the Desktop folder (~\/Desktop). Use with `cd $(d)` to navigate there.

#### `p`
```bash
cd $(p)
```
Outputs the path to the projects folder (~\/projects). Use with `cd $(p)` to navigate there.

#### `mkd`
```bash
mkd new-folder/nested/path
```
Creates a directory (including parent directories) and outputs the path. Equivalent to `mkdir -p`.

---

### Docker

#### `dp`
```bash
dp
```
Lists running Docker containers in a formatted table showing container ID, name, and port mappings. Equivalent to `docker ps --format`.

#### `docker-clean`
```bash
docker-clean
docker-clean --force
```
Removes ALL Docker containers, images, and volumes after prompting for confirmation. Use `--force` to skip the confirmation prompt.

---

### File Listing & Information

#### `ll`
```bash
ll
ll /path/to/directory
```
Displays a detailed directory listing showing permissions, size, modification date, and names. Equivalent to `ls -l`.

#### `count`
```bash
count
count /path/to/directory
```
Displays the count of files and folders in the current or specified directory.

#### `count-files`
```bash
count-files
count-files /path/to/directory
```
Counts and displays the number of files (not directories) in the current or specified directory.

#### `count-folders`
```bash
count-folders
count-folders /path/to/directory
```
Counts and displays the number of subdirectories in the current or specified directory.

#### `packages`
```bash
packages
packages /path/to/search
```
Finds all package.json files recursively and lists them sorted by modification date (oldest first). Excludes node_modules directories.

---

### File Operations

#### `delete-files`
```bash
delete-files
delete-files "*.log"
delete-files "*.tmp"
```
Recursively deletes files matching a pattern. Defaults to `*.DS_Store` if no pattern specified. Shows files being deleted and total space freed.

#### `org-by-date`
```bash
org-by-date
org-by-date /path/to/directory
```
Organizes files with dates in their names (YYYY-MM-DD format) into a nested folder structure (YYYY/MM/DD/).

#### `rename-files-with-date`
```bash
rename-files-with-date
rename-files-with-date /path/to/directory
```
Renames files that have embedded dates and times in their names to a standardized format (YYYY-MM-DD HH.MM.SS.ext).

#### `remove-smaller-files`
```bash
remove-smaller-files /comparison/directory
```
Compares files between the current directory and a comparison directory. For files that exist in both, removes the smaller version.

#### `rm-safe`
```bash
rm-safe file.txt
rm-safe -rf directory/
```
A safer wrapper around rm that blocks dangerous operations like deleting root directories or system folders.

#### `clean-dev`
```bash
clean-dev
clean-dev /path/to/search
```
Recursively finds and removes `node_modules` and `bower_components` directories to free disk space.

---

### Git

#### `clone`
```bash
clone https://github.com/user/repo.git
clone git@github.com:user/repo.git my-folder
```
Clones a git repository and automatically installs dependencies if package.json is found. Detects yarn, pnpm, or npm based on lock files.

#### `git-clone`
```bash
git-clone /source/repo [/destination]
```
Copies files from a source directory (typically a repo) to destination, excluding .git, README.md, LICENSE, and node_modules. Useful for using repos as templates.

#### `git-push`
```bash
git-push "commit message"
```
Stages all changes, commits with the provided message, and pushes to the current branch. A one-liner for the common add/commit/push workflow.

#### `git-pup`
```bash
git-pup
```
Pulls the latest changes and updates all git submodules. Equivalent to `git pull && git submodule init && git submodule update`.

#### `vpush`
```bash
vpush
vpush --sign
```
Commits with the version from package.json as the commit message and pushes. Use `--sign` for GPG-signed commits.

#### `fetch-github-repos`
```bash
fetch-github-repos organization-name
fetch-github-repos organization-name /target/directory
```
Clones all repositories from a GitHub organization into the specified directory. Skips repos that already exist.

#### `set-git-public`
```bash
set-git-public
```
Sets the git user.email and user.name for the current repository to your "public" identity from ~/.devutils config.

---

### Media & Downloads

#### `get-video`
```bash
get-video https://youtube.com/watch?v=VIDEO_ID
```
Downloads a video from YouTube or other supported sites using yt-dlp in MP4 format.

#### `get-tunes`
```bash
get-tunes https://youtube.com/watch?v=VIDEO_ID
get-tunes https://youtube.com/watch?v=VIDEO_ID audio-only
get-tunes https://youtube.com/watch?v=VIDEO_ID video-only
```
Downloads audio and/or video from a URL using yt-dlp. Supports audio-only (MP3) or video-only (MP4) modes.

#### `get-channel`
```bash
get-channel channel-name
get-channel @HandleName
```
Downloads all videos from a YouTube channel using yt-dlp with date-prefixed filenames.

#### `get-course`
```bash
get-course course-name username password
```
Downloads a Pluralsight course using yt-dlp with authentication and rate limiting.

#### `resize-image`
```bash
resize-image photo.jpg
resize-image photo.jpg 30%
resize-image photo.jpg 800x600
```
Resizes an image using ImageMagick with high-quality settings. Outputs to a file prefixed with underscore.

#### `datauri`
```bash
datauri image.png
datauri document.pdf
```
Converts a file to a base64 data URI string suitable for embedding in HTML/CSS.

---

### Network

#### `local-ip`
```bash
local-ip
local-ip --all
```
Displays the primary local/private IP address. Use `--all` to show all network interfaces.

#### `ips`
```bash
ips
ips 192.168.0.0 24
ips --ip-only
```
Scans the local network for active IP addresses using nmap. Configurable network range and output format.

#### `ports`
```bash
ports
ports 3000
ports --listening
ports --tcp
```
Lists open network ports and the processes using them. Can filter by port number or protocol.

#### `ccurl`
```bash
ccurl https://api.example.com/endpoint
```
Fetches a URL with Accept: application/json header and pretty-prints the JSON response. No curl or jq required.

#### `clear-dns-cache`
```bash
clear-dns-cache
```
Flushes the DNS cache on the current system. Works across macOS, Linux, and Windows.

---

### Node.js & npm

#### `npmi`
```bash
npmi
```
Removes node_modules and reinstalls dependencies. Detects yarn, pnpm, or npm from lock files.

#### `ncu-update-all`
```bash
ncu-update-all
ncu-update-all /path/to/search
```
Finds all package.json files recursively and updates their dependencies to latest versions using npm-check-updates.

#### `get-dependencies`
```bash
get-dependencies package.json
get-dependencies package.json dev
get-dependencies package.json peer
```
Lists dependency names from a package.json file. Supports dependencies, devDependencies, peerDependencies, etc.

#### `install-dependencies-from`
```bash
install-dependencies-from /path/to/package.json
install-dependencies-from /path/to/package.json dev
```
Installs dependencies from another package.json into the current project at their latest versions.

#### `y`
```bash
y
y add package-name
y install
```
Shortcut for the yarn package manager. Passes all arguments through to yarn.

---

### Package Managers (Homebrew)

#### `brewi`
```bash
brewi package-name
brewi wget curl jq
```
Cross-platform package install. Uses brew on macOS, apt on Ubuntu, dnf/yum on Amazon Linux, choco on Windows.

#### `brewr`
```bash
brewr package-name
```
Cross-platform package uninstall. Uses the appropriate package manager for each platform.

#### `brews`
```bash
brews search-term
```
Cross-platform package search. Searches the appropriate package manager for each platform.

#### `brewu`
```bash
brewu
```
Updates Homebrew and upgrades all installed packages. On macOS: `brew update && brew upgrade && brew cleanup`.

#### `brewd`
```bash
brewd
```
Runs Homebrew diagnostics (`brew doctor`). On non-Homebrew platforms, provides equivalent diagnostic commands.

---

### Search

#### `s`
```bash
s "search pattern"
s function_name
s "async.*await"
```
Recursively searches for text in the current directory using grep. Excludes .git, node_modules, and other common directories. Case-insensitive.

#### `h`
```bash
h "search term"
h git
```
Searches your shell history for commands matching the pattern. Searches ~/.bash_history or ~/.zsh_history.

---

### Server & DevOps

#### `certbot-init`
```bash
certbot-init -d example.com -e admin@example.com
certbot-init -d example.com -d www.example.com -e admin@example.com
```
Installs SSL certificates using certbot for nginx. Handles certbot installation and nginx integration.

#### `certbot-crontab-init`
```bash
certbot-crontab-init
```
Sets up a cron job for automatic SSL certificate renewal (runs daily at noon).

#### `nginx-init`
```bash
nginx-init -d example.com -h http://localhost:3000 -f myapp.conf
nginx-init -d example.com -h http://localhost:3000 -f myapp.conf --api --link
```
Creates nginx reverse proxy configuration files from templates. Supports API mode with CORS headers.

#### `tpo`
```bash
tpo
tpo -var="key=value"
```
Runs `terraform plan -out="tfplan"` to create a Terraform execution plan.

#### `tpa`
```bash
tpa
tpa -auto-approve
```
Runs `terraform apply "tfplan"` to apply a previously created Terraform plan.

---

### System

#### `afk`
```bash
afk
```
Locks the screen or puts the system to sleep. Uses the appropriate method for each platform (osascript on macOS, loginctl on Linux, rundll32 on Windows).

#### `u`
```bash
u
```
Updates the operating system and all installed packages. Runs softwareupdate + brew on macOS, apt update/upgrade on Ubuntu, etc.

#### `c`
```bash
c
```
Clears the terminal screen. Works on all platforms using ANSI escape sequences.

#### `q`
```bash
q
```
Displays instructions for creating an `exit` alias since Node.js scripts cannot exit the parent shell.

#### `e`
```bash
e filename.txt
```
Opens a file in vim. Shortcut for `vim --`.

#### `m`
```bash
m command-name
```
Displays the manual page for a command. Shortcut for `man`.

#### `o`
```bash
o
o file.pdf
o /path/to/folder
```
Opens a file or folder with the default application. Uses `open` on macOS, `xdg-open` on Linux, `start` on Windows.

#### `path`
```bash
path
```
Displays each directory in the PATH environment variable on a separate line.

#### `iso`
```bash
iso
iso UTC
iso America/New_York
```
Outputs the current date/time in ISO 8601 format with timezone. Defaults to America/Los_Angeles.

#### `empty-trash`
```bash
empty-trash
empty-trash --verbose
```
Empties the trash/recycle bin and clears system logs to free disk space.

#### `ch`
```bash
ch
```
Clears shell history files (~/.bash_history, ~/.zsh_history, etc.).

---

### System Preferences

#### `show-hidden-files`
```bash
show-hidden-files
```
Configures the file manager to show hidden files (dotfiles).

#### `hide-hidden-files`
```bash
hide-hidden-files
```
Configures the file manager to hide hidden files (dotfiles).

#### `show-desktop-icons`
```bash
show-desktop-icons
```
Enables desktop icons in the file manager/desktop environment.

#### `hide-desktop-icons`
```bash
hide-desktop-icons
```
Hides desktop icons for a cleaner desktop appearance.

---

### Text Processing

#### `map`
```bash
echo -e "file1.txt\nfile2.txt" | map cat
ls *.js | map wc -l
```
Executes a command for each line of input (like xargs -n1). Reads from stdin and runs the specified command with each line as an argument.

#### `evm`
```bash
evm file.txt
evm file1.txt file2.txt 3
```
Executes a vim macro (from register q) on one or more files. Optional count parameter runs the macro multiple times.

---

### Utilities

#### `killni`
```bash
killni
```
Kills all Node.js processes running with debug flags (--inspect, --inspect-brk, --debug, --debug-brk).

#### `claude-danger`
```bash
claude-danger
claude-danger "prompt text"
```
Launches Claude CLI with the `--dangerously-skip-permissions` flag for automated workflows.

---

## Registration

Scripts are registered as global commands in `package.json`:

```json
{
  "bin": {
    "afk": "./src/scripts/afk.js",
    "clone": "./src/scripts/clone.js",
    "ll": "./src/scripts/ll.js"
  }
}
```

## Related

- **Commands** (`../commands/`) — Multi-word CLI operations (`dev configure`, etc.)
- **Utils** (`../utils/`) — Internal shared utilities
- **STATUS.md** — Migration status for all scripts

## Documentation

See [ai-docs/LOCAL_EXAMPLE_ENVIRONMENT.md](../../ai-docs/LOCAL_EXAMPLE_ENVIRONMENT.md) for additional reference.
