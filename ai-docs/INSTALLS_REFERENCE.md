# Installs Reference

Packages and applications installed via devutils-cli install scripts.

**Source:** `src/installs/`

## Legend

| Symbol | Meaning |
|--------|---------|
| :white_check_mark: | Installed |
| :x: | Not installed |
| - | Not applicable |

## Operating Systems

| Column | Description |
|--------|-------------|
| **macOS** | macOS workstation (Homebrew) |
| **Ubuntu** | Ubuntu desktop/server (APT/Snap) |
| **RPi** | Raspberry Pi OS (APT/Snap) |
| **Amazon** | Amazon Linux (DNF/YUM) |
| **Windows** | Windows (Chocolatey/winget) |
| **GitBash** | Git Bash on Windows (Manual/Portable) |

---

## Core Tools

| Package | macOS | Ubuntu | RPi | Amazon | Windows | GitBash | Description |
|---------|:-----:|:------:|:---:|:------:|:-------:|:-------:|-------------|
| Xcode | :white_check_mark: | - | - | - | - | - | Apple development tools and SDKs |
| Xcode Command Line Tools | :white_check_mark: | - | - | - | - | - | Compilers, Git, and CLI dev tools |
| Homebrew | :white_check_mark: | - | - | - | - | - | Package manager for macOS |
| build-essential | - | :white_check_mark: | :white_check_mark: | :white_check_mark: | - | - | GCC, make, and build tools |
| Visual Studio Build Tools | - | - | - | - | :white_check_mark: | - | Windows C++ build tools |

## Shell

| Package | macOS | Ubuntu | RPi | Amazon | Windows | GitBash | Description |
|---------|:-----:|:------:|:---:|:------:|:-------:|:-------:|-------------|
| Bash | :white_check_mark: | :x: | :x: | :x: | - | :white_check_mark: | Updated Bash shell |
| Bash Completion 2 | :white_check_mark: | :x: | :x: | :x: | - | - | Programmable completion for Bash |
| tmux | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | - | - | Terminal multiplexer |
| reattach-to-user-namespace | :white_check_mark: | - | - | - | - | - | macOS clipboard access in tmux |

## Version Control

| Package | macOS | Ubuntu | RPi | Amazon | Windows | GitBash | Description |
|---------|:-----:|:------:|:---:|:------:|:-------:|:-------:|-------------|
| Git | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | Distributed version control |
| gitego | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :x: | :x: | Git productivity tool (Go) |

## JavaScript / Node.js

| Package | macOS | Ubuntu | RPi | Amazon | Windows | GitBash | Description |
|---------|:-----:|:------:|:---:|:------:|:-------:|:-------:|-------------|
| nvm | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | Node Version Manager |
| Node.js 22 | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | JavaScript runtime |
| npm | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | Node package manager |
| Yarn | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | Alternative package manager |

## Programming Languages

| Package | macOS | Ubuntu | RPi | Amazon | Windows | GitBash | Description |
|---------|:-----:|:------:|:---:|:------:|:-------:|:-------:|-------------|
| Go | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :x: | Go programming language |

## Editors

| Package | macOS | Ubuntu | RPi | Amazon | Windows | GitBash | Description |
|---------|:-----:|:------:|:---:|:------:|:-------:|:-------:|-------------|
| Vim | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :x: | :white_check_mark: | Text editor with plugins (minpac) |
| Visual Studio Code | :white_check_mark: | :white_check_mark: | :x: | :x: | :white_check_mark: | - | Code editor with extensions |
| Sublime Text | :white_check_mark: | :x: | :x: | :x: | :white_check_mark: | - | Lightweight text editor |
| Cursor | :white_check_mark: | :x: | :x: | :x: | :white_check_mark: | - | AI-powered code editor |

## AI Tools

| Package | macOS | Ubuntu | RPi | Amazon | Windows | GitBash | Description |
|---------|:-----:|:------:|:---:|:------:|:-------:|:-------:|-------------|
| Claude Code | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | Anthropic CLI for Claude |
| Gemini CLI | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | Google Gemini CLI (npm) |
| ChatGPT | :white_check_mark: | :x: | :x: | :x: | :white_check_mark: | - | OpenAI ChatGPT desktop app |
| GitHub Copilot | :white_check_mark: | :white_check_mark: | :x: | :x: | :white_check_mark: | - | AI pair programmer (VS Code) |
| Superwhisper | :white_check_mark: | - | - | - | - | - | AI voice transcription (macOS only) |

## Containers

| Package | macOS | Ubuntu | RPi | Amazon | Windows | GitBash | Description |
|---------|:-----:|:------:|:---:|:------:|:-------:|:-------:|-------------|
| Docker | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | - | Container runtime |
| Docker Compose | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | - | Multi-container orchestration |
| containerd.io | - | :white_check_mark: | :white_check_mark: | :white_check_mark: | - | - | Container runtime |

