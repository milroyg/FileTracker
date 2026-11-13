import React, { useEffect, useReducer, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import type { ScannerScreenProps } from '../navigation/types';
import { useTheme } from '../theme/ThemeContext';
import { useDirectory } from '../hooks/useDirectory';
import { EmployeeSelectModal } from '../components/EmployeeSelectModal';
import { RegisterFileModal } from '../components/RegisterFileModal';
import { CustomDialog } from '../components/common/CustomDialog';
import { ScannerOverlay } from '../components/scanner/ScannerOverlay';
import { ManualCodeModal } from '../components/scanner/ManualCodeModal';
import { CameraPermissionView } from '../components/scanner/CameraPermissionView';
import {
  INITIAL_SCANNER_STATE,
  SCAN_COOLDOWN_MS,
  normalizeScannedCode,
  scannerReducer,
} from './scanner/scannerMachine';

const TORCH_AUTO_OFF_MS = 60_000;
const BARCODE_TYPES = ['qr', 'code128', 'code39', 'ean13', 'ean8', 'pdf417'] as const;

export function ScannerScreen({ route, navigation }: ScannerScreenProps) {
  const { colors } = useTheme();
  const { username, division } = route.params;
  const { directory } = useDirectory();
  const isFocused = useIsFocused();
  const [permission, requestPermission] = useCameraPermissions();
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [state, dispatch] = useReducer(scannerReducer, INITIAL_SCANNER_STATE);

  // The camera fires several events for one barcode before React re-renders;
  // only the first one per scanning session is handled.
  const scanHandledRef = useRef(false);
  useEffect(() => {
    if (state.phase === 'scanning') scanHandledRef.current = false;
  }, [state.phase]);

  // Short pause before the camera listens again, so the barcode that's still
  // in frame isn't re-read the instant a dialog closes.
  useEffect(() => {
    if (state.phase !== 'cooldown') return;
    const timer = setTimeout(() => dispatch({ type: 'RESUME' }), SCAN_COOLDOWN_MS);
    return () => clearTimeout(timer);
  }, [state.phase]);

  // Turn the torch off after a minute to save battery.
  useEffect(() => {
    if (!torchEnabled) return;
    const timer = setTimeout(() => setTorchEnabled(false), TORCH_AUTO_OFF_MS);
    return () => clearTimeout(timer);
  }, [torchEnabled]);

  const employees = directory.employeesByDivision[division] ?? directory.allEmployees;

  const handleBarcodeScanned = ({ data }: BarcodeScanningResult) => {
    if (scanHandledRef.current) return;
    scanHandledRef.current = true;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    dispatch({ type: 'CODE_DETECTED', code: normalizeScannedCode(data ?? '') });
  };

  const goBackToDashboard = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('Dashboard', { username, division });
  };

  const dismiss = () => dispatch({ type: 'DISMISS' });

  if (!permission) {
    return <View style={[styles.container, { backgroundColor: colors.black }]} />;
  }

  if (!permission.granted) {
    return (
      <CameraPermissionView
        onRequestPermission={requestPermission}
        onGoBack={() => navigation.goBack()}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.black }]}>
      {isFocused && (
        <CameraView
          style={StyleSheet.absoluteFill}
          enableTorch={torchEnabled}
          barcodeScannerSettings={{ barcodeTypes: [...BARCODE_TYPES] }}
          onBarcodeScanned={state.phase === 'scanning' ? handleBarcodeScanned : undefined}
        />
      )}

      <ScannerOverlay
        torchEnabled={torchEnabled}
        username={username}
        division={division}
        onClose={() => navigation.goBack()}
        onToggleTorch={() => setTorchEnabled((enabled) => !enabled)}
        onManualEntry={() => dispatch({ type: 'OPEN_MANUAL_ENTRY' })}
      />

      {state.phase === 'manualEntry' && (
        <ManualCodeModal
          onSubmit={(code) => dispatch({ type: 'CODE_DETECTED', code })}
          onCancel={dismiss}
        />
      )}

      <CustomDialog
        visible={state.phase === 'invalidCode'}
        title="Invalid Barcode"
        message="The scanned code is too short to be a valid file barcode."
        type="warning"
        onClose={dismiss}
      />

      <CustomDialog
        visible={state.phase === 'confirmExternal'}
        title="Non-WRD Barcode Detected"
        message={
          state.phase === 'confirmExternal'
            ? `Scanned code "${state.code.slice(0, 36)}${state.code.length > 36 ? '…' : ''}" looks like a web link or payment QR code. Proceed anyway?`
            : undefined
        }
        type="confirm"
        buttons={[
          { text: 'Cancel', style: 'cancel', onPress: dismiss },
          { text: 'Proceed', onPress: () => dispatch({ type: 'CONFIRM_EXTERNAL' }) },
        ]}
        onClose={dismiss}
      />

      {state.phase === 'assign' && (
        <EmployeeSelectModal
          code={state.code}
          username={username}
          division={division}
          employeeList={employees}
          onClose={dismiss}
          onSuccess={goBackToDashboard}
          onFileNotInSystem={() => dispatch({ type: 'NOT_REGISTERED' })}
        />
      )}

      {state.phase === 'register' && (
        <RegisterFileModal
          code={state.code}
          username={username}
          onClose={dismiss}
          onSuccess={goBackToDashboard}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
