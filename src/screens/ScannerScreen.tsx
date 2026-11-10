import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { X, Flashlight, FlashlightOff, AlertCircle } from 'lucide-react-native';
import { ScannerScreenProps } from '../navigation/types';
import { useTheme } from '../theme/ThemeContext';
import { fontFamilies } from '../theme/typography';
import { useDirectory } from '../hooks/useDirectory';
import { EmployeeSelectModal } from '../components/EmployeeSelectModal';
import { RegisterFileModal } from '../components/RegisterFileModal';
import { CustomButton } from '../components/common/CustomButton';

export function ScannerScreen({ route, navigation }: ScannerScreenProps) {
  const { colors } = useTheme();
  const { username, division } = route.params;
  const { data: directory } = useDirectory();

  const [permission, requestPermission] = useCameraPermissions();
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [isScanningActive, setIsScanningActive] = useState(true);
  const [scannedCode, setScannedCode] = useState<string | null>(null);

  // Modals state
  const [employeeModalVisible, setEmployeeModalVisible] = useState(false);
  const [registerModalVisible, setRegisterModalVisible] = useState(false);

  // Lock to avoid multi-firing
  const scanLockRef = useRef(false);

  const divisionEmployees = directory?.employeesByDivision[division] || directory?.allEmployees || [];

  if (!permission) {
    return <View style={[styles.darkBackground, { backgroundColor: colors.black }]} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.permissionContainer, { backgroundColor: colors.background }]}>
        <AlertCircle size={48} color={colors.warning} />
        <Text style={[styles.permissionTitle, { color: colors.text }]}>Camera Access Required</Text>
        <Text style={[styles.permissionSubtitle, { color: colors.textSecondary }]}>
          Camera permission is needed to scan file QR codes and barcodes.
        </Text>
        <CustomButton
          title="Grant Camera Access"
          onPress={requestPermission}
          style={styles.permissionButton}
        />
        <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
          <Text style={[styles.backLinkText, { color: colors.primary }]}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const handleBarcodeScanned = (result: BarcodeScanningResult) => {
    if (!isScanningActive || scanLockRef.current) return;
    scanLockRef.current = true;
    setIsScanningActive(false);

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Haptics fallback
    }

    const rawData = result.data || '';
    const cleanCode = rawData.split(';')[0]?.trim() || rawData.trim();

    setScannedCode(cleanCode);
    setEmployeeModalVisible(true);
  };

  // 1.5-second cooldown flag to prevent 60 scan triggers per second
  const resumeScanning = () => {
    setTimeout(() => {
      scanLockRef.current = false;
      setIsScanningActive(true);
      setScannedCode(null);
    }, 1500);
  };

  const handleEmployeeModalClose = () => {
    setEmployeeModalVisible(false);
    resumeScanning();
  };

  const handleEmployeeSubmitSuccess = () => {
    setEmployeeModalVisible(false);
    resumeScanning();
  };

  const handleFileNotInSystem = (code: string) => {
    setScannedCode(code);
    setRegisterModalVisible(true);
  };

  const handleRegisterModalClose = () => {
    setRegisterModalVisible(false);
    resumeScanning();
  };

  const handleRegisterSuccess = () => {
    setRegisterModalVisible(false);
    setEmployeeModalVisible(true);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.black }]}>
      <StatusBar barStyle="light-content" />

      {/* Fullscreen Camera Scanner */}
      <CameraView
        style={StyleSheet.absoluteFill}
        enableTorch={torchEnabled}
        barcodeScannerSettings={{
          barcodeTypes: ['qr', 'code128', 'code39', 'ean13', 'ean8', 'pdf417'],
        }}
        onBarcodeScanned={isScanningActive ? handleBarcodeScanned : undefined}
      />

      {/* Scanner Viewfinder Overlay */}
      <SafeAreaView style={styles.overlay}>
        {/* Top Controls */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={[styles.controlCircle, { backgroundColor: colors.overlayLight }]}
            onPress={() => navigation.goBack()}
            accessibilityLabel="Close scanner"
          >
            <X size={24} color={colors.white} />
          </TouchableOpacity>

          <Text style={[styles.scannerHeaderTitle, { color: colors.white }]}>Scan File Code</Text>

          <TouchableOpacity
            style={[styles.controlCircle, { backgroundColor: colors.overlayLight }]}
            onPress={() => setTorchEnabled((prev) => !prev)}
            accessibilityLabel="Toggle flashlight"
          >
            {torchEnabled ? (
              <FlashlightOff size={22} color={colors.warning} />
            ) : (
              <Flashlight size={22} color={colors.white} />
            )}
          </TouchableOpacity>
        </View>

        {/* Viewfinder Target Frame */}
        <View style={styles.viewfinderCenter}>
          <View style={styles.scanTargetBox}>
            <View style={[styles.corner, styles.cornerTL, { borderColor: colors.scannerFrame }]} />
            <View style={[styles.corner, styles.cornerTR, { borderColor: colors.scannerFrame }]} />
            <View style={[styles.corner, styles.cornerBL, { borderColor: colors.scannerFrame }]} />
            <View style={[styles.corner, styles.cornerBR, { borderColor: colors.scannerFrame }]} />
          </View>
          <Text
            style={[
              styles.instructionBanner,
              { color: colors.white, backgroundColor: colors.scannerOverlay },
            ]}
          >
            Align QR or Barcode within the frame
          </Text>
        </View>

        {/* Bottom Division Info */}
        <View style={styles.bottomBar}>
          <Text style={[styles.bottomUserText, { color: colors.headerSubtext }]}>
            Logged in as <Text style={[styles.bold, { color: colors.white }]}>{username}</Text> ({division})
          </Text>
        </View>
      </SafeAreaView>

      {/* Modal 1: Assign to Employee */}
      {scannedCode && (
        <EmployeeSelectModal
          visible={employeeModalVisible}
          code={scannedCode}
          username={username}
          division={division}
          employeeList={divisionEmployees}
          onClose={handleEmployeeModalClose}
          onSuccess={handleEmployeeSubmitSuccess}
          onFileNotInSystem={handleFileNotInSystem}
        />
      )}

      {/* Modal 2: Register New File Subject with OCR */}
      {scannedCode && (
        <RegisterFileModal
          visible={registerModalVisible}
          code={scannedCode}
          onClose={handleRegisterModalClose}
          onSuccess={handleRegisterSuccess}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  darkBackground: {
    flex: 1,
  },
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
  scannerHeaderTitle: {
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
    position: 'relative',
    backgroundColor: 'transparent',
  },
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 12,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 12,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 12,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 12,
  },
  instructionBanner: {
    fontFamily: fontFamilies.semiBold,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 24,
    fontSize: 14,
  },
  bottomBar: {
    alignItems: 'center',
    paddingBottom: 24,
  },
  bottomUserText: {
    fontFamily: fontFamilies.regular,
    fontSize: 13,
  },
  bold: {
    fontFamily: fontFamilies.bold,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  permissionTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: 20,
    marginTop: 16,
    marginBottom: 8,
  },
  permissionSubtitle: {
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  permissionButton: {
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