## Browsers

| Package | macOS | Ubuntu | RPi | Amazon | Windows | GitBash | Description |
|---------|:-----:|:------:|:---:|:------:|:-------:|:-------:|-------------|
| Google Chrome | :white_check_mark: | :white_check_mark: | :x: | :x: | :white_check_mark: | - | Web browser |
| Google Chrome Canary | :white_check_mark: | :x: | :x: | :x: | :white_check_mark: | - | Chrome dev/beta channel |
| Safari Technology Preview | :white_check_mark: | - | - | - | - | - | Safari beta features |
| Chromium | :x: | :white_check_mark: | :white_check_mark: | :x: | :x: | - | Open-source browser |

## Security / Encryption

| Package | macOS | Ubuntu | RPi | Amazon | Windows | GitBash | Description |
|---------|:-----:|:------:|:---:|:------:|:-------:|:-------:|-------------|
| GPG | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | GNU Privacy Guard |
| pinentry-mac | :white_check_mark: | - | - | - | - | - | GPG PIN entry for macOS |
| pinentry-tty | - | :white_check_mark: | :white_check_mark: | :white_check_mark: | - | - | GPG PIN entry for terminal |
| Nord Pass | :white_check_mark: | :x: | :x: | :x: | :white_check_mark: | - | Password manager |
| Tailscale | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | - | Mesh VPN |

## Cloud / Infrastructure

| Package | macOS | Ubuntu | RPi | Amazon | Windows | GitBash | Description |
|---------|:-----:|:------:|:---:|:------:|:-------:|:-------:|-------------|
| AWS CLI | :white_check_mark: | :white_check_mark: | :x: | :white_check_mark: | :white_check_mark: | :x: | Amazon Web Services CLI |
| Terraform (tfenv) | :white_check_mark: | :white_check_mark: | :x: | :white_check_mark: | :white_check_mark: | :x: | Infrastructure as code |

## Databases

| Package | macOS | Ubuntu | RPi | Amazon | Windows | GitBash | Description |
|---------|:-----:|:------:|:---:|:------:|:-------:|:-------:|-------------|
| DbSchema | :white_check_mark: | :x: | :x: | :x: | :white_check_mark: | - | Database diagram designer |
| Studio 3T | :white_check_mark: | :x: | :x: | :x: | :white_check_mark: | - | MongoDB GUI |

## API / Network Tools

| Package | macOS | Ubuntu | RPi | Amazon | Windows | GitBash | Description |
|---------|:-----:|:------:|:---:|:------:|:-------:|:-------:|-------------|
| Postman | :white_check_mark: | :white_check_mark: | :x: | :x: | :white_check_mark: | - | API testing platform |
| cURL | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | Command-line HTTP client |
| LFTP | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :x: | :x: | FTP/SFTP client |

## Media / Video

| Package | macOS | Ubuntu | RPi | Amazon | Windows | GitBash | Description |
|---------|:-----:|:------:|:---:|:------:|:-------:|:-------:|-------------|
| VLC | :white_check_mark: | :white_check_mark: | :white_check_mark: | :x: | :white_check_mark: | - | Media player |
| FFmpeg | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :x: | Video/audio processing |
| AtomicParsley | :white_check_mark: | :x: | :x: | :x: | :x: | - | MP4/M4A metadata editor |
| yt-dlp | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :x: | YouTube/video downloader |
| Elmedia Player | :white_check_mark: | - | - | - | - | - | macOS media player |
| Spotify | :white_check_mark: | :white_check_mark: | :x: | :x: | :white_check_mark: | - | Music streaming |
| Tidal | :white_check_mark: | :x: | :x: | :x: | :white_check_mark: | - | Hi-fi music streaming |

## Image Tools

| Package | macOS | Ubuntu | RPi | Amazon | Windows | GitBash | Description |
|---------|:-----:|:------:|:---:|:------:|:-------:|:-------:|-------------|
| ImageOptim | :white_check_mark: | - | - | - | - | - | Image compression (macOS) |
| Pngyu | :white_check_mark: | - | - | - | - | - | PNG compression (macOS) |

## Productivity

| Package | macOS | Ubuntu | RPi | Amazon | Windows | GitBash | Description |
|---------|:-----:|:------:|:---:|:------:|:-------:|:-------:|-------------|
| Microsoft Office 365 | :white_check_mark: | :x: | :x: | :x: | :white_check_mark: | - | Office suite |
| Microsoft Teams | :white_check_mark: | :white_check_mark: | :x: | :x: | :white_check_mark: | - | Team collaboration |
| Slack | :white_check_mark: | :white_check_mark: | :x: | :x: | :white_check_mark: | - | Team messaging |
| Zoom | :white_check_mark: | :white_check_mark: | :x: | :x: | :white_check_mark: | - | Video conferencing |
| Keyboard Maestro | :white_check_mark: | - | - | - | - | - | macOS automation |
| Caffeine | :white_check_mark: | - | - | - | - | - | Prevent sleep (macOS) |

