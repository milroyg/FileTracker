import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { QueryClient, onlineManager } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { AppNavigator } from './src/navigation/AppNavigator';
import { OfflineBanner } from './src/components/common/OfflineBanner';
import { checkDeviceIntegrity } from './src/config/security';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';

// Keep the splash screen visible while fonts are loading
SplashScreen.preventAutoHideAsync().catch(() => { });

// 1. Network-aware auto-sync: Automatically re-syncs stale queries when network reconnects
onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state: NetInfoState) => {
    setOnline(!!state.isConnected);
  });
});

// 2. QueryClient with optimized offline-first defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 60 * 6, // 6 hours fresh
      gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days offline retention
      refetchOnReconnect: true,
      refetchOnMount: false,
    },
  },
});

// 3. AsyncStorage Persister: Persists in-memory cache to disk for zero-delay offline cold starts
const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  throttleTime: 1000,
});

function AppShell() {
  const { colors } = useTheme();

  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor={colors.primary}
      />
      <OfflineBanner />
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
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

  useEffect(() => {
    // 4. Hardware root & tamper protection check on app launch
    checkDeviceIntegrity();
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => { });
    }
  }, [fontsLoaded]);

  // Wait until the compulsory font is loaded to prevent any layout shifts
  if (!fontsLoaded) {
    return null;
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: asyncStoragePersister,
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      }}
    >
      <ThemeProvider>
        <SafeAreaProvider>
          <KeyboardProvider>
            <AppShell />
          </KeyboardProvider>
        </SafeAreaProvider>
      </ThemeProvider>
    </PersistQueryClientProvider>
  );
}
