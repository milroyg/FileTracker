module.exports = ({ config }) => {
  return {
    ...config,
    name: 'WRD File Tracker',
    slug: 'wrd-filetracker',
    version: '2.0.0',
    orientation: 'portrait',
    icon: './assets/logo.png',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    splash: {
      image: './assets/logo.png',
      resizeMode: 'contain',
      backgroundColor: '#1e3a8a',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.wrdfiletracker',
      infoPlist: {
        NSCameraUsageDescription:
          'WRD File Tracker requires camera access to scan file QR codes and extract file subjects via OCR.',
        NSPhotoLibraryUsageDescription:
          'WRD File Tracker requires photo library access to select file documents.',
      },
    },
    android: {
      package: 'com.wrdfiletracker',
      adaptiveIcon: {
        foregroundImage: './assets/logo.png',
        backgroundColor: '#1e3a8a',
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
      eas: {
        projectId: '457fc8f5-6795-4407-b787-10765272a0eb',
      },
    },
  };
};

