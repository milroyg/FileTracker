import JailMonkey from 'jail-monkey';
import { logger } from './logger';

/**
 * Whether this device is rooted/jailbroken.
 *
 * - Development builds always pass: emulator images ship with test-keys and
 *   would otherwise block every developer.
 * - If the native module itself is unavailable (not linked into this build),
 *   the check fails open — that's a build problem, not a rooted device.
 */
export function isDeviceCompromised(): boolean {
  if (__DEV__) return false;
  try {
    return JailMonkey.isJailBroken();
  } catch (error) {
    logger.warn('[Security] jail-monkey unavailable:', error);
    return false;
  }
}
