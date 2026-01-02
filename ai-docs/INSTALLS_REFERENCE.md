# Installs Reference

Packages and applications installed via the dotfiles setup scripts.

**Source:** `~/Source/fredlackey/public/dotfiles/src/os/installs/`

## Legend

| Symbol | Meaning |
|--------|---------|
| :white_check_mark: | Installed |
| :x: | Not installed |
| - | Not applicable |

## Operating Systems

| Column | Description |
|--------|-------------|
| **macOS** | macOS workstation |
| **Ubuntu WKS** | Ubuntu 24 workstation |
| **Ubuntu SVR** | Ubuntu 24 server |
| **RPi** | Raspberry Pi OS |

---

## Core Tools

| Package | macOS | Ubuntu WKS | Ubuntu SVR | RPi | Description |
|---------|:-----:|:----------:|:----------:|:---:|-------------|
| Xcode | :white_check_mark: | - | - | - | Apple development tools and SDKs |
| Xcode Command Line Tools | :white_check_mark: | - | - | - | Compilers, Git, and CLI dev tools |
| Homebrew | :white_check_mark: | - | - | - | Package manager for macOS |
| build-essential | - | :white_check_mark: | :white_check_mark: | :white_check_mark: | GCC, make, and build tools |
| debian-archive-keyring | - | :white_check_mark: | :white_check_mark: | :white_check_mark: | GnuPG archive keys for Debian |

## Shell

| Package | macOS | Ubuntu WKS | Ubuntu SVR | RPi | Description |
|---------|:-----:|:----------:|:----------:|:---:|-------------|
| Bash | :white_check_mark: | :x: | :x: | :x: | Updated Bash shell (via Homebrew) |
| Bash Completion 2 | :white_check_mark: | :x: | :x: | :x: | Programmable completion for Bash |
| tmux | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | Terminal multiplexer |
| reattach-to-user-namespace | :white_check_mark: | - | - | - | macOS clipboard access in tmux |

## Version Control

| Package | macOS | Ubuntu WKS | Ubuntu SVR | RPi | Description |
|---------|:-----:|:----------:|:----------:|:---:|-------------|
| Git | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | Distributed version control |
| gitego | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | Git productivity tool (Go) |

## JavaScript / Node.js

| Package | macOS | Ubuntu WKS | Ubuntu SVR | RPi | Description |
|---------|:-----:|:----------:|:----------:|:---:|-------------|
| nvm | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | Node Version Manager |
| Node.js 22 | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | JavaScript runtime |
| npm | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | Node package manager |
| Yarn | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | Alternative package manager |

## Programming Languages

| Package | macOS | Ubuntu WKS | Ubuntu SVR | RPi | Description |
|---------|:-----:|:----------:|:----------:|:---:|-------------|
| Go | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | Go programming language |

## Editors

| Package | macOS | Ubuntu WKS | Ubuntu SVR | RPi | Description |
|---------|:-----:|:----------:|:----------:|:---:|-------------|
| Vim | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | Text editor with plugins (minpac) |
| Visual Studio Code | :white_check_mark: | :x: | :x: | :x: | Code editor with extensions |
| Sublime Text | :white_check_mark: | :x: | :x: | :x: | Lightweight text editor |
| Cursor | :white_check_mark: | :x: | :x: | :x: | AI-powered code editor |

## AI Tools

| Package | macOS | Ubuntu WKS | Ubuntu SVR | RPi | Description |
|---------|:-----:|:----------:|:----------:|:---:|-------------|
| Claude Code | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | Anthropic CLI for Claude |
| Gemini CLI | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | Google Gemini CLI (npm) |
| ChatGPT | :white_check_mark: | :x: | :x: | :x: | OpenAI ChatGPT desktop app |
| GitHub Copilot | :white_check_mark: | :x: | :x: | :x: | AI pair programmer (VS Code) |
| Superwhisper | :white_check_mark: | :x: | :x: | :x: | AI voice transcription |

