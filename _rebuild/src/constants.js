const INSTALLS = [
  {
    name: "Debian",
    environment: "debian",
    description: "Installs generic to any Debian-based Linux distribution.",
    packages: [
      {
        name: "Git",
        description: "Git command line tool.",
        command: "apt-get install -y git",
        priority: 1,
      }
    ]
  },
  {
    name: "Debian WSL",
    environment: "debian_wsl",
    description: "Installs generic to any Debian-based Linux distribution running in WSL.",
  },
  {
    name: "Ubuntu",
    environment: "ubuntu",
    description: "Installs generic to any Ubuntu-based Linux distribution.",
  },
  {
    name: "Ubuntu WSL",
    environment: "ubuntu_wsl",
    description: "Installs generic to any Ubuntu-based Linux distribution running in WSL.",
  },
  {
    name: "macOS",
    environment: "macos",
    description: "Installs for macOS systems.",
  },
  {
    name: "Windows",
    environment: "windows",
    description: "Installs for Windows systems.",
  },
  {
    name: "Git Bash",
    environment: "gitbash",
    description: "Installs within the Git Bash environment.",
  },
]