# Installer Testing Status

This document tracks the testing status of all installer scripts in `src/installs/`.

**Last Updated:** 2026-01-07

## Summary

| Metric | Count |
|--------|-------|
| **Technologies Tested** | 44 |
| **All Testable Platforms Passed** | 44 |
| **Fixes Applied During Testing** | 14 |
| **Technologies Not Testable (Docker)** | 41 |

## Testing Infrastructure

### Platforms Tested via Docker

| Platform | Dockerfile | Package Manager |
|----------|------------|-----------------|
| Ubuntu 22.04 | `testing/Dockerfile.ubuntu` | APT |
| Debian 12 | `testing/Dockerfile.debian` | APT |
| Amazon Linux 2023 | `testing/Dockerfile.amazonlinux` | DNF |
| Fedora 39 | `testing/Dockerfile.fedora` | DNF |

### Platforms NOT Testable (No Docker Support)

| Platform | Reason |
|----------|--------|
| macOS | Cannot run macOS in Docker containers |
| Windows | Cannot run Windows in Linux Docker containers |
| Git Bash | Windows-specific environment |
| Raspberry Pi OS | No Dockerfile in testing infrastructure |

## Technologies Successfully Tested (Ready)

All 44 technologies below have been tested on all applicable Docker platforms and marked as `"status": "ready"` in `installers.json`.

| # | Technology | File | Tested Platforms | Fixes Applied |
|---|------------|------|------------------|---------------|
| 1 | AtomicParsley | `atomicparsley.js` | Ubuntu, Debian, Amazon Linux, Fedora | None |
| 2 | AWS CLI | `aws-cli.js` | Ubuntu, Debian, Amazon Linux, Fedora | None |
| 3 | Bash Completion 2 | `bash-completion.js` | Ubuntu, Debian, Amazon Linux, Fedora | None |
| 4 | Bash | `bash.js` | Ubuntu, Debian, Amazon Linux, Fedora | None |
| 5 | build-essential | `build-essential.js` | Ubuntu, Debian, Amazon Linux, Fedora | None |
| 6 | ca-certificates | `ca-certificates.js` | Ubuntu, Debian, Amazon Linux, Fedora | Fixed RHEL cert bundle check |
| 7 | Claude Code | `claude-code.js` | Ubuntu, Debian, Amazon Linux, Fedora | None |
| 8 | cURL | `curl.js` | Ubuntu, Debian, Amazon Linux, Fedora | None |
| 9 | Development Tools | `development-tools.js` | Ubuntu, Debian, Amazon Linux, Fedora | None |
| 10 | Docker | `docker.js` | Ubuntu, Debian, Amazon Linux, Fedora | Fixed Debian repo URL |
| 11 | FFmpeg | `ffmpeg.js` | Ubuntu, Debian, Amazon Linux, Fedora | Fixed xz dependency |
| 12 | file | `file.js` | Ubuntu, Debian, Amazon Linux, Fedora | None |
| 13 | Gemini CLI | `gemini-cli.js` | Ubuntu, Debian, Amazon Linux, Fedora | None |
| 14 | Git | `git.js` | Ubuntu, Debian, Amazon Linux, Fedora | None |
| 15 | gitego | `gitego.js` | Ubuntu, Debian, Amazon Linux, Fedora | Fixed wget dependency |
| 16 | Go | `go.js` | Ubuntu, Debian, Amazon Linux, Fedora | Fixed idempotency detection |
| 17 | GPG | `gpg.js` | Ubuntu, Debian, Amazon Linux, Fedora | None |
| 18 | Homebrew | `homebrew.js` | Ubuntu, Debian, Amazon Linux, Fedora | None |
| 19 | jq | `jq.js` | Ubuntu, Debian, Amazon Linux, Fedora | None |
| 20 | LaTeX | `latex.js` | Ubuntu, Debian, Amazon Linux, Fedora | Replaced texlive-full with curated packages |
| 21 | LFTP | `lftp.js` | Ubuntu, Debian, Amazon Linux, Fedora | None |
| 22 | lsb-release | `lsb-release.js` | Ubuntu, Debian | None |
| 23 | Node.js | `node.js` | Ubuntu, Debian, Amazon Linux, Fedora | Fixed Fedora symlink handling |
| 24 | nvm | `nvm.js` | Ubuntu, Debian, Amazon Linux, Fedora | None |
| 25 | OpenSSH | `openssh.js` | Ubuntu, Debian, Amazon Linux, Fedora | None |
| 26 | Pandoc | `pandoc.js` | Ubuntu, Debian, Amazon Linux, Fedora | None |
| 27 | pinentry | `pinentry.js` | Ubuntu, Debian, Amazon Linux, Fedora | None |
| 28 | procps | `procps.js` | Ubuntu, Debian, Amazon Linux, Fedora | None |
| 29 | sfnt2woff | `sfnt2woff.js` | Ubuntu, Debian, Amazon Linux, Fedora | Fixed APT DEBIAN_FRONTEND |
| 30 | ShellCheck | `shellcheck.js` | Ubuntu, Debian, Amazon Linux, Fedora | None |
| 31 | software-properties-common | `software-properties-common.js` | Ubuntu, Debian | None |
| 32 | Tailscale | `tailscale.js` | Ubuntu, Debian, Amazon Linux, Fedora | None |
| 33 | tar | `tar.js` | Ubuntu, Debian, Amazon Linux, Fedora | None |
| 34 | Terraform | `terraform.js` | Ubuntu, Debian, Amazon Linux, Fedora | Fixed Fedora install method |
| 35 | tmux | `tmux.js` | Ubuntu, Debian, Amazon Linux, Fedora | None |
| 36 | Tree | `tree.js` | Ubuntu, Debian, Amazon Linux, Fedora | None |
| 37 | unzip | `unzip.js` | Ubuntu, Debian, Amazon Linux, Fedora | None |
| 38 | Vim | `vim.js` | Ubuntu, Debian, Amazon Linux, Fedora | None |
| 39 | wget | `wget.js` | Ubuntu, Debian, Amazon Linux, Fedora | None |
| 40 | woff2 | `woff2.js` | Ubuntu, Debian, Amazon Linux, Fedora | Fixed version detection & binary install |
| 41 | Yarn | `yarn.js` | Ubuntu, Debian, Amazon Linux, Fedora | None |
| 42 | yq | `yq.js` | Ubuntu, Debian, Amazon Linux, Fedora | Fixed Snap fallback to binary |
| 43 | yt-dlp | `yt-dlp.js` | Ubuntu, Debian, Amazon Linux, Fedora | None |
| 44 | yum-utils | `yum-utils.js` | Amazon Linux, Fedora | Fixed idempotency detection |

