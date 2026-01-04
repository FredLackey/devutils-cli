# Installing Safari Technology Preview

## Overview

Safari Technology Preview is Apple's experimental version of the Safari web browser, designed for developers and advanced users who want early access to upcoming web technologies. Released approximately every two weeks, Safari Technology Preview contains the latest WebKit engine updates, experimental web APIs, developer tools enhancements, and potential Safari features before they reach the stable Safari release.

Safari Technology Preview runs alongside your existing Safari installation, maintaining a separate configuration. This allows you to test new web technologies and debug compatibility issues without affecting your primary browser experience. It integrates with iCloud to sync your bookmarks, favorites, and Reading List from your main Safari installation.

**Important**: Safari Technology Preview is intended for testing and development purposes. It may contain bugs or exhibit unexpected behavior. Apple does not recommend using it as your primary browser.

## Prerequisites

Before installing Safari Technology Preview, ensure:

1. **macOS Sequoia (15.x) or later** - Safari Technology Preview requires macOS 15.0 or newer
2. **Internet connectivity** - Required to download the installer
3. **Sufficient disk space** - Approximately 200 MB for installation
4. **Administrative privileges** - Required for installation via Homebrew

**Critical Limitation**: Safari Technology Preview is **exclusively available for macOS**. Apple does not release Safari Technology Preview (or any version of Safari) for Windows, Linux, or any other operating system. This is a fundamental platform restriction, not a packaging limitation.

## Platform-Specific Installation

### macOS (Homebrew)

#### Prerequisites

- macOS 15.0 (Sequoia) or later
- Homebrew package manager installed
- Terminal access
- Apple Silicon (M1/M2/M3) or Intel processor

If Homebrew is not installed, install it first:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Installation Steps

Run the following command to install Safari Technology Preview:

```bash
brew install --cask --quiet safari-technology-preview
```

The `--quiet` flag suppresses non-essential output, making the command suitable for automation scripts. The `--cask` flag specifies that this is a macOS application (as opposed to a command-line tool).

Homebrew automatically detects your Mac's architecture (Apple Silicon or Intel) and downloads the appropriate build.

#### Verification

Confirm the installation succeeded by checking that the application exists:

```bash
ls -la /Applications/Safari\ Technology\ Preview.app
```

Expected output shows the application directory with its contents.

Launch Safari Technology Preview to verify it opens correctly:

```bash
open -a "Safari Technology Preview"
```

To check the WebKit version, open Safari Technology Preview and navigate to `Safari Technology Preview > About Safari Technology Preview` in the menu bar.

#### Troubleshooting

**Problem**: `Error: Cask 'safari-technology-preview' requires macOS >= 15`

**Solution**: Safari Technology Preview requires macOS Sequoia (15.0) or later. Upgrade your operating system to install Safari Technology Preview:

```bash
# Check your current macOS version
sw_vers -productVersion
```

If you are running macOS 14 (Sonoma) or earlier, you must upgrade to macOS 15 or later before installing Safari Technology Preview.

**Problem**: `brew: command not found`

**Solution**: Homebrew is not in your PATH. Add it by running:

```bash
# For Apple Silicon Macs
eval "$(/opt/homebrew/bin/brew shellenv)"

# For Intel Macs
eval "$(/usr/local/bin/brew shellenv)"
```

For a permanent fix, add the appropriate line to your `~/.zshrc` or `~/.bash_profile`.

**Problem**: Installation fails with network errors

**Solution**: Homebrew downloads Safari Technology Preview from Apple's servers. Verify network connectivity and retry:

```bash
brew update && brew install --cask --quiet safari-technology-preview
```

**Problem**: Quarantine warning when first launching

**Solution**: macOS may quarantine downloaded applications. Remove the quarantine attribute:

```bash
xattr -dr com.apple.quarantine /Applications/Safari\ Technology\ Preview.app
```

**Problem**: Safari Technology Preview cannot be opened because Apple cannot check it for malicious software

**Solution**: Right-click (or Control-click) the Safari Technology Preview app in Finder and select "Open" from the context menu. Click "Open" in the dialog that appears. This only needs to be done once.

**Problem**: Previous installation exists and causes conflicts

**Solution**: Uninstall the existing installation before reinstalling:

```bash
brew uninstall --cask safari-technology-preview
brew install --cask --quiet safari-technology-preview
```

---

### Ubuntu/Debian (APT)

