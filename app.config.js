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
    // Artwork sits inside the 66dp safe-zone circle of the 108dp canvas, so no
    // launcher mask (circle, squircle, rounded square) crops it.
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      // Android 13+ themed icons: single-colour glyph tinted by the system.
      monochromeImage: './assets/adaptive-icon-monochrome.png',
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
    // Splash options must be passed here: the plugin ignores the old top-level
    // `splash` key. Android 12+ crops the image to a circle of 2/3 its size,
    // so the artwork is padded to sit inside that circle.
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#ffffff',
        dark: {
          image: './assets/splash-icon.png',
          backgroundColor: '#0a0f1d',
        },
      },
    ],
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
