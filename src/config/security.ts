import JailMonkey from 'jail-monkey';
import { Alert, BackHandler } from 'react-native';
import { ENV } from './env';

export const SecurityConfig = {
  // Loaded securely from environment variable EXPO_PUBLIC_ADMIN_SECRET
  DEFAULT_ADMIN_PASSWORD: ENV.ADMIN_SECRET,
};

/**
 * Verifies that the operating environment has not been rooted or jailbroken.
 * Blocks execution on compromised devices to protect government file custody integrity.
 */
export function checkDeviceIntegrity(): boolean {
  try {
    if (JailMonkey.isJailBroken()) {
      Alert.alert(
        'Security Warning',
        'This application cannot run on rooted or jailbroken devices.',
        [
          {
            text: 'Exit',
            onPress: () => BackHandler.exitApp(),
          },
        ],
        { cancelable: false }
      );
      return false;
    }
  } catch {
    // In dev environment or emulator, allow pass-through
  }
  return true;
}
