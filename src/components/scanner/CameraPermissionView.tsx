import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AlertCircle } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { fontFamilies } from '../../theme/typography';
import { AppText } from '../common/AppText';
import { CustomButton } from '../common/CustomButton';

interface CameraPermissionViewProps {
  onRequestPermission: () => void;
  onGoBack: () => void;
}

export function CameraPermissionView({ onRequestPermission, onGoBack }: CameraPermissionViewProps) {
  const { colors, isDark } = useTheme();
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Plain background here, unlike every other screen. */}
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AlertCircle size={48} color={colors.warning} />
      <AppText style={styles.title}>Camera Access Required</AppText>
      <AppText style={[styles.subtitle, { color: colors.textSecondary }]}>
        Camera permission is needed to scan file QR codes and barcodes.
      </AppText>
      <CustomButton
        title="Grant Camera Access"
        onPress={onRequestPermission}
        style={styles.button}
      />
      <TouchableOpacity style={styles.backLink} onPress={onGoBack} accessibilityRole="button">
        <AppText style={[styles.backLinkText, { color: colors.primary }]}>Go Back</AppText>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  title: {
    fontFamily: fontFamilies.bold,
    fontSize: 20,
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  button: {
    width: '100%',
  },
  backLink: {
    marginTop: 16,
    padding: 8,
  },
  backLinkText: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 15,
  },
});
