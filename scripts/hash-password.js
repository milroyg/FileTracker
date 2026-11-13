#!/usr/bin/env node
/**
 * Prints the value for EXPO_PUBLIC_ADMIN_PASSWORD_HASH.
 *
 * Usage:
 *   npm run hash-password -- "<new department password>"
 *
 * The salt must match PASSWORD_SALT in src/config/env.ts.
 */
const { createHash } = require('crypto');

const PASSWORD_SALT = 'wrd-filetracker:v1:';
const password = process.argv[2];

if (!password) {
  console.error('Usage: npm run hash-password -- "<password>"');
  process.exit(1);
}
if (password.length < 10) {
  console.warn('Warning: use at least 10 characters — the hash ships inside the app.');
}

console.log(createHash('sha256').update(`${PASSWORD_SALT}${password}`, 'utf8').digest('hex'));
