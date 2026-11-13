import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import type { UserSession } from '../services/storageService';
import { LoginScreen } from '../screens/LoginScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { ScannerScreen } from '../screens/ScannerScreen';
import { SearchScreen } from '../screens/SearchScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

interface AppNavigatorProps {
  /** Session restored before the splash screen hid; null = show Login. */
  initialSession: UserSession | null;
}

export function AppNavigator({ initialSession }: AppNavigatorProps) {
  return (
    <Stack.Navigator
      initialRouteName={initialSession ? 'Dashboard' : 'Login'}
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen
        name="Dashboard"
        component={DashboardScreen}
        initialParams={initialSession ?? undefined}
      />
      <Stack.Screen
        name="Scanner"
        component={ScannerScreen}
        options={{ animation: 'fade_from_bottom' }}
      />
      <Stack.Screen name="Search" component={SearchScreen} />
    </Stack.Navigator>
  );
}
