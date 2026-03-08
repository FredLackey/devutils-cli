# Installing Xcode

## Dependencies

### macOS (Homebrew)
- **Required:**
  - Homebrew - Install via `NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`
  - Apple ID - Free account required for download from Apple servers
- **Optional:**
  - `aria2` - Install via `brew install --quiet aria2` for 3-5x faster downloads
- **Auto-installed:**
  - Xcode Command Line Tools (included with full Xcode)
  - iOS, macOS, watchOS, tvOS, visionOS SDKs
  - Simulators for all Apple platforms

### Ubuntu (APT/Snap)
- **Not Supported** - Xcode is a macOS-exclusive application

### Raspberry Pi OS (APT/Snap)
- **Not Supported** - Xcode is a macOS-exclusive application

### Amazon Linux (DNF/YUM)
- **Not Supported** - Xcode is a macOS-exclusive application

### Windows (Chocolatey/winget)
- **Not Supported** - Xcode is a macOS-exclusive application

### WSL (Windows Subsystem for Linux)
- **Not Supported** - Xcode is a macOS-exclusive application

### Git Bash (Manual/Portable)
- **Not Supported** - Xcode is a macOS-exclusive application

## Overview

Xcode is Apple's integrated development environment (IDE) for developing software for all Apple platforms: iOS, iPadOS, macOS, watchOS, tvOS, and visionOS. It is a large application (~40+ GB) that includes:

- **Xcode IDE**: Full-featured code editor with syntax highlighting, code completion, and debugging
- **Swift and Objective-C Compilers**: Build tools for Apple's programming languages
- **Interface Builder**: Visual UI design tool for building app interfaces
- **Instruments**: Performance analysis and profiling tools
- **Simulators**: Virtual devices for testing on iPhone, iPad, Apple Watch, Apple TV, and Vision Pro
- **SDKs**: Software Development Kits for all Apple platforms
- **Asset Catalog Compiler**: Tools for managing app icons and images
- **Core Data Model Editor**: Visual database schema designer

**Important**: This documentation covers the **full Xcode IDE**. If you only need compilers and command-line tools (git, make, clang), see `xcode-clt.md` for the lightweight Xcode Command Line Tools (~2.5 GB).

**Platform Limitation**: Xcode is an Apple-exclusive product and **only runs on macOS**. There is no legitimate way to install or run Xcode on Windows, Linux, or other operating systems. Apple does not support virtualization of macOS on non-Apple hardware.

## Prerequisites

### Universal Requirements (macOS Only)

- **macOS Version**: See compatibility table below
- **Disk Space**: Minimum 50 GB free (Xcode ~40 GB + build artifacts)
- **RAM**: 8 GB minimum, 16 GB recommended
- **Apple ID**: Free account required for downloading Xcode
- **Internet Connection**: Required for download (~40 GB)

### Xcode Version Compatibility

| Xcode Version | Minimum macOS Required |
|---------------|------------------------|
| Xcode 26.x | macOS Sequoia 15.6 |
| Xcode 16.4 | macOS Sequoia 15.3 |
| Xcode 16.2-16.3 | macOS Sonoma 14.5 |
| Xcode 16.0-16.1 | macOS Sonoma 14.5 |
| Xcode 15.2-15.4 | macOS Ventura 13.5 |
| Xcode 14.3.x | macOS Ventura 13.0 |
| Xcode 14.0-14.2 | macOS Monterey 12.5 |

**Note**: visionOS development requires a Mac with Apple silicon (M1 or later).

### Check Your macOS Version

```bash
sw_vers -productVersion
```

## Platform-Specific Installation

---

### macOS (Homebrew)

Xcode can be installed via the `xcodes` command-line tool, which provides version management and faster downloads than the Mac App Store. This is the recommended method for developers who need to manage multiple Xcode versions or automate installation.

#### Prerequisites

- macOS Sonoma 14.5 or later (for latest Xcode 16.x)
- Homebrew package manager installed
- Apple ID credentials
- At least 50 GB free disk space

If Homebrew is not installed, install it first:

