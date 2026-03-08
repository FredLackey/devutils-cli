#!/bin/bash

# Test script for cloudflare-warp installer
# Tests isEligible() and install() across all Docker environments

set -e

ENVIRONMENTS=("ubuntu" "ubuntu-desktop" "debian" "amazonlinux" "fedora")

echo "Testing cloudflare-warp installer across all environments..."
echo ""

for env in "${ENVIRONMENTS[@]}"; do
  echo "========================================"
  echo "Testing in: $env"
  echo "========================================"

  docker compose -f testing/docker-compose.yml run --rm "$env" node -e "
    const installer = require('./src/installs/cloudflare-warp.js');
    (async () => {
      try {
        console.log('Environment: $env');
        console.log('isEligible():', installer.isEligible());

        if (!installer.isEligible()) {
          console.log('Result: not_eligible');
          process.exit(0);
        }

        console.log('Running install()...');
        await installer.install();

        const installed = await installer.isInstalled();
        console.log('isInstalled():', installed);

        if (installed) {
          console.log('Result: pass');
        } else {
          console.log('Result: fail (isInstalled returned false)');
          process.exit(1);
        }
      } catch (err) {
        console.error('Result: fail');
        console.error('Error:', err.message);
        process.exit(1);
      }
    })();
  "

  if [ $? -eq 0 ]; then
    echo "✓ Test passed for $env"
  else
    echo "✗ Test failed for $env"
  fi

  echo ""
done

echo "All tests completed!"
