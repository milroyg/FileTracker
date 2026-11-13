import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Flashlight, FlashlightOff, Keyboard } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { fontFamilies } from '../../theme/typography';
import { AppText } from '../common/AppText';

interface ScannerOverlayProps {
  torchEnabled: boolean;
  username: string;
  division: string;
  onClose: () => void;
  onToggleTorch: () => void;
  onManualEntry: () => void;
}

/** Controls and viewfinder frame drawn over the live camera. */
export function ScannerOverlay({
  torchEnabled,
  username,
  division,
  onClose,
  onToggleTorch,
  onManualEntry,
}: ScannerOverlayProps) {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={styles.overlay}>
      <View style={styles.topBar}>
        <TouchableOpacity
          style={[styles.controlCircle, { backgroundColor: colors.overlayLight }]}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close scanner"
        >
          <X size={24} color={colors.white} />
        </TouchableOpacity>

        <AppText style={[styles.title, { color: colors.white }]}>Scan File Code</AppText>

        <TouchableOpacity
          style={[styles.controlCircle, { backgroundColor: colors.overlayLight }]}
          onPress={onToggleTorch}
          accessibilityRole="switch"
          accessibilityState={{ checked: torchEnabled }}
          accessibilityLabel="Flashlight"
        >
          {torchEnabled ? (
            <FlashlightOff size={22} color={colors.warning} />
          ) : (
            <Flashlight size={22} color={colors.white} />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.viewfinderCenter}>
        <View style={styles.scanTargetBox}>
          <View style={[styles.corner, styles.cornerTL, { borderColor: colors.scannerFrame }]} />
          <View style={[styles.corner, styles.cornerTR, { borderColor: colors.scannerFrame }]} />
          <View style={[styles.corner, styles.cornerBL, { borderColor: colors.scannerFrame }]} />
          <View style={[styles.corner, styles.cornerBR, { borderColor: colors.scannerFrame }]} />
        </View>
        <AppText
          style={[
            styles.instructionBanner,
            { color: colors.white, backgroundColor: colors.scannerOverlay },
          ]}
        >
          Align QR or Barcode within the frame
        </AppText>
      </View>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[
            styles.manualEntryBtn,
            { backgroundColor: colors.overlayLight, borderColor: colors.headerButtonBackground },
          ]}
          activeOpacity={0.8}
          onPress={onManualEntry}
          accessibilityRole="button"
        >
          <Keyboard size={18} color={colors.white} style={styles.manualEntryIcon} />
          <AppText style={[styles.manualEntryText, { color: colors.white }]}>
            Enter Code Manually
          </AppText>
        </TouchableOpacity>

        <AppText style={[styles.bottomUserText, { color: colors.headerSubtext }]}>
          Logged in as <AppText style={[styles.bold, { color: colors.white }]}>{username}</AppText>{' '}
          ({division})
        </AppText>
      </View>
    </SafeAreaView>
  );
}

const CORNER_WIDTH = 4;
const CORNER_RADIUS = 12;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  controlCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: fontFamilies.bold,
    fontSize: 18,
  },
  viewfinderCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanTargetBox: {
    width: 260,
    height: 260,
  },
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderTopLeftRadius: CORNER_RADIUS,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderTopRightRadius: CORNER_RADIUS,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderBottomLeftRadius: CORNER_RADIUS,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderBottomRightRadius: CORNER_RADIUS,
  },
  instructionBanner: {
    fontFamily: fontFamilies.semiBold,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 24,
    fontSize: 14,
    overflow: 'hidden',
  },
  bottomBar: {
    alignItems: 'center',
    paddingBottom: 24,
    gap: 12,
  },
  manualEntryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
  },
  manualEntryIcon: {
    marginRight: 8,
  },
  manualEntryText: {
    fontFamily: fontFamilies.bold,
    fontSize: 14,
  },
  bottomUserText: {
    fontSize: 13,
  },
  bold: {
    fontFamily: fontFamilies.bold,
  },
});
