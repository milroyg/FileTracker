/**
 * Development-only logger. Release builds stay silent so request parameters
 * (file codes, usernames, employee names) never end up in device logs.
 * This is the only module allowed to touch `console` (see eslint.config.js).
 */
const enabled = typeof __DEV__ !== 'undefined' && __DEV__;

export const logger = {
  debug: (...args: unknown[]) => {
    if (enabled) console.log(...args);
  },
  warn: (...args: unknown[]) => {
    if (enabled) console.warn(...args);
  },
  error: (...args: unknown[]) => {
    if (enabled) console.error(...args);
  },
};
