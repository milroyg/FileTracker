// Dynamic Expo config. package.json's `version` is the single source of truth
// for the user-facing version; the store build number (Android versionCode /
// iOS buildNumber) is managed remotely by EAS (eas.json → appVersionSource).
const { version } = require('./package.json');

const EAS_PROJECT_ID = '457fc8f5-6795-4407-b787-10765272a0eb';

// Never throw here: every `eas` CLI command resolves this file first, so a
// missing variable must stay fixable through the CLI. Warn loudly instead.
if (!process.env.EXPO_PUBLIC_ADMIN_PASSWORD_HASH) {
  console.warn(
    'EXPO_PUBLIC_ADMIN_PASSWORD_HASH is not set — the login screen will reject every password. ' +
      'Generate one with `npm run hash-password` and register it on EAS (see README).',
  );
}

module.exports = ({ config }) => ({
  ...config,
  name: 'WRD File Tracker',
  slug: 'wrd-filetracker',
  version,
  // 'default' (no hardcoded lock in the manifest/Info.plist): Play Console
  // flags hardcoded orientation, and Android 16 ignores it on large screens
  // anyway. App.tsx locks phones to portrait at runtime instead.
  orientation: 'default',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.wrdfiletracker',
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    // Must stay identical to the legacy native app's applicationId so the
    // Play Store ships this as an update to the existing listing.
    package: 'com.wrdfiletracker',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundImage: './assets/adaptive-icon-background.png',
      backgroundColor: '#ffffff',
    },
    permissions: [
      'android.permission.CAMERA',
      'android.permission.INTERNET',
      'android.permission.ACCESS_NETWORK_STATE',
    ],
    // Not needed by the app (camera captures go to app-private cache, nothing
    // records audio or draws over other apps); block them so neither the
    // Expo template nor a library merges them back in.
    blockedPermissions: [
      'android.permission.RECORD_AUDIO',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.SYSTEM_ALERT_WINDOW',
    ],
  },
  // Lets installed builds pick up OTA JS updates published to their channel
  // (eas.json build-profile `channel`). Without this, `eas update` publishes
  // are never picked up by any binary.
  updates: {
    url: `https://u.expo.dev/${EAS_PROJECT_ID}`,
  },
  // Derives OTA compatibility from the native fingerprint, so an update only
  // reaches binaries it's compatible with (see scripts/check-fingerprint-drift.js).
  runtimeVersion: {
    policy: 'fingerprint',
  },
  plugins: [
    [
      'expo-camera',
      {
        cameraPermission:
          'Allow WRD File Tracker to access your camera to scan file barcodes and QR codes.',
        microphonePermission: false,
        recordAudioAndroid: false,
      },
    ],
    [
      'expo-image-picker',
      {
        cameraPermission:
          'Allow WRD File Tracker to use your camera to photograph file subjects for text recognition.',
        photosPermission: false,
        microphonePermission: false,
      },
    ],
    // SecureStore is used without biometric protection, so no Face ID prompt text.
    ['expo-secure-store', { faceIDPermission: false }],
    'expo-splash-screen',
    [
      'expo-build-properties',
      {
        android: {
          compileSdkVersion: 36,
          targetSdkVersion: 36,
          minSdkVersion: 26,
          enableProguardInReleaseBuilds: true,
          enableMinifyInReleaseBuilds: true,
        },
        ios: {
          deploymentTarget: '16.4',
        },
      },
    ],
  ],
  extra: {
    ...config?.extra,
    eas: {
      projectId: EAS_PROJECT_ID,
    },
  },
});
