#!/usr/bin/env node

/**
 * Network Connectivity Utilities
 *
 * Platform-agnostic utilities for checking network connectivity.
 */

const dns = require('dns');
const https = require('https');
const http = require('http');

/**
 * Checks if the machine has internet connectivity
 * @param {number} [timeout=5000] - Timeout in milliseconds
 * @returns {Promise<boolean>}
 */
async function isOnline(timeout = 5000) {
  // Try multiple reliable hosts in case one is blocked
  const hosts = [
    'dns.google',
    'cloudflare.com',
    '1.1.1.1'
  ];

  for (const host of hosts) {
    const reachable = await canReach(host, timeout);
    if (reachable) {
      return true;
    }
  }

  return false;
}

/**
 * Tests if a specific hostname is reachable
 * @param {string} hostname - The hostname to check
 * @param {number} [timeout=5000] - Timeout in milliseconds
 * @returns {Promise<boolean>}
 */
async function canReach(hostname, timeout = 5000) {
  return new Promise((resolve) => {
    // First try DNS lookup
    const timer = setTimeout(() => {
      resolve(false);
    }, timeout);

    dns.lookup(hostname, (err) => {
      clearTimeout(timer);
      if (err) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

/**
 * Tests if a URL is reachable via HTTP(S) request
 * @param {string} url - The URL to check
 * @param {number} [timeout=5000] - Timeout in milliseconds
 * @returns {Promise<boolean>}
 */
async function canFetch(url, timeout = 5000) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      resolve(false);
    }, timeout);

    const protocol = url.startsWith('https') ? https : http;

    const req = protocol.get(url, { timeout }, (res) => {
      clearTimeout(timer);
      // Consider 2xx and 3xx as success
      resolve(res.statusCode >= 200 && res.statusCode < 400);
      res.destroy();
    });

    req.on('error', () => {
      clearTimeout(timer);
      resolve(false);
    });

    req.on('timeout', () => {
      clearTimeout(timer);
      req.destroy();
      resolve(false);
    });
  });
}

/**
 * Gets the public IP address of the machine
 * @param {number} [timeout=5000] - Timeout in milliseconds
 * @returns {Promise<string|null>}
 */
async function getPublicIP(timeout = 5000) {
  const services = [
    'https://api.ipify.org',
    'https://icanhazip.com',
    'https://ifconfig.me/ip'
  ];

  for (const service of services) {
    try {
      const ip = await fetchText(service, timeout);
      if (ip && isValidIP(ip.trim())) {
        return ip.trim();
      }
    } catch {
      continue;
    }
  }

  return null;
}

/**
 * Fetches text content from a URL
 * @param {string} url - The URL to fetch
 * @param {number} [timeout=5000] - Timeout in milliseconds
 * @returns {Promise<string>}
 */
async function fetchText(url, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Timeout'));
    }, timeout);

    const protocol = url.startsWith('https') ? https : http;

    const req = protocol.get(url, { timeout }, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        clearTimeout(timer);
        resolve(data);
      });
    });

    req.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });

    req.on('timeout', () => {
      clearTimeout(timer);
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

/**
 * Validates an IP address format
 * @param {string} ip - The IP to validate
 * @returns {boolean}
 */
function isValidIP(ip) {
  // IPv4 regex
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  // IPv6 regex (simplified)
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;

  if (ipv4Regex.test(ip)) {
    const parts = ip.split('.');
    return parts.every((part) => {
      const num = parseInt(part, 10);
      return num >= 0 && num <= 255;
    });
  }

  return ipv6Regex.test(ip);
}

module.exports = {
  isOnline,
  canReach,
  canFetch,
  getPublicIP
};
