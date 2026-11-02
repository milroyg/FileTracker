import * as SecureStore from 'expo-secure-store';

const KEY_LOGGED_IN = 'WRD_LOGGED_IN';
const KEY_USERNAME = 'WRD_USERNAME';
const KEY_DIVISION = 'WRD_DIVISION';

export interface UserSession {
  isLoggedIn: boolean;
  username: string;
  division: string;
}

export const StorageService = {
  async saveSession(username: string, division: string): Promise<void> {
    await SecureStore.setItemAsync(KEY_LOGGED_IN, 'true');
    await SecureStore.setItemAsync(KEY_USERNAME, username);
    await SecureStore.setItemAsync(KEY_DIVISION, division);
  },

  async getSession(): Promise<UserSession> {
    const loggedIn = await SecureStore.getItemAsync(KEY_LOGGED_IN);
    const username = await SecureStore.getItemAsync(KEY_USERNAME);
    const division = await SecureStore.getItemAsync(KEY_DIVISION);

    return {
      isLoggedIn: loggedIn === 'true',
      username: username || '',
      division: division || '',
    };
  },

  async clearSession(): Promise<void> {
    await SecureStore.deleteItemAsync(KEY_LOGGED_IN);
    await SecureStore.deleteItemAsync(KEY_USERNAME);
    await SecureStore.deleteItemAsync(KEY_DIVISION);
  },
};