```bash
NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Installation Steps

**Step 1: Install xcodes and aria2**

Install the xcodes CLI tool and aria2 for faster downloads:

```bash
brew install --quiet xcodesorg/made/xcodes aria2
```

The `xcodes` tool downloads Xcode directly from Apple's servers using your Apple ID credentials. The `aria2` download accelerator enables 3-5x faster downloads using parallel connections.

**Step 2: Set Apple ID Credentials**

Set your Apple ID credentials as environment variables for non-interactive installation:

```bash
export XCODES_USERNAME="your-apple-id@example.com"
export XCODES_PASSWORD="your-apple-id-password"
```

**Security Note**: For CI/CD pipelines, store these credentials as secrets. For interactive use, you can omit this step and xcodes will prompt for credentials (then save them to the macOS Keychain).

**Step 3: Install Latest Xcode**

```bash
xcodes install --latest
```

This command downloads and installs the latest stable Xcode release to `/Applications/Xcode.app`.

**Alternative**: Install a specific version:

```bash
# List available versions
xcodes list

# Install a specific version
xcodes install 16.2
```

**Step 4: Accept Xcode License**

After installation, accept the Xcode license agreement:

```bash
sudo xcodebuild -license accept
```

**Step 5: Install Additional Components**

Install additional required components (simulators, platforms):

```bash
sudo xcodebuild -runFirstLaunch
```

#### Verification

Confirm the installation succeeded:

```bash
xcodebuild -version
```

Expected output (version numbers may vary):

```
Xcode 16.2
Build version 16C5032a
```

Verify the developer directory is correctly set:

```bash
xcode-select -p
```

Expected output:

```
/Applications/Xcode.app/Contents/Developer
```

Verify Swift compiler is available:

```bash
swift --version
```

#### Troubleshooting

**Problem**: `xcodes install` fails with authentication error

**Solution**: Verify your Apple ID credentials are correct. If using two-factor authentication, you may need to generate an app-specific password:

1. Go to https://appleid.apple.com/account/manage
2. Sign in with your Apple ID
3. Navigate to "Sign-In and Security" > "App-Specific Passwords"
4. Generate a new password and use it as `XCODES_PASSWORD`

**Problem**: Download speed is slow

**Solution**: Ensure aria2 is installed for parallel downloads:

```bash
brew install --quiet aria2
```

**Problem**: "Xcode cannot be installed on this Mac" error

**Solution**: Your macOS version is too old for the Xcode version you are trying to install. Check the compatibility table above and either:
- Update macOS to a supported version
- Install an older Xcode version compatible with your macOS:

```bash
xcodes list
xcodes install 15.4  # For older macOS versions
```

**Problem**: `xcodebuild -license accept` requires manual interaction

**Solution**: This command should work non-interactively with sudo. If it still prompts, run:

```bash
sudo xcodebuild -license accept <<< "agree"
```

**Problem**: Multiple Xcode versions conflict

**Solution**: Use `xcode-select` to switch between versions:

```bash
# List installed Xcode versions
xcodes installed

# Select a specific version
sudo xcode-select -s /Applications/Xcode-16.2.app/Contents/Developer

