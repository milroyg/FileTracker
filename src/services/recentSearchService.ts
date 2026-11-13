import AsyncStorage from '@react-native-async-storage/async-storage';

const RECENT_SEARCHES_KEY = '@wrd_filetracker:recent_searches';
const MAX_RECENTS = 5;

export const RecentSearchService = {
  /**
   * Retrieves the list of recent search queries from persistent storage.
   */
  async getRecentSearches(): Promise<string[]> {
    try {
      const data = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  /**
   * Adds a search query to recents, keeping unique entries up to MAX_RECENTS.
   */
  async addRecentSearch(query: string): Promise<string[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    try {
      const recents = await RecentSearchService.getRecentSearches();
      const filtered = recents.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, MAX_RECENTS);
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      return updated;
    } catch {
      return [];
    }
  },

  /**
   * Clears all recent searches from persistent storage.
   */
  async clearRecentSearches(): Promise<void> {
    try {
      await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
      // Non-fatal
    }
  },
};
