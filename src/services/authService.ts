import * as Crypto from 'expo-crypto';
import { ENV, PASSWORD_SALT } from '../config/env';

export type PasswordCheck = 'valid' | 'invalid' | 'not_configured';

export async function hashPassword(password: string): Promise<string> {
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${PASSWORD_SALT}${password}`,
  );
  return digest.toLowerCase();
}

/**
 * Checks the shared department password against the configured hash.
 *
 * This is a client-side gate only: the hash ships inside the app, and the
 * API itself accepts unauthenticated requests. Real protection requires the
 * server to verify credentials and issue tokens (see README → Security).
 */
export async function verifyDepartmentPassword(
  password: string,
  expectedHash: string = ENV.ADMIN_PASSWORD_HASH,
): Promise<PasswordCheck> {
  if (!expectedHash) return 'not_configured';
  return (await hashPassword(password)) === expectedHash ? 'valid' : 'invalid';
}