## Containers

| Package | macOS | Ubuntu WKS | Ubuntu SVR | RPi | Description |
|---------|:-----:|:----------:|:----------:|:---:|-------------|
| Docker | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | Container runtime |
| Docker Compose | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | Multi-container orchestration |
| containerd.io | - | :white_check_mark: | :white_check_mark: | :white_check_mark: | Container runtime |

## Browsers

| Package | macOS | Ubuntu WKS | Ubuntu SVR | RPi | Description |
|---------|:-----:|:----------:|:----------:|:---:|-------------|
| Google Chrome | :white_check_mark: | :x: | :x: | :x: | Web browser |
| Google Chrome Canary | :white_check_mark: | :x: | :x: | :x: | Chrome dev/beta channel |
| Safari Technology Preview | :white_check_mark: | - | - | - | Safari beta features |
| Chromium | :x: | :white_check_mark: | :white_check_mark: | :white_check_mark: | Open-source browser |

## Security / Encryption

| Package | macOS | Ubuntu WKS | Ubuntu SVR | RPi | Description |
|---------|:-----:|:----------:|:----------:|:---:|-------------|
| GPG | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | GNU Privacy Guard |
| pinentry-mac | :white_check_mark: | - | - | - | GPG PIN entry for macOS |
| pinentry-tty | - | :white_check_mark: | :white_check_mark: | :white_check_mark: | GPG PIN entry for terminal |
| Nord Pass | :white_check_mark: | :x: | :x: | :x: | Password manager |
| Tailscale | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | Mesh VPN |

## Cloud / Infrastructure

| Package | macOS | Ubuntu WKS | Ubuntu SVR | RPi | Description |
|---------|:-----:|:----------:|:----------:|:---:|-------------|
| AWS CLI | :white_check_mark: | :x: | :x: | :x: | Amazon Web Services CLI |
| Terraform (tfenv) | :white_check_mark: | :x: | :x: | :x: | Infrastructure as code |

## Databases

| Package | macOS | Ubuntu WKS | Ubuntu SVR | RPi | Description |
|---------|:-----:|:----------:|:----------:|:---:|-------------|
| DbSchema | :white_check_mark: | :x: | :x: | :x: | Database diagram designer |
| Studio 3T | :white_check_mark: | :x: | :x: | :x: | MongoDB GUI |

## API / Network Tools

| Package | macOS | Ubuntu WKS | Ubuntu SVR | RPi | Description |
|---------|:-----:|:----------:|:----------:|:---:|-------------|
| Postman | :white_check_mark: | :x: | :x: | :x: | API testing platform |
| cURL | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | Command-line HTTP client |
| LFTP | :white_check_mark: | :x: | :x: | :x: | FTP/SFTP client |

## Media / Video

| Package | macOS | Ubuntu WKS | Ubuntu SVR | RPi | Description |
|---------|:-----:|:----------:|:----------:|:---:|-------------|
| VLC | :white_check_mark: | :x: | :x: | :x: | Media player |
| FFmpeg | :white_check_mark: | :x: | :x: | :x: | Video/audio processing |
| AtomicParsley | :white_check_mark: | :x: | :x: | :x: | MP4/M4A metadata editor |
| yt-dlp | :white_check_mark: | :x: | :x: | :x: | YouTube/video downloader |
| Elmedia Player | :white_check_mark: | :x: | :x: | :x: | macOS media player |
| Spotify | :white_check_mark: | :x: | :x: | :x: | Music streaming |
| Tidal | :white_check_mark: | :x: | :x: | :x: | Hi-fi music streaming |

## Image Tools

| Package | macOS | Ubuntu WKS | Ubuntu SVR | RPi | Description |
|---------|:-----:|:----------:|:----------:|:---:|-------------|
| ImageOptim | :white_check_mark: | :x: | :x: | :x: | Image compression |
| Pngyu | :white_check_mark: | :x: | :x: | :x: | PNG compression |