#### Platform Limitation

**Safari Technology Preview is NOT available for Ubuntu, Debian, or any Linux distribution.**

Apple develops Safari Technology Preview exclusively for macOS. Apple has never released Safari for Linux, and there are no official or third-party builds available. This is a deliberate business decision by Apple to keep Safari exclusive to their hardware and operating systems.

#### Why This Limitation Exists

Safari is deeply integrated with macOS system frameworks (Core Foundation, Core Graphics, Core Text, Security framework, etc.) that do not exist on Linux. Porting Safari to Linux would require rewriting significant portions of the browser and maintaining two separate codebases, which Apple has chosen not to do.

#### Recommended Alternative

For web development testing on Linux, use one of these approaches:

**Option 1**: Use WebKitGTK, the open-source WebKit port for Linux:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y webkit2gtk-4.0
```

WebKitGTK shares the same WebKit rendering engine as Safari but differs in JavaScript engine performance and platform-specific features. It provides a reasonable approximation for testing WebKit compatibility.

**Option 2**: Use a macOS virtual machine or cloud-based Mac service (such as MacStadium or AWS EC2 Mac instances) to test Safari Technology Preview in a real macOS environment.

**Option 3**: Use cross-browser testing services like BrowserStack or Sauce Labs, which provide access to Safari on real Mac hardware.

---

### Raspberry Pi OS (APT)

#### Platform Limitation

**Safari Technology Preview is NOT available for Raspberry Pi OS.**

Apple does not release Safari or Safari Technology Preview for any Linux distribution, including Raspberry Pi OS. Additionally, Raspberry Pi devices use ARM processors running Linux, which Safari has never supported.

#### Why This Limitation Exists

Safari is exclusive to Apple platforms. Even if Safari were available for Linux, Raspberry Pi OS would face additional compatibility challenges due to its ARM architecture and limited system resources compared to desktop systems.

#### Recommended Alternative

For WebKit-based testing on Raspberry Pi OS, use the Epiphany browser (GNOME Web), which is based on WebKitGTK:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y epiphany-browser
```

Verify installation:

```bash
epiphany --version
```

**Note**: Epiphany uses the WebKit rendering engine but may not reflect the exact behavior of Safari Technology Preview. For accurate Safari testing, use a Mac or a cloud-based Mac testing service.

---

### Amazon Linux/RHEL (DNF/YUM)

#### Platform Limitation

**Safari Technology Preview is NOT available for Amazon Linux, RHEL, CentOS, Fedora, or any RPM-based Linux distribution.**

Apple develops Safari and Safari Technology Preview exclusively for macOS. There are no official builds for any Linux distribution.

#### Why This Limitation Exists

Apple has never released Safari for Linux. Safari relies on macOS-specific system frameworks and APIs that have no equivalents on Linux. Apple's business strategy keeps Safari as a differentiating feature for Mac computers.

#### Recommended Alternative

For WebKit testing on Amazon Linux or RHEL systems:

**Option 1**: Use WebKitGTK (if available in your distribution):

```bash
# Amazon Linux 2023 / Fedora
sudo dnf install -y webkit2gtk4.0

# Amazon Linux 2 / CentOS 7
sudo yum install -y webkitgtk4
```

**Option 2**: Deploy a macOS instance on AWS:

Amazon EC2 offers Mac instances (mac1.metal, mac2.metal) that run macOS. You can install Safari Technology Preview on these instances for testing:

1. Launch an EC2 Mac instance
2. Connect via VNC or SSH with X forwarding
3. Install Safari Technology Preview using Homebrew

**Option 3**: Use BrowserStack, Sauce Labs, or similar services that provide Safari access through their testing infrastructure.

---

### Windows (Chocolatey/winget)

#### Platform Limitation

**Safari Technology Preview is NOT available for Windows.**

Apple discontinued Safari for Windows in 2012 with Safari 5.1.7. Since then, Apple has not released any version of Safari (including Safari Technology Preview) for Windows. The Windows version was deprecated due to low market share and the significant engineering effort required to maintain cross-platform compatibility.

#### Why This Limitation Exists

Safari relies heavily on macOS-specific technologies including Core Animation, Core Text, and the macOS Security framework. Maintaining Windows-compatible versions of these technologies proved unsustainable. Apple chose to focus Safari development exclusively on macOS and iOS.

