import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';

/**
 * Single definition of "online" used everywhere (banner, modals, sync).
 * `isInternetReachable` is `null` while NetInfo is still probing, which is
 * treated as reachable so the app never blocks on an unfinished check.
 */
export function isOnline(state: Pick<NetInfoState, 'isConnected' | 'isInternetReachable'>) {
  return state.isConnected !== false && state.isInternetReachable !== false;
}

export async function fetchIsOnline(): Promise<boolean> {
  return isOnline(await NetInfo.fetch());
}