## Fixes Applied During Testing

| Technology | Platform | Issue | Fix |
|------------|----------|-------|-----|
| ca-certificates | Amazon Linux/Fedora | Checking symlink instead of actual bundle | Check `/etc/pki/ca-trust/extracted/pem/tls-ca-bundle.pem` |
| Docker | Debian | Using Ubuntu repo URL for Debian | Added platform detection for Debian vs Ubuntu |
| FFmpeg | Amazon Linux/Fedora | Missing xz utilities for .tar.xz extraction | Auto-install xz before extraction |
| gitego | Ubuntu/Debian | Missing wget for Go download | Auto-install wget before Go download |
| Go | All | Idempotency check failed in same session | Check `/usr/local/go/bin/go` directly when not in PATH |
| LaTeX | Ubuntu/Debian | ConTeXt package hung during format build | Use curated package list without ConTeXt |
| Node.js | Fedora | alternatives system not used on Fedora | Use symlink approach for Fedora/RHEL |
| sfnt2woff | All APT platforms | Interactive prompts in Docker | Added `DEBIAN_FRONTEND=noninteractive` to APT utility |
| Terraform | Fedora | YUM repo version mismatch (no RHEL 39) | Created dedicated `install_fedora()` with binary download |
| woff2 | Amazon Linux/Fedora | Version detection failed; binaries not installed | Fixed version check to return "installed"; manual binary copy after build |
| yq | Ubuntu/Debian | Snap unavailable in Docker containers | Fall back to direct binary download when Snap unavailable |
| yum-utils | Amazon Linux/Fedora | rpm -q exit code check failed | Parse stdout instead of checking exit code |

