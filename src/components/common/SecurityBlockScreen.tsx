import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ShieldAlert } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { fontFamilies } from '../../theme/typography';
import { AppText } from './AppText';

/**
 * Full-screen, non-dismissible takeover rendered instead of the app when the
 * device is rooted/jailbroken. There is deliberately no way through.
 */
export function SecurityBlockScreen() {
  const { colors } = useTheme();
  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.iconCircle, { backgroundColor: colors.errorBadge }]}>
        <ShieldAlert size={40} color={colors.error} strokeWidth={2} />
      </View>
      <AppText style={styles.title}>Access Restricted</AppText>
      <AppText style={[styles.message, { color: colors.textSecondary }]}>
        This device appears to be rooted or jailbroken. To protect government file records, WRD File
        Tracker cannot run on modified devices.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  title: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 21,
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontFamily: fontFamilies.medium,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
});
