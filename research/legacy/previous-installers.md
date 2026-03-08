# Previous Installers Inventory

Catalog of all installer scripts from the v0.0.18 codebase, now located in `_rebuild/src/installs/`. Data sourced from `installers.json` and the individual `.js` files in that directory.

**Total: 93 installers** | All marked `status: "ready"` | All follow the same module pattern

---

## Summary by Environment Support

| Environment | Count |
|---|---|
| macos | 83 |
| ubuntu | 73 |
| debian | 68 |
| windows | 65 |
| wsl | 67 |
| gitbash | 59 |
| raspbian | 56 |
| amazon_linux | 60 |
| rhel | 51 |
| fedora | 57 |
| ubuntu-desktop | 29 |

---

## All Installers

Each entry shows: **Name** | Filename | Desktop flag | Environments | Dependencies | Notes

### AI & Code Assistants

| Name | File | Desktop | Environments | Dependencies | Notes |
|---|---|---|---|---|---|
| ChatGPT | `chatgpt.js` | yes | macos, ubuntu, ubuntu-desktop, debian, wsl, windows, gitbash | homebrew.js | |
| Claude Code | `claude-code.js` | no | macos, ubuntu, debian, wsl, raspbian, amazon_linux, rhel, fedora, windows, gitbash | node.js | |
| Gemini CLI | `gemini-cli.js` | no | macos, ubuntu, debian, wsl, raspbian, amazon_linux, rhel, fedora, windows, gitbash | node.js | |
| Google Antigravity | `google-antigravity.js` | yes | macos, ubuntu-desktop, windows | homebrew.js, chocolatey.js | Desktop IDE only - cannot be tested in headless Docker environments. Requires manual testing. |
| Kiro | `kiro.js` | yes | macos, windows, ubuntu-desktop | homebrew.js, curl.js | Desktop IDE only. Uses official install script (https://cli.kiro.dev/install). Known issue: Kiro installer may detect devutils-cli's 'q' command as conflicting with Amazon Q CLI. |

### Browsers

| Name | File | Desktop | Environments | Dependencies | Notes |
|---|---|---|---|---|---|
| Brave Browser | `brave-browser.js` | yes | macos, ubuntu, ubuntu-desktop, debian, amazon_linux, rhel, fedora, windows | homebrew.js, chocolatey.js, curl.js | |
| Chromium | `chromium.js` | yes | macos, ubuntu, ubuntu-desktop, debian, wsl, raspbian, amazon_linux, rhel, fedora, windows, gitbash | homebrew.js, chocolatey.js | |
| Comet Browser | `comet-browser.js` | yes | macos, windows | homebrew.js, chocolatey.js | macOS/Windows only. Linux is not supported by Comet Browser. |
| Google Chrome | `google-chrome.js` | yes | macos, ubuntu, ubuntu-desktop, debian, wsl, amazon_linux, rhel, fedora, windows, gitbash | homebrew.js, chocolatey.js, wget.js | |
| Google Chrome Canary | `chrome-canary.js` | yes | macos, windows, gitbash | homebrew.js, chocolatey.js | |
| Safari Technology Preview | `safari-tech-preview.js` | yes | macos | homebrew.js | macOS only. |

### Build & Compilation Tools

| Name | File | Desktop | Environments | Dependencies | Notes |
|---|---|---|---|---|---|
| build-essential | `build-essential.js` | no | macos, ubuntu, debian, wsl, raspbian, amazon_linux, rhel, fedora, windows | | |
| Development Tools | `development-tools.js` | no | macos, ubuntu, debian, wsl, raspbian, amazon_linux, rhel, fedora, windows | | |
| Xcode | `xcode.js` | yes | macos | xcode-clt.js | macOS only. |
| Xcode CLT | `xcode-clt.js` | no | macos | | macOS only. |

### Cloud & Infrastructure

| Name | File | Desktop | Environments | Dependencies | Notes |
|---|---|---|---|---|---|
| AWS CLI | `aws-cli.js` | no | macos, ubuntu, debian, raspbian, amazon_linux, rhel, fedora, wsl, windows | curl.js, homebrew.js, chocolatey.js, unzip.js | |
| Terraform | `terraform.js` | no | macos, ubuntu, debian, wsl, raspbian, amazon_linux, rhel, fedora, windows, gitbash | homebrew.js, chocolatey.js, wget.js, gpg.js, software-properties-common.js, unzip.js, yum-utils.js, lsb-release.js, ca-certificates.js | |
| tfenv | `tfenv.js` | no | macos, ubuntu, debian, wsl, raspbian, amazon_linux, rhel, fedora | homebrew.js, git.js, curl.js, unzip.js | |

### Containers & Virtualization

| Name | File | Desktop | Environments | Dependencies | Notes |
|---|---|---|---|---|---|
| Docker | `docker.js` | no | macos, ubuntu, debian, wsl, raspbian, amazon_linux, rhel, fedora, windows, gitbash | curl.js, ca-certificates.js, homebrew.js, chocolatey.js, wsl.js | |
| Parallels Desktop | `parallels-desktop.js` | yes | macos | homebrew.js | macOS only. |

### Database Tools

| Name | File | Desktop | Environments | Dependencies | Notes |
|---|---|---|---|---|---|
| DBeaver Community | `dbeaver.js` | yes | macos, ubuntu-desktop, windows | homebrew.js, chocolatey.js | Desktop database tool. No ARM (Raspberry Pi) support. |
| DbSchema | `dbschema.js` | yes | macos, ubuntu, ubuntu-desktop, debian, wsl, raspbian, amazon_linux, rhel, fedora, windows, gitbash | homebrew.js, chocolatey.js | |
| Studio 3T | `studio-3t.js` | yes | macos, ubuntu, ubuntu-desktop, debian, wsl, amazon_linux, rhel, fedora, windows, gitbash | homebrew.js, chocolatey.js | |

### Document & Publishing

| Name | File | Desktop | Environments | Dependencies | Notes |
|---|---|---|---|---|---|
| LaTeX | `latex.js` | no | macos, ubuntu, debian, wsl, raspbian, amazon_linux, fedora, rhel, windows, gitbash | homebrew.js, chocolatey.js | |
| Pandoc | `pandoc.js` | no | macos, ubuntu, debian, wsl, raspbian, amazon_linux, fedora, rhel, windows, gitbash | homebrew.js, chocolatey.js | |

### Editors & IDEs

| Name | File | Desktop | Environments | Dependencies | Notes |
|---|---|---|---|---|---|
| Cursor | `cursor.js` | yes | macos, ubuntu, ubuntu-desktop, debian, wsl, raspbian, amazon_linux, rhel, fedora, windows, gitbash | homebrew.js, chocolatey.js | |
| Sublime Text | `sublime-text.js` | yes | macos, ubuntu, ubuntu-desktop, debian, wsl, raspbian, amazon_linux, rhel, fedora, windows, gitbash | homebrew.js, chocolatey.js | |
| Vim | `vim.js` | no | macos, ubuntu, debian, wsl, raspbian, amazon_linux, fedora, rhel, windows, gitbash | homebrew.js, chocolatey.js | |
| Visual Studio Code | `vscode.js` | yes | macos, ubuntu, ubuntu-desktop, debian, wsl, raspbian, amazon_linux, fedora, rhel, windows, gitbash | gpg.js, wget.js, apt-transport-https.js, homebrew.js, chocolatey.js, winpty.js | |

### File & System Utilities

| Name | File | Desktop | Environments | Dependencies | Notes |
|---|---|---|---|---|---|
| cURL | `curl.js` | no | macos, ubuntu, debian, wsl, raspbian, amazon_linux, fedora, rhel, windows, gitbash | homebrew.js, chocolatey.js | |
| file | `file.js` | no | macos, ubuntu, debian, wsl, raspbian, amazon_linux, fedora, rhel, windows, gitbash | | |
| jq | `jq.js` | no | macos, ubuntu, debian, wsl, raspbian, amazon_linux, fedora, rhel, windows, gitbash | homebrew.js, chocolatey.js | |
| LFTP | `lftp.js` | no | macos, ubuntu, debian, wsl, raspbian, amazon_linux, fedora, rhel, windows | homebrew.js, chocolatey.js | |
| ShellCheck | `shellcheck.js` | no | macos, ubuntu, debian, wsl, raspbian, amazon_linux, rhel, fedora, windows, gitbash | homebrew.js, chocolatey.js | |
| tar | `tar.js` | no | macos, ubuntu, debian, wsl, raspbian, amazon_linux, fedora, rhel, windows, gitbash | | |
| Tree | `tree.js` | no | macos, ubuntu, debian, wsl, raspbian, amazon_linux, fedora, rhel, windows, gitbash | homebrew.js, chocolatey.js | |
| unzip | `unzip.js` | no | macos, ubuntu, debian, wsl, raspbian, amazon_linux, fedora, rhel, windows, gitbash | | |
| wget | `wget.js` | no | macos, ubuntu, debian, wsl, raspbian, amazon_linux, fedora, rhel, windows, gitbash | homebrew.js, chocolatey.js | |
| yq | `yq.js` | no | macos, ubuntu, debian, wsl, raspbian, amazon_linux, fedora, rhel, windows, gitbash | homebrew.js, chocolatey.js | |

### Font Tools

| Name | File | Desktop | Environments | Dependencies | Notes |
|---|---|---|---|---|---|
| sfnt2woff | `sfnt2woff.js` | no | macos, ubuntu, debian, wsl, raspbian, amazon_linux, rhel, fedora, windows, gitbash | homebrew.js | |
| woff2 | `woff2.js` | no | macos, ubuntu, debian, wsl, raspbian, amazon_linux, fedora, rhel | homebrew.js | |

### Git & Version Control

| Name | File | Desktop | Environments | Dependencies | Notes |
|---|---|---|---|---|---|
| Git | `git.js` | no | macos, ubuntu, debian, wsl, raspbian, amazon_linux, fedora, rhel, windows, gitbash | homebrew.js, chocolatey.js, software-properties-common.js | |
| gitego | `gitego.js` | no | macos, ubuntu, debian, wsl, raspbian, amazon_linux, fedora, rhel, windows, gitbash | node.js | |

### Image & Media Tools

| Name | File | Desktop | Environments | Dependencies | Notes |
|---|---|---|---|---|---|
| AtomicParsley | `atomicparsley.js` | no | macos, ubuntu, debian, wsl, raspbian, amazon_linux, rhel, fedora, windows, gitbash | homebrew.js, chocolatey.js | |
| FFmpeg | `ffmpeg.js` | no | macos, ubuntu, debian, wsl, raspbian, amazon_linux, rhel, fedora, windows, gitbash | xcode-clt.js, homebrew.js, chocolatey.js, curl.js, wget.js, tar.js, unzip.js | |
| ImageOptim | `imageoptim.js` | yes | macos, ubuntu, ubuntu-desktop, debian, wsl, raspbian, amazon_linux, rhel, fedora, windows, gitbash | homebrew.js | |
| Pngyu | `pngyu.js` | yes | macos, ubuntu, ubuntu-desktop, debian, wsl, raspbian, amazon_linux, rhel, fedora, windows, gitbash | homebrew.js | |
| yt-dlp | `yt-dlp.js` | no | macos, ubuntu, debian, wsl, raspbian, amazon_linux, fedora, rhel, windows, gitbash | homebrew.js, chocolatey.js | |

### Languages & Runtimes

| Name | File | Desktop | Environments | Dependencies | Notes |
|---|---|---|---|---|---|
| Go | `go.js` | no | macos, ubuntu, debian, wsl, raspbian, amazon_linux, rhel, fedora, windows, gitbash | homebrew.js, chocolatey.js | |
| Node.js | `node.js` | no | macos, ubuntu, debian, wsl, raspbian, amazon_linux, fedora, rhel, windows, gitbash | curl.js, ca-certificates.js, gpg.js, homebrew.js, chocolatey.js | |
| nvm | `nvm.js` | no | macos, ubuntu, debian, wsl, raspbian, amazon_linux, fedora, rhel, windows, gitbash | homebrew.js, chocolatey.js, curl.js, git.js, winpty.js | |
| Yarn | `yarn.js` | no | macos, ubuntu, debian, wsl, raspbian, amazon_linux, fedora, rhel, windows, gitbash | curl.js, ca-certificates.js, gpg.js, homebrew.js, chocolatey.js, winpty.js | |

### Linux System Packages

| Name | File | Desktop | Environments | Dependencies | Notes |
|---|---|---|---|---|---|
| apt-transport-https | `apt-transport-https.js` | no | ubuntu, debian, wsl, raspbian | | |
| ca-certificates | `ca-certificates.js` | no | macos, ubuntu, debian, wsl, raspbian, amazon_linux, fedora, rhel, windows, gitbash | | |
| lsb-release | `lsb-release.js` | no | ubuntu, debian, wsl, raspbian | | |
| procps | `procps.js` | no | ubuntu, debian, wsl, raspbian, amazon_linux, fedora, rhel | | |
| software-properties-common | `software-properties-common.js` | no | ubuntu, debian, wsl, raspbian | | |
| yum-utils | `yum-utils.js` | no | amazon_linux, fedora, rhel | | |

### macOS Desktop Apps

| Name | File | Desktop | Environments | Dependencies | Notes |
|---|---|---|---|---|---|
| Adobe Creative Cloud | `adobe-creative-cloud.js` | yes | macos, windows, wsl, gitbash | homebrew.js | macOS/Windows only - cannot be tested in Docker. |
| AppCleaner | `appcleaner.js` | yes | macos, windows | homebrew.js | macOS/Windows only. |
| Elmedia Player | `elmedia-player.js` | yes | macos | homebrew.js | macOS only. |
| Keyboard Maestro | `keyboard-maestro.js` | yes | macos, ubuntu, ubuntu-desktop, debian, wsl, raspbian, windows, gitbash | homebrew.js | |
| Moom | `moom.js` | yes | macos | homebrew.js | macOS only. |

### Media Players & Streaming

| Name | File | Desktop | Environments | Dependencies | Notes |
|---|---|---|---|---|---|
| Spotify | `spotify.js` | yes | macos, ubuntu, ubuntu-desktop, debian, wsl, raspbian, amazon_linux, rhel, fedora, windows, gitbash | homebrew.js, chocolatey.js | |
| Tidal | `tidal.js` | yes | macos, ubuntu, ubuntu-desktop, debian, wsl, amazon_linux, rhel, fedora, windows, gitbash | homebrew.js, chocolatey.js | |
| VLC | `vlc.js` | yes | macos, ubuntu, ubuntu-desktop, debian, wsl, raspbian, amazon_linux, rhel, fedora, windows, gitbash | homebrew.js, chocolatey.js | |

### Messaging & Communication

| Name | File | Desktop | Environments | Dependencies | Notes |
|---|---|---|---|---|---|
| Messenger | `messenger.js` | yes | macos, ubuntu, ubuntu-desktop, debian, wsl, raspbian, amazon_linux, rhel, fedora, windows, gitbash | homebrew.js, chocolatey.js | |
| Microsoft Teams | `microsoft-teams.js` | yes | macos, ubuntu, ubuntu-desktop, debian, wsl, raspbian, amazon_linux, rhel, fedora, windows, gitbash | homebrew.js, chocolatey.js | |
| Slack | `slack.js` | yes | macos, ubuntu, ubuntu-desktop, debian, wsl, amazon_linux, rhel, fedora, windows, gitbash | homebrew.js, chocolatey.js | |
| WhatsApp | `whatsapp.js` | yes | macos, ubuntu, ubuntu-desktop, debian, wsl, amazon_linux, rhel, fedora, windows, gitbash | homebrew.js, chocolatey.js | |
| Zoom | `zoom.js` | yes | macos, ubuntu, ubuntu-desktop, debian, wsl, amazon_linux, fedora, rhel, windows, gitbash | homebrew.js, chocolatey.js | |

### Networking & VPN

| Name | File | Desktop | Environments | Dependencies | Notes |
|---|---|---|---|---|---|
| Cloudflare WARP | `cloudflare-warp.js` | yes | macos, ubuntu, ubuntu-desktop, debian, raspbian, amazon_linux, rhel, fedora, windows | homebrew.js, curl.js, gpg.js | VPN/DNS privacy client. GUI on macOS/Windows. CLI daemon (warp-cli) on Linux. WSL uses Windows host WARP client. |
| NordVPN | `nordvpn.js` | yes | macos, windows, ubuntu-desktop | homebrew.js, chocolatey.js | |
| Tailscale | `tailscale.js` | no | macos, ubuntu, debian, wsl, raspbian, amazon_linux, rhel, fedora, windows, gitbash | homebrew.js, chocolatey.js, curl.js | |

### Package Managers

| Name | File | Desktop | Environments | Dependencies | Notes |
|---|---|---|---|---|---|
| Chocolatey | `chocolatey.js` | no | windows, gitbash | | Windows only. |
| Homebrew | `homebrew.js` | no | macos, ubuntu, debian, wsl, raspbian, amazon_linux, rhel, fedora | curl.js, xcode-clt.js, git.js, build-essential.js, procps.js, file.js, development-tools.js | |

### Productivity & Desktop Apps

| Name | File | Desktop | Environments | Dependencies | Notes |
|---|---|---|---|---|---|
| Balena Etcher | `balena-etcher.js` | yes | macos, ubuntu, ubuntu-desktop, debian, wsl, raspbian, amazon_linux, fedora, rhel, windows, gitbash | homebrew.js, chocolatey.js | |
| Bambu Studio | `bambu-studio.js` | yes | macos, ubuntu, ubuntu-desktop, debian, wsl, raspbian, amazon_linux, fedora, rhel, windows, gitbash | homebrew.js, chocolatey.js | |
| Beyond Compare | `beyond-compare.js` | yes | macos, ubuntu, ubuntu-desktop, debian, wsl, amazon_linux, rhel, fedora, windows, gitbash | homebrew.js, chocolatey.js | |
| Caffeine | `caffeine.js` | yes | macos, ubuntu, ubuntu-desktop, debian, wsl, raspbian, amazon_linux, rhel, fedora, windows, gitbash | homebrew.js | |
| Camtasia | `camtasia.js` | yes | macos, windows, wsl, gitbash | homebrew.js, chocolatey.js | macOS/Windows only. |
| Draw.IO | `drawio.js` | yes | macos, ubuntu, ubuntu-desktop, debian, wsl, raspbian, amazon_linux, rhel, fedora, windows, gitbash | homebrew.js, chocolatey.js | |
| Microsoft Office 365 | `microsoft-office.js` | yes | macos, wsl, windows, gitbash | homebrew.js, chocolatey.js | macOS/Windows only. |
| Snagit | `snagit.js` | yes | macos, wsl, windows, gitbash | homebrew.js, chocolatey.js | macOS/Windows only. |
| Superwhisper | `superwhisper.js` | yes | macos, wsl, windows, gitbash | homebrew.js | macOS/Windows only. |

### Security & Encryption

| Name | File | Desktop | Environments | Dependencies | Notes |
|---|---|---|---|---|---|
| GPG | `gpg.js` | no | macos, ubuntu, debian, wsl, raspbian, amazon_linux, fedora, rhel, windows, gitbash | homebrew.js, chocolatey.js, pinentry.js | |
| Nord Pass | `nordpass.js` | yes | macos, ubuntu, ubuntu-desktop, debian, wsl, windows, gitbash | homebrew.js, chocolatey.js | |
| pinentry | `pinentry.js` | no | macos, ubuntu, debian, wsl, raspbian, amazon_linux, fedora, rhel, windows, gitbash | homebrew.js, chocolatey.js | |

### Shell & Terminal

| Name | File | Desktop | Environments | Dependencies | Notes |
|---|---|---|---|---|---|
| Bash | `bash.js` | no | macos, ubuntu, debian, wsl, raspbian, amazon_linux, rhel, fedora, windows, gitbash | homebrew.js | |
| Bash Completion 2 | `bash-completion.js` | no | macos, ubuntu, debian, wsl, raspbian, amazon_linux, rhel, fedora | homebrew.js | |
| Oh My Zsh | `ohmyzsh.js` | no | macos, ubuntu, debian, wsl, raspbian, amazon_linux, rhel, fedora | zsh.js, curl.js, git.js | |
| OpenSSH | `openssh.js` | no | macos, ubuntu, debian, wsl, raspbian, amazon_linux, fedora, rhel, windows, gitbash | homebrew.js, chocolatey.js | |
| tmux | `tmux.js` | no | macos, ubuntu, debian, wsl, raspbian, amazon_linux, fedora, rhel | homebrew.js, chocolatey.js | |
| Zsh | `zsh.js` | no | macos, ubuntu, debian, wsl, raspbian, amazon_linux, rhel, fedora | homebrew.js | |

### Testing & API Tools

| Name | File | Desktop | Environments | Dependencies | Notes |
|---|---|---|---|---|---|
| Postman | `postman.js` | yes | macos, ubuntu, ubuntu-desktop, debian, wsl, raspbian, windows, gitbash | homebrew.js, chocolatey.js | |
| Termius | `termius.js` | yes | macos, ubuntu, ubuntu-desktop, debian, wsl, amazon_linux, rhel, fedora, windows, gitbash | homebrew.js, chocolatey.js | |

### Windows-Specific

| Name | File | Desktop | Environments | Dependencies | Notes |
|---|---|---|---|---|---|
| winpty | `winpty.js` | no | windows, gitbash | | Windows only. |
| WSL 2 | `wsl.js` | no | windows, gitbash | | Windows only. |

---

## Module Pattern

Every installer exports the same interface:

```javascript
module.exports = {
  install,          // Main entry point - detects OS and calls the right function
  isInstalled,      // Returns boolean - is this tool already present?
  isEligible,       // Returns boolean - can this tool run on this OS/environment?
  install_macos,
  install_ubuntu,
  install_ubuntu_wsl,
  install_raspbian,
  install_amazon_linux,
  install_windows,
  install_gitbash
};
```

Desktop apps set `const REQUIRES_DESKTOP = true` and check it in `isEligible()`.

## Dependency System

Dependencies are declared in `installers.json`, not inside the installer files themselves. Each dependency entry includes:

- `name` — the filename of the dependency installer
- `priority` — installation order (all currently set to `0`)
- `platforms` — optional array limiting which platforms need this dependency

The dependency orchestration system (external to the installer files) handles resolution and ordering.

## Supporting Files

The `_rebuild/src/installs/` directory also contains markdown files with platform-specific notes for select installers:

`chatgpt.md`, `development-tools.md`, `kiro.md`, `messenger.md`, `snagit.md`, `tailscale.md`, `tfenv.md`, `vim.md`, `winpty.md`, `yq.md`

Reference documentation lives in `_rebuild/ai-docs/INSTALLS_REFERENCE.md`.
