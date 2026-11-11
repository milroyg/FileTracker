const APP_VERSION = '2.0.0';

module.exports = ({ config }) => {
  return {
    ...config,
    name: 'WRD File Tracker',
    slug: 'wrd-filetracker',
    version: APP_VERSION,
    orientation: 'portrait',
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
        NSCameraUsageDescription:
          'WRD File Tracker requires camera access to scan file QR codes and extract file subjects via OCR.',
        NSPhotoLibraryUsageDescription:
          'WRD File Tracker requires photo library access to select file documents.',
      },
    },
    android: {
      package: 'com.wrdfiletracker',
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      permissions: [
        'android.permission.CAMERA',
        'android.permission.INTERNET',
        'android.permission.ACCESS_NETWORK_STATE',
        'android.permission.RECORD_AUDIO',
      ],
    },
    plugins: [
      [
        'expo-camera',
        {
          cameraPermission:
            'Allow WRD File Tracker to access your camera to scan file barcodes and QR codes.',
        },
      ],
      [
        'expo-image-picker',
        {
          photosPermission: 'Allow WRD File Tracker to access your photos.',
        },
      ],
      'expo-secure-store',
      'expo-sharing',
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
      version: APP_VERSION,
      eas: {
        projectId: '457fc8f5-6795-4407-b787-10765272a0eb',
      },
    },
  };
};

