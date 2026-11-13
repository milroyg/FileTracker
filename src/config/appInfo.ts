import Constants from 'expo-constants';

/** User-facing version. Source of truth: package.json → app.config.js → native build. */
export const APP_VERSION: string = Constants.expoConfig?.version ?? '0.0.0';

export const APP_NAME: string = Constants.expoConfig?.name ?? 'WRD File Tracker';
