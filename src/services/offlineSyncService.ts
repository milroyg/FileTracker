import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { FileTrackerApi } from '../api/fileTrackerApi';

export interface PendingMovementAction {
  id: string;
  type: 'MARK_EMPLOYEE' | 'REGISTER_FILE';
  code: string;
  username: string;
  employee?: string;
  filename?: string;
  timestamp: number;
}

const OUTBOX_STORAGE_KEY = '@wrd_filetracker:offline_outbox';

export const OfflineSyncService = {
  /**
   * Retrieves all actions currently pending in the offline outbox.
   */
  async getOutbox(): Promise<PendingMovementAction[]> {
    try {
      const data = await AsyncStorage.getItem(OUTBOX_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  /**
   * Queues a file movement action to be dispatched when network returns.
   */
  async queueMarkEmployee(code: string, username: string, employee: string): Promise<void> {
    const action: PendingMovementAction = {
      id: `mark_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type: 'MARK_EMPLOYEE',
      code: code.trim(),
      username: username.trim(),
      employee: employee.trim(),
      timestamp: Date.now(),
    };
    await OfflineSyncService.addToOutbox(action);
  },

  /**
   * Queues a file registration action to be dispatched when network returns.
   */
  async queueRegisterFile(code: string, username: string, filename: string): Promise<void> {
    const action: PendingMovementAction = {
      id: `reg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type: 'REGISTER_FILE',
      code: code.trim(),
      username: username.trim(),
      filename: filename.trim(),
      timestamp: Date.now(),
    };
    await OfflineSyncService.addToOutbox(action);
  },

  /**
   * Appends an action to the local outbox.
   */
  async addToOutbox(action: PendingMovementAction): Promise<void> {
    try {
      const current = await OfflineSyncService.getOutbox();
      const updated = [...current, action];
      await AsyncStorage.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('[OfflineSync] Failed to queue offline action:', e);
    }
  },

  /**
   * Sequentially drains and syncs the offline outbox when network connectivity is confirmed.
   */
  async syncOutbox(): Promise<{ syncedCount: number; remainingCount: number }> {
    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      const remaining = await OfflineSyncService.getOutbox();
      return { syncedCount: 0, remainingCount: remaining.length };
    }

    const outbox = await OfflineSyncService.getOutbox();
    if (outbox.length === 0) {
      return { syncedCount: 0, remainingCount: 0 };
    }

    const remaining: PendingMovementAction[] = [];
    let syncedCount = 0;

    for (const item of outbox) {
      try {
        if (item.type === 'MARK_EMPLOYEE' && item.employee) {
          const res = await FileTrackerApi.markFileToEmployee(
            item.code,
            item.username,
            item.employee
          );
          if (res === 'Ok' || res === 'File not in System') {
            syncedCount++;
          } else {
            remaining.push(item);
          }
        } else if (item.type === 'REGISTER_FILE' && item.filename) {
          await FileTrackerApi.registerNewFile(item.code, item.filename);
          syncedCount++;
        }
      } catch (err) {
        console.warn(`[OfflineSync] Sync failed for item ${item.id}:`, err);
        remaining.push(item);
      }
    }

    await AsyncStorage.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(remaining));
    return { syncedCount, remainingCount: remaining.length };
  },
};