# Verify the switch
xcode-select -p
```

---

### Ubuntu/Debian (APT)

#### Not Supported

Xcode is an Apple-exclusive product and is **not available for Ubuntu or Debian**. Apple does not provide Xcode for any Linux distribution, and running macOS or Xcode on non-Apple hardware violates Apple's End User License Agreement.

#### Alternatives for Linux Developers

For iOS development on Linux, consider these alternatives:

**Cross-Platform Mobile Development Frameworks:**
- Flutter - Build iOS apps on Linux, deploy via macOS build server
- React Native - Similar cross-platform approach
- Capacitor/Ionic - Web-based mobile development

**Remote macOS Build Services:**
- MacStadium - Cloud-hosted Mac infrastructure
- AWS EC2 Mac instances - Mac mini in AWS
- GitHub Actions macOS runners - CI/CD on macOS

**Note**: All alternatives still require access to a macOS machine (physical or cloud) to compile and submit iOS apps to the App Store.

---

### Raspberry Pi OS (APT)

#### Not Supported

Xcode is an Apple-exclusive product and is **not available for Raspberry Pi OS**. The Raspberry Pi's ARM architecture is incompatible with macOS, and Apple does not provide Xcode for any non-macOS operating system.

#### Alternatives

There are no direct alternatives for iOS development on Raspberry Pi. iOS apps must be compiled on macOS using Xcode.

---

### Amazon Linux/RHEL (YUM/DNF)

#### Not Supported

Xcode is an Apple-exclusive product and is **not available for Amazon Linux or RHEL**. Apple does not provide Xcode for any Linux distribution.

#### Alternatives

For iOS development in cloud environments:

**AWS EC2 Mac Instances:**
AWS provides Mac mini instances that can run macOS and Xcode:

```bash
# Launch via AWS CLI (requires appropriate permissions and Dedicated Host)
aws ec2 run-instances \
  --instance-type mac2.metal \
  --image-id ami-xxxxxxxxxxxxxxxxx \
  --key-name your-key-pair
```

Note: EC2 Mac instances have a minimum 24-hour billing period and require a Dedicated Host.

---

### Windows (Chocolatey/winget)

#### Not Supported

Xcode is an Apple-exclusive product and is **not available for Windows**. Apple does not provide Xcode for Windows, and macOS cannot legally be virtualized on non-Apple hardware.

#### Alternatives

For iOS development on Windows:

**Cross-Platform Mobile Development:**

```powershell
# Flutter (requires macOS for iOS builds)
choco install flutter -y

# React Native (requires macOS for iOS builds)
npm install -g react-native-cli
```

**Remote Build Services:**
- MacStadium for cloud-hosted Macs
- GitHub Actions with macOS runners
- Azure DevOps with macOS agents

**Hackintosh (Not Recommended)**: Installing macOS on non-Apple hardware violates Apple's EULA and is not supported.

---

### WSL (Windows Subsystem for Linux)

#### Not Supported

Xcode is an Apple-exclusive product and is **not available for WSL**. WSL runs Linux distributions, not macOS, and Apple does not provide Xcode for Linux.

#### Alternatives

See the Windows section above for cross-platform development alternatives.

---

### Git Bash (Manual/Portable)

#### Not Supported

Xcode is an Apple-exclusive product and is **not available for Git Bash on Windows**. Git Bash runs on Windows, and Apple does not provide Xcode for Windows.

#### Alternatives

See the Windows section above for cross-platform development alternatives.

---

## Post-Installation Configuration

These steps apply only to macOS installations.

### Accept the License Agreement

If you skipped this during installation:

```bash
sudo xcodebuild -license accept
```

### Install First-Launch Components

Run first-launch tasks to install additional components:

```bash
sudo xcodebuild -runFirstLaunch
```

### Set the Active Developer Directory

If you have multiple Xcode versions installed, set the active one:

```bash
# Point to the default Xcode.app
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer

# Or point to a specific version
sudo xcode-select -s /Applications/Xcode-16.2.app/Contents/Developer
```

### Install Additional Simulators

Xcode includes some simulators by default. To install additional simulators:

```bash
# List available platforms
xcodebuild -downloadAllPlatforms

# Or install specific platforms via Xcode
# Xcode > Settings > Platforms > + button
```

Note: The `xcodebuild -downloadAllPlatforms` command may require interaction. For fully automated simulator installation, use:

```bash
# Install iOS simulator
xcrun simctl runtime add "iOS 17.2"
```

### Configure Code Signing

For deploying to physical devices or submitting to App Store:

1. Sign in to Xcode with your Apple ID: Xcode > Settings > Accounts > +
2. Create or download signing certificates
3. Register your devices in the Apple Developer portal

### Enable Command Line Tools

Ensure command-line tools use the full Xcode installation:

```bash
# Verify command line tools point to Xcode (not standalone CLT)
xcode-select -p
# Should output: /Applications/Xcode.app/Contents/Developer