## Messaging

| Package | macOS | Ubuntu | RPi | Amazon | Windows | GitBash | Description |
|---------|:-----:|:------:|:---:|:------:|:-------:|:-------:|-------------|
| WhatsApp | :white_check_mark: | :x: | :x: | :x: | :white_check_mark: | - | Messaging app |
| Messenger | :white_check_mark: | :x: | :x: | :x: | :white_check_mark: | - | Facebook Messenger |

## Screen Capture

| Package | macOS | Ubuntu | RPi | Amazon | Windows | GitBash | Description |
|---------|:-----:|:------:|:---:|:------:|:-------:|:-------:|-------------|
| Snagit | :white_check_mark: | :x: | :x: | :x: | :white_check_mark: | - | Screen capture |
| Camtasia | :white_check_mark: | :x: | :x: | :x: | :white_check_mark: | - | Screen recording |

## Design / Diagrams

| Package | macOS | Ubuntu | RPi | Amazon | Windows | GitBash | Description |
|---------|:-----:|:------:|:---:|:------:|:-------:|:-------:|-------------|
| Adobe Creative Cloud | :white_check_mark: | :x: | :x: | :x: | :white_check_mark: | - | Creative suite |
| Draw.IO | :white_check_mark: | :white_check_mark: | :x: | :x: | :white_check_mark: | - | Diagram editor |

## Utilities

| Package | macOS | Ubuntu | RPi | Amazon | Windows | GitBash | Description |
|---------|:-----:|:------:|:---:|:------:|:-------:|:-------:|-------------|
| jq | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :x: | JSON processor |
| yq | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :x: | YAML processor |
| ShellCheck | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :x: | :x: | Shell script linter |
| Tree | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :x: | Directory tree viewer |
| AppCleaner | :white_check_mark: | - | - | - | - | - | macOS app uninstaller |
| Beyond Compare | :white_check_mark: | :white_check_mark: | :x: | :x: | :white_check_mark: | - | File/folder comparison |
| Balena Etcher | :white_check_mark: | :white_check_mark: | :x: | :x: | :white_check_mark: | - | Flash OS images to SD/USB |
| Termius | :white_check_mark: | :x: | :x: | :x: | :white_check_mark: | - | SSH client |

## Documents

| Package | macOS | Ubuntu | RPi | Amazon | Windows | GitBash | Description |
|---------|:-----:|:------:|:---:|:------:|:-------:|:-------:|-------------|
| Pandoc | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :x: | Document converter |
| LaTeX | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :x: | Typesetting system |

## Web Font Tools

| Package | macOS | Ubuntu | RPi | Amazon | Windows | GitBash | Description |
|---------|:-----:|:------:|:---:|:------:|:-------:|:-------:|-------------|
| sfnt2woff-zopfli | :white_check_mark: | :x: | :x: | :x: | :x: | - | TTF/OTF to WOFF (Zopfli) |
| sfnt2woff | :white_check_mark: | :x: | :x: | :x: | :x: | - | TTF/OTF to WOFF |
| woff2 | :white_check_mark: | :x: | :x: | :x: | :x: | - | WOFF2 encoder/decoder |

## 3D Printing

| Package | macOS | Ubuntu | RPi | Amazon | Windows | GitBash | Description |
|---------|:-----:|:------:|:---:|:------:|:-------:|:-------:|-------------|
| Bambu Studio | :white_check_mark: | :x: | :x: | :x: | :white_check_mark: | - | 3D printer slicer |

---

## VS Code Extensions (macOS only)

| Extension | Description |
|-----------|-------------|
| Better Align | Code alignment |
| Color Picker | Color selection tool |
| Dracula Theme | Dark theme |
| Docker | Docker integration |
| EditorConfig | EditorConfig support |
| ES7 React Snippets | React code snippets |
| File Icons | File icon theme |
| Fold/Unfold All Icons | Code folding icons |
| GitHub Copilot | AI pair programmer |
| GitHub Copilot Chat | AI chat assistant |
| Git Ignore | .gitignore support |
| Go | Go language support |
| JavaScript & TypeScript Nightly | Latest TS/JS features |
| Kubernetes YAML Formatter | K8s YAML formatting |
| Live Server | Local development server |
| Makefile Tools | Makefile support |
| MarkdownLint | Markdown linting |
| Next.js Snippets | Next.js code snippets |
| NGINX Configuration | NGINX syntax support |
| Prettier | Code formatter |
| React Snippets | React code snippets |
| REST Client | HTTP request testing |
| shell-format | Shell script formatting |
| Tailwind CSS IntelliSense | Tailwind autocomplete |
| Tailwind Shades | Tailwind color shades |
| vscode-icons | File icons |
| YAML | YAML language support |