The last Safari version for Windows (5.1.7) is severely outdated, lacks modern web standards support, and contains known security vulnerabilities. Do not use Safari 5 for Windows under any circumstances.

#### Recommended Alternative

For testing Safari compatibility on Windows:

**Option 1**: Use a cloud-based testing service:

- BrowserStack (https://www.browserstack.com)
- Sauce Labs (https://saucelabs.com)
- LambdaTest (https://www.lambdatest.com)

These services provide access to Safari on real Mac hardware through your web browser.

**Option 2**: Use a macOS virtual machine:

Run macOS in a virtual machine using VMware Workstation or similar virtualization software. Note that Apple's EULA only permits macOS virtualization on Apple hardware.

**Option 3**: Use a physical Mac:

For professional web development requiring Safari testing, consider obtaining a Mac mini, MacBook, or Mac Studio for your testing workflow.

---

### WSL (Ubuntu)

#### Platform Limitation

**Safari Technology Preview is NOT available for WSL (Windows Subsystem for Linux).**

WSL runs a Linux environment on Windows, but Safari Technology Preview is only available for macOS. Neither Safari nor Safari Technology Preview has ever been released for any Linux distribution.

#### Why This Limitation Exists

WSL provides a Linux userland environment, not a macOS environment. Safari requires macOS-specific frameworks that do not exist in Linux or WSL. Even if Safari were available for Linux, it would not run in WSL.

#### Recommended Alternative

For WebKit-based testing in WSL:

**Option 1**: Install WebKitGTK for basic WebKit rendering tests:

```bash
sudo DEBIAN_FRONTEND=noninteractive apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y webkit2gtk-4.0
```

**Option 2**: Use Playwright or Puppeteer with WebKit:

Playwright supports WebKit testing on Linux, providing a closer approximation to Safari behavior:

```bash
# Install Node.js if not present
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs

# Install Playwright with WebKit
npx playwright install webkit
```

You can then run WebKit-based tests through Playwright's API.

**Option 3**: Use cloud-based Safari testing services (BrowserStack, Sauce Labs) that provide access to Safari on real Mac hardware.

---

### Git Bash (Windows)

#### Platform Limitation

**Safari Technology Preview is NOT available for Git Bash or Windows.**

Git Bash is a terminal emulator for Windows that provides a Bash shell and Unix utilities. It runs on Windows, and since Safari Technology Preview is not available for Windows, it cannot be installed or used through Git Bash.

#### Why This Limitation Exists

Git Bash provides a Unix-like command-line environment but does not change the underlying operating system. Since Safari Technology Preview requires macOS, and Git Bash runs on Windows, there is no installation path available.

#### Recommended Alternative

From Git Bash on Windows, you can interact with cloud-based Safari testing services via their APIs or CLI tools:

**Using BrowserStack CLI**:

```bash
# Download BrowserStack Local binary
curl -L -o /tmp/BrowserStackLocal-win32.zip https://www.browserstack.com/browserstack-local/BrowserStackLocal-win32.zip

# Extract and use
unzip /tmp/BrowserStackLocal-win32.zip -d /c/tools/browserstack/
/c/tools/browserstack/BrowserStackLocal.exe --key YOUR_ACCESS_KEY
```

**Using Playwright** (if Node.js is installed):

```bash
npx playwright install webkit
npx playwright test --project=webkit
```

Note: Playwright's WebKit on Windows uses a custom WebKit build, not actual Safari. For accurate Safari testing, use a Mac or cloud-based testing service.

---

## Post-Installation Configuration

Safari Technology Preview includes several developer-focused features that require configuration.

### Enable the Develop Menu

The Develop menu provides access to web development tools:

1. Open Safari Technology Preview
2. Go to **Safari Technology Preview > Settings** (or press `Cmd + ,`)
3. Click the **Advanced** tab
4. Check **Show features for web developers**

The Develop menu now appears in the menu bar, providing access to:
- Web Inspector
- Responsive Design Mode
- Empty Caches
- Disable JavaScript, Images, and other features
- Experimental Features submenu

### Access Experimental Features

Safari Technology Preview includes experimental web features that may not be enabled by default:

1. Open the **Develop** menu
2. Select **Experimental Features**
3. Toggle individual features as needed for testing

These features are subject to change and may be removed or modified in future releases.

### Enable Web Inspector

To inspect web pages and debug JavaScript:

1. Open the **Develop** menu
2. Select **Show Web Inspector** (or press `Cmd + Option + I`)

Alternatively, right-click any element on a web page and select **Inspect Element**.

### Configure for Automation Testing

For automated testing with tools like Selenium or Playwright:

```bash
# Enable Remote Automation
defaults write com.apple.Safari.TechnologyPreview AllowRemoteAutomation -bool true

# Run Safari Technology Preview with WebDriver
safaridriver --enable
```

---

## Common Issues

### Issue: Safari Technology Preview is Very Slow

**Symptoms**: Browser feels sluggish, pages take long to load, or UI is unresponsive.

**Solution**: Safari Technology Preview may have experimental features enabled that impact performance. Reset experimental features to their defaults:

1. Go to **Develop > Experimental Features**
2. Scroll to the bottom and click **Reset All to Defaults**
3. Restart Safari Technology Preview

### Issue: Websites Display Incorrectly

**Symptoms**: Pages render differently in Safari Technology Preview than in stable Safari or other browsers.

**Solution**: This may indicate upcoming rendering changes or experimental feature conflicts:

1. Compare the page in stable Safari to confirm it is a Safari Technology Preview-specific issue
2. Check if any experimental features are affecting rendering
3. Report the issue to Apple via the **Safari > Report an Issue** menu option

### Issue: Extensions Not Working

**Symptoms**: Safari extensions fail to load or function correctly in Safari Technology Preview.

**Solution**: Extensions must be compatible with the WebKit version in Safari Technology Preview:

1. Check if the extension developer provides a beta version compatible with Safari Technology Preview
2. Disable problematic extensions via **Safari Technology Preview > Settings > Extensions**
3. Some extensions may require updates as Safari Technology Preview evolves

### Issue: Cannot Sign In to iCloud Features

**Symptoms**: iCloud Keychain, bookmarks, or other iCloud features are unavailable.

**Solution**: Safari Technology Preview uses the same iCloud account as your system:

1. Ensure you are signed in to iCloud in **System Settings > Apple ID**
2. Verify that Safari is enabled in **System Settings > Apple ID > iCloud > Apps Using iCloud**
3. Restart Safari Technology Preview

### Issue: Safari Technology Preview Crashes on Launch

**Symptoms**: Application crashes immediately when opened.

**Solution**: Reset Safari Technology Preview preferences and data:

```bash
# Close Safari Technology Preview if running
osascript -e 'quit app "Safari Technology Preview"'

# Remove preferences (keeps bookmarks via iCloud)
rm -rf ~/Library/Preferences/com.apple.SafariTechnologyPreview.plist
rm -rf ~/Library/Caches/com.apple.SafariTechnologyPreview/

# Restart the app
open -a "Safari Technology Preview"
```

If crashes persist, reinstall:

```bash
brew uninstall --cask safari-technology-preview
brew install --cask --quiet safari-technology-preview
```

---

## Updating Safari Technology Preview

Safari Technology Preview receives updates approximately every two weeks. Homebrew tracks these releases automatically.

### Check for Updates

```bash
brew outdated --cask | grep safari-technology-preview
```

### Update to Latest Version

```bash
brew upgrade --cask --quiet safari-technology-preview
```

### Automatic Updates via Mac App Store

Safari Technology Preview can also update through the Mac App Store if installed from there. However, Homebrew installations update through Homebrew, not the App Store.

---

## Uninstallation

To remove Safari Technology Preview:

```bash
brew uninstall --cask safari-technology-preview
```

This removes the application but preserves your iCloud-synced data (bookmarks, Reading List). To remove local caches and preferences:

```bash
rm -rf ~/Library/Preferences/com.apple.SafariTechnologyPreview.plist
rm -rf ~/Library/Caches/com.apple.SafariTechnologyPreview/
rm -rf ~/Library/Safari\ Technology\ Preview/
```

---

## References

- [Safari Technology Preview - Apple Developer](https://developer.apple.com/safari/technology-preview/)
- [Safari Technology Preview Release Notes](https://developer.apple.com/documentation/safari-technology-preview-release-notes)
- [Homebrew Cask: safari-technology-preview](https://formulae.brew.sh/cask/safari-technology-preview)
- [WebKit Blog - Safari Technology Preview](https://webkit.org/blog/category/safari-technology-preview/)
- [Safari Developer Resources](https://developer.apple.com/safari/resources/)
- [WebKit Project](https://webkit.org/)
