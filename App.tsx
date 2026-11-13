import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Device from 'expo-device';
import * as ScreenOrientation from 'expo-screen-orientation';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { QueryClient, onlineManager } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
// Per-weight imports: the package root would bundle all 18 Inter font files.
import { useFonts } from '@expo-google-fonts/inter/useFonts';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { Inter_800ExtraBold } from '@expo-google-fonts/inter/800ExtraBold';
import { AppNavigator } from './src/navigation/AppNavigator';
import { OfflineBanner } from './src/components/common/OfflineBanner';
import { SecurityBlockScreen } from './src/components/common/SecurityBlockScreen';
import { AppUpdateGate } from './src/components/common/AppUpdateGate';
import { ThemeProvider } from './src/theme/ThemeContext';
import { useOutboxAutoSync } from './src/hooks/useOutbox';
import { isDeviceCompromised } from './src/utils/deviceIntegrity';
import { isOnline } from './src/utils/network';
import { StorageService, type UserSession } from './src/services/storageService';
import { APP_VERSION } from './src/config/appInfo';

// Keep the native splash up through font loading and session restore.
SplashScreen.preventAutoHideAsync().catch(() => {
  // Already hidden/prevented (e.g. Fast Refresh) — never worth blocking startup.
});

// React Query pauses/resumes queries with the device's connectivity.
onlineManager.setEventListener((setOnline) =>
  NetInfo.addEventListener((state) => setOnline(isOnline(state))),
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30 * 1000,
      refetchOnReconnect: true,
    },
  },
});

const PERSIST_MAX_AGE = 1000 * 60 * 60 * 24 * 7; // 7 days

// Only queries that opt in with `meta: { persist: true }` (the directory) are
// written to disk; search results are always fetched live.
const persistOptions = {
  persister: createAsyncStoragePersister({ storage: AsyncStorage, throttleTime: 1000 }),
  maxAge: PERSIST_MAX_AGE,
  buster: APP_VERSION,
  dehydrateOptions: {
    shouldDehydrateQuery: (query: { state: { status: string }; meta?: Record<string, unknown> }) =>
      query.state.status === 'success' && query.meta?.persist === true,
  },
};

function AppShell({ initialSession }: { initialSession: UserSession | null }) {
  useOutboxAutoSync();

  return (
    <>
      <NavigationContainer>
        <AppNavigator initialSession={initialSession} />
      </NavigationContainer>
      <OfflineBanner />
      <AppUpdateGate />
    </>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });
  // undefined = still reading SecureStore; null = logged out.
  const [session, setSession] = useState<UserSession | null | undefined>(undefined);
  // A rooted/jailbroken state doesn't change mid-session: check once per launch.
  const [isCompromised] = useState(isDeviceCompromised);

  useEffect(() => {
    StorageService.getSession().then(setSession);
  }, []);

  // Orientation is unlocked in app.config.js (Play Console flags hardcoded
  // locks); phones are kept portrait here, tablets/foldables may rotate.
  useEffect(() => {
    (async () => {
      const deviceType = await Device.getDeviceTypeAsync();
      if (deviceType === Device.DeviceType.PHONE) {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      }
    })().catch(() => {
      // Orientation lock is cosmetic; never block startup on it.
    });
  }, []);

  const isReady = fontsLoaded && session !== undefined;

  useEffect(() => {
    if (isReady) SplashScreen.hideAsync().catch(() => {});
  }, [isReady]);

  if (!isReady) return null; // native splash is still covering the screen

  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
      <ThemeProvider>
        <SafeAreaProvider>
          <KeyboardProvider>
            {/* Every screen has a dark header/background, so light icons everywhere. */}
            <StatusBar style="light" />
            {isCompromised ? <SecurityBlockScreen /> : <AppShell initialSession={session} />}
          </KeyboardProvider>
        </SafeAreaProvider>
      </ThemeProvider>
    </PersistQueryClientProvider>
  );
}
