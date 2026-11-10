export interface ThemeColors {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  accent: string;
  background: string;
  cardBackground: string;
  surface: string;
  inputBackground: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  error: string;
  success: string;
  warning: string;
  white: string;
  black: string;
  shadow: string;
  tableHeader: string;
  tableRowEven: string;
  tableRowOdd: string;
  badgeBackground: string;
  badgeText: string;
  
  // High-contrast Header & Banner Tokens
  headerBackground: string;
  headerText: string;
  headerSubtext: string;
  headerButtonBackground: string;
  headerCardBackground: string;
  
  // Overlay & Modal Tokens
  overlay: string;
  overlayLight: string;

  // Scanner & Camera Tokens
  scannerFrame: string;
  scannerOverlay: string;

  isDark: boolean;
}

export const lightColors: ThemeColors = {
  primary: '#0C1DBB',       // Goa WRD Royal Blue
  primaryLight: '#4c73fd',
  primaryDark: '#08137a',
  accent: '#2563eb',
  background: '#f8fafc',
  cardBackground: '#ffffff',
  surface: '#f1f5f9',
  inputBackground: '#ffffff',
  text: '#0f172a',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
  border: '#e2e8f0',
  error: '#ef4444',
  success: '#10b981',
  warning: '#f59e0b',
  white: '#ffffff',
  black: '#000000',
  shadow: '#000000',
  tableHeader: '#4c73fd',
  tableRowEven: '#ffffff',
  tableRowOdd: '#f8fafc',
  badgeBackground: '#eff6ff',
  badgeText: '#0C1DBB',
  
  headerBackground: '#0C1DBB',
  headerText: '#ffffff',
  headerSubtext: 'rgba(255, 255, 255, 0.85)',
  headerButtonBackground: 'rgba(255, 255, 255, 0.18)',
  headerCardBackground: 'rgba(255, 255, 255, 0.12)',

  overlay: 'rgba(0, 0, 0, 0.6)',
  overlayLight: 'rgba(0, 0, 0, 0.4)',

  scannerFrame: '#4c73fd',
  scannerOverlay: 'rgba(0, 0, 0, 0.6)',

  isDark: false,
};

export const darkColors: ThemeColors = {
  primary: '#4c73fd',       // Accessible vibrant blue on dark surfaces
  primaryLight: '#60a5fa',
  primaryDark: '#1e40af',
  accent: '#38bdf8',
  background: '#0a0f1d',    // Deep slate-navy
  cardBackground: '#131b2e',// Elevated card slate
  surface: '#1c263f',
  inputBackground: '#0e1526',
  text: '#f8fafc',          // High readability slate-50
  textSecondary: '#94a3b8', // Muted slate-400
  textMuted: '#64748b',
  border: '#22304d',
  error: '#f87171',
  success: '#34d399',
  warning: '#fbbf24',
  white: '#ffffff',
  black: '#000000',
  shadow: '#000000',
  tableHeader: '#1e3a8a',
  tableRowEven: '#131b2e',
  tableRowOdd: '#0b1120',
  badgeBackground: 'rgba(76, 115, 253, 0.16)',
  badgeText: '#93c5fd',

  headerBackground: '#131b2e',
  headerText: '#f8fafc',
  headerSubtext: '#94a3b8',
  headerButtonBackground: '#1c263f',
  headerCardBackground: '#1c263f',

  overlay: 'rgba(0, 0, 0, 0.75)',
  overlayLight: 'rgba(0, 0, 0, 0.5)',

  scannerFrame: '#60a5fa',
  scannerOverlay: 'rgba(0, 0, 0, 0.75)',

  isDark: true,
};

// Default fallback for non-hook contexts
export const colors = lightColors;
