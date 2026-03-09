FROM ubuntu:24.04

# Avoid interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install Node.js 20.x (LTS) and git
RUN apt-get update && \
    apt-get install -y curl git && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Create a non-root user for testing
RUN useradd -m -s /bin/bash testuser

# Copy the project into the container
WORKDIR /app
COPY . /app

# Install dependencies
RUN npm ci --ignore-scripts 2>/dev/null || npm install --ignore-scripts

# Make the CLI entry point executable
RUN chmod +x /app/src/cli.js

# Own everything by testuser so tests can write temp files
RUN chown -R testuser:testuser /app

# Run tests as non-root user
USER testuser

# Set HOME for testuser
ENV HOME=/home/testuser

CMD ["node", "test/docker-full.js"]
