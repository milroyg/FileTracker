import { useEffect, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { OutboxService } from '../services/outboxService';
import { isOnline } from '../utils/network';

/** Live view of the offline outbox (items, sync state, last sync result). */
export function useOutbox() {
  return useSyncExternalStore(OutboxService.subscribe, OutboxService.getSnapshot);
}

/**
 * Keeps the outbox draining. Mounted once at the app root, it syncs:
 * - on app start (covers actions queued in a previous session),
 * - whenever the connection comes back,
 * - whenever the app returns to the foreground.
 */
export function useOutboxAutoSync() {
  useEffect(() => {
    void OutboxService.sync();

    let wasOnline: boolean | null = null;
    const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      const online = isOnline(state);
      if (online && wasOnline === false) void OutboxService.sync();
      wasOnline = online;
    });

    const appStateSubscription = AppState.addEventListener('change', (status) => {
      if (status === 'active') void OutboxService.sync();
    });

    return () => {
      unsubscribeNetInfo();
      appStateSubscription.remove();
    };
  }, []);
}
