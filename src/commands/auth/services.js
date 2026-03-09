'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const AUTH_DIR = path.join(os.homedir(), '.devutils', 'auth');
const CLIENTS_DIR = path.join(AUTH_DIR, 'clients');

/**
 * Registry of all supported authentication services.
 * Each entry describes how the service authenticates and what credentials it needs.
 *
 * - OAuth services use a browser-based consent flow (e.g., Google).
 * - API key services prompt the user for static credentials (e.g., AWS, Cloudflare).
 *
 * This object is the single source of truth for all auth commands (login, logout,
 * list, status, refresh). Add new services here -- all commands will pick them up.
 */
const AUTH_SERVICES = {
  google: {
    type: 'oauth',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    revokeUrl: 'https://oauth2.googleapis.com/revoke',
    defaultScopes: ['openid', 'email', 'profile'],
    clientFile: 'google.json'
  },
  aws: {
    type: 'api-key',
    fields: ['accessKeyId', 'secretAccessKey', 'region'],
    fieldLabels: ['AWS Access Key ID', 'AWS Secret Access Key', 'Default Region']
  },
  cloudflare: {
    type: 'api-key',
    fields: ['apiToken'],
    fieldLabels: ['Cloudflare API Token']
  },
  dokploy: {
    type: 'api-key',
    fields: ['apiUrl', 'apiToken'],
    fieldLabels: ['Dokploy API URL', 'Dokploy API Token']
  },
  namecheap: {
    type: 'api-key',
    fields: ['apiUser', 'apiKey', 'clientIp'],
    fieldLabels: ['Namecheap API User', 'API Key', 'Whitelisted Client IP']
  },
  flowroute: {
    type: 'api-key',
    fields: ['accessKey', 'secretKey'],
    fieldLabels: ['Flowroute Access Key', 'Secret Key']
  },
  mailu: {
    type: 'api-key',
    fields: ['apiUrl', 'apiKey'],
    fieldLabels: ['Mailu API URL', 'API Key']
  }
};

/**
 * Read a credential file from ~/.devutils/auth/<service>.json.
 * Returns the parsed JSON content, or null if the file is missing or invalid.
 *
 * @param {string} service - The service name (e.g., 'google', 'aws').
 * @returns {object|null} The parsed credential data, or null.
 */
function readCredential(service) {
  const filePath = path.join(AUTH_DIR, `${service}.json`);
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Determine the status of a credential.
 * - 'missing' means no credential file exists.
 * - 'valid' means the credential exists and (for OAuth) is not expired.
 * - 'expired' means the OAuth token's expiresAt is in the past.
 * - 'unknown' means the credential exists but can't be evaluated.
 *
 * @param {object|null} credential - The parsed credential data from readCredential().
 * @returns {string} One of 'missing', 'valid', 'expired', 'unknown'.
 */
function getTokenStatus(credential) {
  if (!credential) return 'missing';
  if (credential.type === 'api-key') return 'valid';
  if (credential.type === 'oauth') {
    if (!credential.expiresAt) return 'unknown';
    return new Date(credential.expiresAt) > new Date() ? 'valid' : 'expired';
  }
  return 'unknown';
}

/**
 * Check if a field name looks like it holds sensitive data.
 * Fields with "secret", "key", "token", or "password" in the name
 * should be masked in output and use password-style input.
 *
 * @param {string} fieldName - The field name to check.
 * @returns {boolean} True if the field is sensitive.
 */
function isSensitiveField(fieldName) {
  const lower = fieldName.toLowerCase();
  return lower.includes('secret') ||
    lower.includes('key') ||
    lower.includes('token') ||
    lower.includes('password');
}

/**
 * Mask a sensitive value for display.
 * Shows the first 4 and last 3 characters for partially-sensitive values,
 * or '****' for fully-sensitive ones.
 *
 * @param {string} value - The value to mask.
 * @param {boolean} fullMask - If true, mask the entire value with '****'.
 * @returns {string} The masked value.
 */
function maskValue(value, fullMask) {
  if (!value || typeof value !== 'string') return '****';
  if (fullMask) return '****';
  if (value.length <= 8) return '****';
  return value.substring(0, 4) + '...' + value.substring(value.length - 3);
}

/**
 * Format a time difference as a human-readable string.
 * Handles both future ("47 minutes") and past ("expired 12 minutes ago") times.
 *
 * @param {Date} target - The target time (e.g., expiresAt).
 * @param {Date} now - The current time.
 * @returns {string} Human-readable duration string.
 */
function formatTimeDiff(target, now) {
  const diffMs = target.getTime() - now.getTime();
  const absDiffMs = Math.abs(diffMs);
  const isPast = diffMs < 0;

  let value;
  if (absDiffMs < 60000) {
    value = 'less than a minute';
  } else if (absDiffMs < 3600000) {
    const mins = Math.floor(absDiffMs / 60000);
    value = `${mins} minute${mins === 1 ? '' : 's'}`;
  } else if (absDiffMs < 86400000) {
    const hours = Math.floor(absDiffMs / 3600000);
    value = `${hours} hour${hours === 1 ? '' : 's'}`;
  } else {
    const days = Math.floor(absDiffMs / 86400000);
    value = `${days} day${days === 1 ? '' : 's'}`;
  }

  return isPast ? `expired ${value} ago` : value;
}

module.exports = {
  AUTH_SERVICES,
  AUTH_DIR,
  CLIENTS_DIR,
  readCredential,
  getTokenStatus,
  isSensitiveField,
  maskValue,
  formatTimeDiff
};
