import * as SecureStore from 'expo-secure-store';
import { logger } from '../utils/logger';

const KEY_LOGGED_IN = 'WRD_LOGGED_IN';
const KEY_USERNAME = 'WRD_USERNAME';
const KEY_DIVISION = 'WRD_DIVISION';

export interface UserSession {
  username: string;
  division: string;
}

export const StorageService = {
  async saveSession({ username, division }: UserSession): Promise<void> {
    await Promise.all([
      SecureStore.setItemAsync(KEY_USERNAME, username),
      SecureStore.setItemAsync(KEY_DIVISION, division),
    ]);
    // Written last so a half-saved session is never treated as logged in.
    await SecureStore.setItemAsync(KEY_LOGGED_IN, 'true');
  },

  /** The saved session, or null when logged out / unreadable. */
  async getSession(): Promise<UserSession | null> {
    try {
      const [loggedIn, username, division] = await Promise.all([
        SecureStore.getItemAsync(KEY_LOGGED_IN),
        SecureStore.getItemAsync(KEY_USERNAME),
        SecureStore.getItemAsync(KEY_DIVISION),
      ]);
      return loggedIn === 'true' && username && division ? { username, division } : null;
    } catch (error) {
      logger.warn('[StorageService] Could not read session:', error);
      return null;
    }
  },

  async clearSession(): Promise<void> {
    await SecureStore.deleteItemAsync(KEY_LOGGED_IN);
    await Promise.all([
      SecureStore.deleteItemAsync(KEY_USERNAME),
      SecureStore.deleteItemAsync(KEY_DIVISION),
    ]);
  },
};
