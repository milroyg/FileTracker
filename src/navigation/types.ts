import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Login: undefined;
  Dashboard: {
    username: string;
    division: string;
  };
  Scanner: {
    username: string;
    division: string;
  };
  Search: { initialCode?: string } | undefined;
};

export type LoginScreenProps = NativeStackScreenProps<RootStackParamList, 'Login'>;
export type DashboardScreenProps = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;
export type ScannerScreenProps = NativeStackScreenProps<RootStackParamList, 'Scanner'>;
export type SearchScreenProps = NativeStackScreenProps<RootStackParamList, 'Search'>;