## Productivity

| Package | macOS | Ubuntu WKS | Ubuntu SVR | RPi | Description |
|---------|:-----:|:----------:|:----------:|:---:|-------------|
| Microsoft Office 365 | :white_check_mark: | :x: | :x: | :x: | Office suite |
| Microsoft Teams | :white_check_mark: | :x: | :x: | :x: | Team collaboration |
| Slack | :white_check_mark: | :x: | :x: | :x: | Team messaging |
| Zoom | :white_check_mark: | :x: | :x: | :x: | Video conferencing |
| Keyboard Maestro | :white_check_mark: | :x: | :x: | :x: | macOS automation |
| Caffeine | :white_check_mark: | :x: | :x: | :x: | Prevent sleep |

## Messaging

| Package | macOS | Ubuntu WKS | Ubuntu SVR | RPi | Description |
|---------|:-----:|:----------:|:----------:|:---:|-------------|
| WhatsApp | :white_check_mark: | :x: | :x: | :x: | Messaging app |
| Messenger | :white_check_mark: | :x: | :x: | :x: | Facebook Messenger |

## Screen Capture

| Package | macOS | Ubuntu WKS | Ubuntu SVR | RPi | Description |
|---------|:-----:|:----------:|:----------:|:---:|-------------|
| Snagit | :white_check_mark: | :x: | :x: | :x: | Screen capture |
| Camtasia | :white_check_mark: | :x: | :x: | :x: | Screen recording |

## Design / Diagrams

| Package | macOS | Ubuntu WKS | Ubuntu SVR | RPi | Description |
|---------|:-----:|:----------:|:----------:|:---:|-------------|
| Adobe Creative Cloud | :white_check_mark: | :x: | :x: | :x: | Creative suite |
| Draw.IO | :white_check_mark: | :x: | :x: | :x: | Diagram editor |

## Utilities

| Package | macOS | Ubuntu WKS | Ubuntu SVR | RPi | Description |
|---------|:-----:|:----------:|:----------:|:---:|-------------|
| jq | :white_check_mark: | :x: | :x: | :x: | JSON processor |
| yq | :white_check_mark: | :x: | :x: | :x: | YAML processor |
| ShellCheck | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | Shell script linter |
| Tree | :x: | :white_check_mark: | :white_check_mark: | :white_check_mark: | Directory tree viewer |
| AppCleaner | :white_check_mark: | - | - | - | macOS app uninstaller |
| Beyond Compare | :white_check_mark: | :x: | :x: | :x: | File/folder comparison |
| Balena Etcher | :white_check_mark: | :x: | :x: | :x: | Flash OS images to SD/USB |
| Termius | :white_check_mark: | :x: | :x: | :x: | SSH client |

## Documents

| Package | macOS | Ubuntu WKS | Ubuntu SVR | RPi | Description |
|---------|:-----:|:----------:|:----------:|:---:|-------------|
| Pandoc | :x: | :white_check_mark: | :white_check_mark: | :white_check_mark: | Document converter |
| LaTeX | :x: | :white_check_mark: | :white_check_mark: | :white_check_mark: | Typesetting system |

## Web Font Tools

| Package | macOS | Ubuntu WKS | Ubuntu SVR | RPi | Description |
|---------|:-----:|:----------:|:----------:|:---:|-------------|
| sfnt2woff-zopfli | :white_check_mark: | :x: | :x: | :x: | TTF/OTF to WOFF (Zopfli) |
| sfnt2woff | :white_check_mark: | :x: | :x: | :x: | TTF/OTF to WOFF |
| woff2 | :white_check_mark: | :x: | :x: | :x: | WOFF2 encoder/decoder |

## 3D Printing

| Package | macOS | Ubuntu WKS | Ubuntu SVR | RPi | Description |
|---------|:-----:|:----------:|:----------:|:---:|-------------|
| Bambu Studio | :white_check_mark: | :x: | :x: | :x: | 3D printer slicer |

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