## Technologies Not Testable in Docker (41)

These technologies remain as `"status": "test-pending"` because they cannot be tested in Docker containers.

### macOS/Windows Only (No Linux Support)

| Technology | File | Environments | Reason |
|------------|------|--------------|--------|
| Adobe Creative Cloud | `adobe-creative-cloud.js` | macos, windows, wsl, gitbash | No Linux support |
| AppCleaner | `appcleaner.js` | macos, windows | No Linux support |
| Camtasia | `camtasia.js` | macos, windows, wsl, gitbash | No Linux support |
| Chocolatey | `chocolatey.js` | windows, gitbash | Windows package manager |
| Elmedia Player | `elmedia-player.js` | macos | macOS only |
| Microsoft Office 365 | `microsoft-office.js` | macos, wsl, windows, gitbash | No Linux support |
| Safari Technology Preview | `safari-tech-preview.js` | macos | macOS only |
| Snagit | `snagit.js` | macos, wsl, windows, gitbash | No Linux support |
| Superwhisper | `superwhisper.js` | macos, wsl, windows, gitbash | No Linux support |
| winpty | `winpty.js` | windows, gitbash | Windows only |
| WSL 2 | `wsl.js` | windows, gitbash | Windows only |
| Xcode CLT | `xcode-clt.js` | macos | macOS only |
| Xcode | `xcode.js` | macos | macOS only |

### Desktop GUI Applications (Require Display Server)

These have Linux support but are marked `"desktop": true` and require a graphical environment not available in Docker containers.

| Technology | File |
|------------|------|
| Balena Etcher | `balena-etcher.js` |
| Bambu Studio | `bambu-studio.js` |
| Beyond Compare | `beyond-compare.js` |
| Caffeine | `caffeine.js` |
| ChatGPT | `chatgpt.js` |
| Google Chrome Canary | `chrome-canary.js` |
| Chromium | `chromium.js` |
| Cursor | `cursor.js` |
| DbSchema | `dbschema.js` |
| Draw.IO | `drawio.js` |
| Google Chrome | `google-chrome.js` |
| ImageOptim | `imageoptim.js` |
| Keyboard Maestro | `keyboard-maestro.js` |
| Messenger | `messenger.js` |
| Microsoft Teams | `microsoft-teams.js` |
| Nord Pass | `nordpass.js` |
| Pngyu | `pngyu.js` |
| Postman | `postman.js` |
| Slack | `slack.js` |
| Spotify | `spotify.js` |
| Studio 3T | `studio-3t.js` |
| Sublime Text | `sublime-text.js` |
| Termius | `termius.js` |
| Tidal | `tidal.js` |
| VLC | `vlc.js` |
| Visual Studio Code | `vscode.js` |
| WhatsApp | `whatsapp.js` |
| Zoom | `zoom.js` |

## Manual Testing Required

The following platforms and technologies require manual testing:

### Platforms
- **macOS**: Test all installers with `install_macos()` functions
- **Windows**: Test all installers with `install_windows()` and `install_gitbash()` functions
- **Raspberry Pi OS**: Test all installers with `install_raspbian()` functions

### Desktop Applications
All 28 desktop GUI applications listed above should be manually tested on systems with display servers.

## Running Tests

To run the Docker test harnesses:

```bash
# Run all tests on all platforms
./testing/test.sh

# Run tests on specific platform
./testing/test.sh ubuntu
./testing/test.sh debian
./testing/test.sh amazonlinux
./testing/test.sh fedora

# Open interactive shell for debugging
./testing/test.sh --shell ubuntu
```

## Status Definitions

| Status | Meaning |
|--------|---------|
| `pending` | Not yet processed - awaiting documentation and installer |
| `test-pending` | Documentation and installer complete - awaiting testing |
| `ready` | Fully tested on all Docker-testable platforms and production-ready |
