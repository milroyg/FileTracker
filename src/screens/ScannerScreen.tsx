import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { X, Flashlight, FlashlightOff, AlertCircle, Keyboard } from 'lucide-react-native';
import { ScannerScreenProps } from '../navigation/types';
import { useTheme } from '../theme/ThemeContext';
import { fontFamilies } from '../theme/typography';
import { useDirectory } from '../hooks/useDirectory';
import { EmployeeSelectModal } from '../components/EmployeeSelectModal';
import { RegisterFileModal } from '../components/RegisterFileModal';
import { CustomButton } from '../components/common/CustomButton';
import { CustomInput } from '../components/common/CustomInput';
import { CustomDialog, DialogButton } from '../components/common/CustomDialog';
import { FocusAwareStatusBar } from '../components/common/FocusAwareStatusBar';

export function ScannerScreen({ route, navigation }: ScannerScreenProps) {
  const { colors } = useTheme();
  const { username, division } = route.params;
  const { data: directory } = useDirectory();
  const [isFocused, setIsFocused] = useState(true);

  useEffect(() => {
    const unsubscribeFocus = navigation.addListener('focus', () => setIsFocused(true));
    const unsubscribeBlur = navigation.addListener('blur', () => setIsFocused(false));
    return () => {
      unsubscribeFocus();
      unsubscribeBlur();
    };
  }, [navigation]);

  const [permission, requestPermission] = useCameraPermissions();
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [isScanningActive, setIsScanningActive] = useState(true);
  const [scannedCode, setScannedCode] = useState<string | null>(null);

  // Manual code entry modal
  const [manualModalVisible, setManualModalVisible] = useState(false);
  const [manualCode, setManualCode] = useState('');

  // Dialog state
  const [dialog, setDialog] = useState<{
    visible: boolean;
    title: string;
    message?: string;
    type?: 'info' | 'success' | 'error' | 'warning' | 'confirm';
    buttons?: DialogButton[];
  }>({ visible: false, title: '' });

  // Modals state
  const [employeeModalVisible, setEmployeeModalVisible] = useState(false);
  const [registerModalVisible, setRegisterModalVisible] = useState(false);

  // Lock to avoid multi-firing
  const scanLockRef = useRef(false);

  // Refs tracking live visibility state to prevent timer race conditions
  const employeeModalRef = useRef(employeeModalVisible);
  const registerModalRef = useRef(registerModalVisible);
  const manualModalRef = useRef(manualModalVisible);
  const dialogRef = useRef(dialog.visible);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    employeeModalRef.current = employeeModalVisible;
  }, [employeeModalVisible]);

  useEffect(() => {
    registerModalRef.current = registerModalVisible;
  }, [registerModalVisible]);

  useEffect(() => {
    manualModalRef.current = manualModalVisible;
  }, [manualModalVisible]);

  useEffect(() => {
    dialogRef.current = dialog.visible;
  }, [dialog.visible]);

  const clearResumeTimer = () => {
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearResumeTimer();
    };
  }, []);

  // Auto-off torch after 60 seconds to conserve battery
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (torchEnabled) {
      timer = setTimeout(() => {
        setTorchEnabled(false);
      }, 60000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [torchEnabled]);

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

  const processCode = (rawCode: string) => {
    clearResumeTimer();
    const clean = rawCode.trim();
    if (!clean) {
      resumeScanning();
      return;
    }

    if (clean.length < 2) {
      setDialog({
        visible: true,
        title: 'Invalid Barcode',
        message: 'The scanned code is too short to be a valid file barcode.',
        type: 'warning',
        buttons: [{ text: 'OK', onPress: () => resumeScanning() }],
      });
      return;
    }

    // Check if code resembles an external URL or payment QR
    if (/^(https?:\/\/|upi:\/\/|mailto:|tel:)/i.test(clean)) {
      setDialog({
        visible: true,
        title: 'Non-WRD Barcode Detected',
        message: `Scanned code "${clean.slice(0, 36)}..." appears to be an external link or payment QR code. Proceed anyway?`,
        type: 'confirm',
        buttons: [
          { text: 'Cancel', style: 'cancel', onPress: () => resumeScanning() },
          {
            text: 'Proceed',
            onPress: () => {
              clearResumeTimer();
              setScannedCode(clean);
              setEmployeeModalVisible(true);
            },
          },
        ],
      });
      return;
    }

    setScannedCode(clean);
    setEmployeeModalVisible(true);
  };

  const handleBarcodeScanned = (result: BarcodeScanningResult) => {
    if (
      !isScanningActive ||
      scanLockRef.current ||
      employeeModalRef.current ||
      registerModalRef.current ||
      manualModalRef.current ||
      dialogRef.current
    ) {
      return;
    }
    clearResumeTimer();
    scanLockRef.current = true;
    setIsScanningActive(false);

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Haptics fallback
    }

    const rawData = result.data || '';
    const cleanCode = rawData.split(';')[0]?.trim() || rawData.trim();
    processCode(cleanCode);
  };

  // 1.5-second cooldown timer to prevent duplicate scan triggers
  const resumeScanning = () => {
    clearResumeTimer();
    resumeTimerRef.current = setTimeout(() => {
      // Guard: Never clear scannedCode or resume scanning if any modal or dialog is still visible
      if (
        employeeModalRef.current ||
        registerModalRef.current ||
        manualModalRef.current ||
        dialogRef.current
      ) {
        return;
      }
      scanLockRef.current = false;
      setIsScanningActive(true);
      setScannedCode(null);
    }, 1500);
  };

  const navigateBackToDashboard = () => {
    clearResumeTimer();
    setEmployeeModalVisible(false);
    setRegisterModalVisible(false);
    setManualModalVisible(false);
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Dashboard', { username, division });
    }
  };

  const handleEmployeeModalClose = () => {
    setEmployeeModalVisible(false);
    resumeScanning();
  };

  const handleEmployeeSubmitSuccess = () => {
    navigateBackToDashboard();
  };

  const handleFileNotInSystem = (code: string) => {
    clearResumeTimer();
    scanLockRef.current = true;
    setIsScanningActive(false);
    setScannedCode(code);
    // Explicitly hide employee modal so only the registration modal is active (prevents multi-modal overlap on Android)
    setEmployeeModalVisible(false);
    setRegisterModalVisible(true);
  };

  const handleRegisterModalClose = () => {
    setRegisterModalVisible(false);
    resumeScanning();
  };

  const handleRegisterSuccess = () => {
    navigateBackToDashboard();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.black }]}>
      <FocusAwareStatusBar
        navigation={navigation}
        barStyle="light-content"
        backgroundColor={colors.black}
        translucent={Platform.OS === 'android'}
      />

      {/* Fullscreen Camera Scanner */}
      {isFocused && (
        <CameraView
          style={styles.camera}
          enableTorch={torchEnabled}
          barcodeScannerSettings={{
            barcodeTypes: ['qr', 'code128', 'code39', 'ean13', 'ean8', 'pdf417'],
          }}
          onBarcodeScanned={
            isScanningActive &&
            !employeeModalVisible &&
            !registerModalVisible &&
            !manualModalVisible &&
            !dialog.visible
              ? handleBarcodeScanned
              : undefined
          }
        />
      )}

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

        {/* Bottom Division Info & Manual Entry Button */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[
              styles.manualEntryBtn,
              { backgroundColor: colors.overlayLight, borderColor: colors.headerButtonBackground },
            ]}
            activeOpacity={0.8}
            onPress={() => {
              scanLockRef.current = true;
              setIsScanningActive(false);
              setManualModalVisible(true);
            }}
          >
            <Keyboard size={18} color={colors.white} style={{ marginRight: 8 }} />
            <Text style={[styles.manualEntryText, { color: colors.white }]}>Enter Code Manually</Text>
          </TouchableOpacity>

          <Text style={[styles.bottomUserText, { color: colors.headerSubtext }]}>
            Logged in as <Text style={[styles.bold, { color: colors.white }]}>{username}</Text> ({division})
          </Text>
        </View>
      </SafeAreaView>

      {/* Manual Code Entry Modal */}
      <Modal
        visible={manualModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setManualModalVisible(false);
          resumeScanning();
        }}
      >
        <View style={[styles.modalBackdrop, { backgroundColor: colors.overlay }]}>
          <View
            style={[
              styles.manualModalCard,
              { backgroundColor: colors.cardBackground, borderColor: colors.border },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.manualModalTitle, { color: colors.text }]}>Enter Barcode Manually</Text>
              <TouchableOpacity
                onPress={() => {
                  setManualModalVisible(false);
                  resumeScanning();
                }}
              >
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.manualModalSubtitle, { color: colors.textSecondary }]}>
              Type the file barcode or tracking number printed on the physical file.
            </Text>

            <CustomInput
              placeholder="e.g. 10024"
              value={manualCode}
              onChangeText={setManualCode}
              clearable
              onClear={() => setManualCode('')}
              autoFocus
            />

            <View style={styles.manualModalActions}>
              <CustomButton
                title="Cancel"
                variant="outline"
                onPress={() => {
                  setManualModalVisible(false);
                  resumeScanning();
                }}
                style={{ flex: 1, marginRight: 8 }}
              />
              <CustomButton
                title="Continue"
                onPress={() => {
                  const code = manualCode.trim();
                  if (!code) return;
                  setManualModalVisible(false);
                  setManualCode('');
                  processCode(code);
                }}
                style={{ flex: 1, marginLeft: 8 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Status & Validation Dialog */}
      <CustomDialog
        visible={dialog.visible}
        title={dialog.title}
        message={dialog.message}
        type={dialog.type || 'info'}
        buttons={dialog.buttons || [{ text: 'OK', onPress: () => setDialog({ visible: false, title: '' }) }]}
        onClose={() => {
          setDialog({ visible: false, title: '' });
          resumeScanning();
        }}
      />

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
  camera: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
  manualEntryText: {
    fontFamily: fontFamilies.bold,
    fontSize: 14,
  },
  bottomUserText: {
    fontFamily: fontFamilies.regular,
    fontSize: 13,
  },
  bold: {
    fontFamily: fontFamilies.bold,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  manualModalCard: {
    width: '100%',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  manualModalTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: 18,
  },
  manualModalSubtitle: {
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 18,
  },
  manualModalActions: {
    flexDirection: 'row',
    marginTop: 8,
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
