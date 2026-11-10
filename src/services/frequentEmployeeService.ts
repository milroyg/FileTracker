import AsyncStorage from '@react-native-async-storage/async-storage';

const FREQUENT_EMPLOYEES_KEY = '@wrd_filetracker:frequent_employees';
const MAX_FREQUENT = 5;

export const FrequentEmployeeService = {
  /**
   * Retrieves frequently marked colleagues for a specific division.
   */
  async getFrequentEmployees(division: string): Promise<string[]> {
    try {
      const data = await AsyncStorage.getItem(`${FREQUENT_EMPLOYEES_KEY}:${division}`);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  /**
   * Records a marked colleague to the frequent list for the division.
   */
  async recordEmployeeUsage(division: string, employeeName: string): Promise<string[]> {
    const trimmed = employeeName.trim();
    if (!trimmed) return [];

    try {
      const key = `${FREQUENT_EMPLOYEES_KEY}:${division}`;
      const recents = await FrequentEmployeeService.getFrequentEmployees(division);
      const filtered = recents.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, MAX_FREQUENT);
      await AsyncStorage.setItem(key, JSON.stringify(updated));
      return updated;
    } catch {
      return [];
    }
  },
};