# If it points to /Library/Developer/CommandLineTools, switch to Xcode:
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
```

## Common Issues

### Issue: "No such file or directory" Errors When Building

**Symptoms**: Build fails with missing header or SDK errors

**Solution**: Reset the developer directory and verify Xcode installation:

```bash
sudo xcode-select --reset
xcodebuild -version
```

### Issue: Simulators Not Available

**Symptoms**: No simulators appear in Xcode or `xcrun simctl list`

**Solution**: Install simulator runtimes:

```bash
# List available runtimes
xcrun simctl runtime list

# Download missing platforms
xcodebuild -downloadAllPlatforms
```

### Issue: Code Signing Fails

**Symptoms**: "No signing certificate" or "Provisioning profile" errors

**Solution**:
1. Ensure you are signed in to Xcode with a valid Apple ID
2. For development: Enable "Automatically manage signing" in project settings
3. For distribution: Create certificates at https://developer.apple.com/account/resources/certificates

### Issue: Xcode Updates Fail

**Symptoms**: Mac App Store shows update but installation fails

**Solution**: Use xcodes to manage updates:

```bash
# Check for updates
xcodes list

# Install latest version
xcodes install --latest

# Remove old version after verifying new one works
xcodes uninstall 16.1
```

### Issue: "Xcode.app is damaged" Error

**Symptoms**: macOS reports Xcode is damaged and cannot be opened

**Solution**: This can occur if the download was interrupted. Remove and reinstall:

```bash
sudo rm -rf /Applications/Xcode.app
xcodes install --latest
```

### Issue: Build Takes Very Long Time

**Symptoms**: Projects take much longer to build than expected

**Solutions**:

1. **Enable parallel builds**: Xcode > Settings > Locations > Derived Data > adjust parallel build settings

2. **Increase build threads**:
```bash
defaults write com.apple.dt.XCBuild EnableSwiftBuildSystemIntegration -bool YES
```

3. **Clear derived data**:
```bash
rm -rf ~/Library/Developer/Xcode/DerivedData
```

### Issue: Disk Space Running Low

**Symptoms**: macOS warns about low disk space after installing Xcode

**Solution**: Clean up old archives and derived data:

```bash
# Remove derived data (~5-20 GB typically)
rm -rf ~/Library/Developer/Xcode/DerivedData

# Remove old archives
rm -rf ~/Library/Developer/Xcode/Archives

# Remove old device support files
rm -rf ~/Library/Developer/Xcode/iOS\ DeviceSupport

# Remove old simulators
xcrun simctl delete unavailable
```

## Alternative Installation Method: Mac App Store via mas-cli

For environments where the xcodes tool is not preferred, Xcode can be installed via the Mac App Store using the `mas` command-line interface.

**Note**: As of mas-cli 4.0.0, root privileges are required for installation due to macOS security changes (CVE-2025-43411).

```bash
# Install mas-cli
brew install --quiet mas

# Sign in to App Store (interactive - requires GUI)
# You must be signed into the Mac App Store app first

# Install Xcode (App ID: 497799835)
sudo mas install 497799835

# Accept license after installation
sudo xcodebuild -license accept
sudo xcodebuild -runFirstLaunch
```

**Limitations of mas-cli method**:
- Cannot install older Xcode versions (only current App Store version)
- Cannot manage multiple Xcode installations
- Requires prior Mac App Store sign-in via GUI
- Slower downloads compared to xcodes with aria2

For version management and automation, the xcodes method documented above is recommended.

## References

- [Xcode - Apple Developer](https://developer.apple.com/xcode/)
- [Xcode Release Notes - Apple Developer Documentation](https://developer.apple.com/documentation/xcode-release-notes)
- [Xcode Support - Minimum OS Requirements](https://developer.apple.com/support/xcode/)
- [xcodes CLI - GitHub](https://github.com/XcodesOrg/xcodes)
- [mas-cli - Mac App Store CLI](https://github.com/mas-cli/mas)
- [Downloading and Installing Xcode - Apple Documentation](https://developer.apple.com/documentation/xcode/downloading-and-installing-additional-xcode-components)
- [Apple Developer Downloads](https://developer.apple.com/download/)
- [xcodereleases.com - Xcode Version History](https://xcodereleases.com/)
