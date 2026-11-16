import { Platform } from 'react-native';

/**
 * iOS silently refuses to present a modal while the previous one is still
 * animating out. When one modal replaces another, open the next one after
 * this delay (no delay needed on Android).
 */
export const MODAL_SWAP_DELAY_MS = Platform.OS === 'ios' ? 400 : 0;
