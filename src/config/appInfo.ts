import Constants from 'expo-constants';

/**
 * Dynamically resolves the application version from app.config.js.
 * Reads Constants.expoConfig.version or Constants.expoConfig.extra.version
 * with a fallback for static or test environments.
 */
export const APP_VERSION: string =
  Constants.expoConfig?.version ??
  (Constants.expoConfig?.extra?.version as string | undefined) ??
  '2.0.0';

export const APP_NAME: string =
  Constants.expoConfig?.name ?? 'WRD File Tracker';

