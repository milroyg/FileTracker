import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { Camera, FilePlus, X } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { fontFamilies } from '../theme/typography';
import { CustomButton } from './common/CustomButton';
import { CustomDialog, DialogType } from './common/CustomDialog';
import { FileTrackerApi } from '../api/fileTrackerApi';
import { captureAndExtractText } from '../services/ocrService';
import { OfflineSyncService } from '../services/offlineSyncService';

interface RegisterFileModalProps {
  visible: boolean;
  code: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function RegisterFileModal({
  visible,
  code,
  onClose,
  onSuccess,
}: RegisterFileModalProps) {
  const { colors } = useTheme();
  const [subject, setSubject] = useState('');
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialog, setDialog] = useState<{
    visible: boolean;
    title: string;
    message?: string;
    type?: DialogType;
    onCloseAction?: () => void;
  }>({ visible: false, title: '' });

  // Reset subject input when modal opens for a new file code
  useEffect(() => {
    if (visible) {
      setSubject('');
    }
  }, [visible, code]);

  const handleCaptureOcr = async () => {
    try {
      setIsOcrProcessing(true);
      const result = await captureAndExtractText();
      if (!result) return; // User cancelled camera/cropper

      if (result.text) {
        setSubject(result.text.slice(0, 250));
      } else {
        setDialog({
          visible: true,
          title: 'Photo Captured',
          message:
            'Photo captured successfully. On-device text recognition requires an EAS Development or Standalone build. Please type the file subject manually into the box.',
          type: 'info',
        });
      }
    } catch (error: any) {
      setDialog({
        visible: true,
        title: 'OCR Scanner',
        message: error.message || 'Please type the file subject manually.',
        type: 'info',
      });
    } finally {
      setIsOcrProcessing(false);
    }
  };

  const handleSubmit = async () => {
    const trimmed = subject.trim();
    if (!trimmed) {
      setDialog({
        visible: true,
        title: 'Subject Required',
        message: 'Please enter or scan the full file subject.',
        type: 'warning',
      });
      return;
    }

    if (trimmed.length < 3) {
      setDialog({
        visible: true,
        title: 'Subject Too Short',
        message: 'File subject must be at least 3 characters long.',
        type: 'warning',
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // 1. Check network connectivity: Queue in offline outbox if disconnected
      const netState = await NetInfo.fetch();
      if (!netState.isConnected) {
        await OfflineSyncService.queueRegisterFile(code, '', trimmed);
        setDialog({
          visible: true,
          title: 'Offline Action Saved',
          message: 'Device is offline. File registration has been saved to the outbox and will automatically sync when reconnected.',
          type: 'info',
          onCloseAction: onSuccess,
        });
        return;
      }

      // 2. Dispatch online API request
      const response = await FileTrackerApi.registerNewFile(code, trimmed);
      setDialog({
        visible: true,
        title: 'File Registered',
        message: response || 'File registered successfully in WRD system.',
        type: 'success',
        onCloseAction: onSuccess,
      });
    } catch (error: any) {
      setDialog({
        visible: true,
        title: 'Registration Error',
        message: error.message || 'Could not register file code.',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={onClose}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoid}
        >
          <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.border,
                    borderWidth: 1,
                    shadowColor: colors.shadow,
                  },
                ]}
              >
                <View style={styles.header}>
                  <View style={styles.titleRow}>
                    <FilePlus size={22} color={colors.primary} />
                    <Text style={[styles.title, { color: colors.primary }]}>
                      This is a new file.
                    </Text>
                  </View>
                  <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                    <X size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  Code: <Text style={[styles.bold, { color: colors.text }]}>{code}</Text>
                </Text>
                <Text style={[styles.instruction, { color: colors.textSecondary }]}>
                  Please enter the full file subject or use the OCR camera to scan the header banner:
                </Text>

                {/* Multiline Input with OCR Camera Button */}
                <View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <TextInput
                    style={[
                      styles.textArea,
                      {
                        color: colors.text,
                        fontFamily: fontFamilies.regular,
                      },
                    ]}
                    placeholder="e.g. Construction of retaining wall at Division 11..."
                    placeholderTextColor={colors.textMuted}
                    multiline
                    numberOfLines={4}
                    maxLength={250}
                    autoCapitalize="sentences"
                    value={subject}
                    onChangeText={setSubject}
                    textAlignVertical="top"
                  />

                  <View style={styles.inputFooter}>
                    <Text style={[styles.charCounter, { color: colors.textMuted }]}>
                      {subject.length} / 250
                    </Text>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={[
                      styles.ocrButton,
                      { backgroundColor: colors.badgeBackground },
                    ]}
                    onPress={handleCaptureOcr}
                    disabled={isOcrProcessing}
                  >
                    {isOcrProcessing ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <View style={styles.ocrButtonContent}>
                        <Camera size={18} color={colors.primary} />
                        <Text style={[styles.ocrButtonText, { color: colors.primary }]}>
                          Scan Subject via OCR
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Actions */}
                <View style={styles.actionRow}>
                  <CustomButton
                    title="Cancel"
                    variant="outline"
                    style={styles.cancelBtn}
                    onPress={onClose}
                  />
                  <CustomButton
                    title="Save & Proceed"
                    loading={isSubmitting}
                    style={styles.submitBtn}
                    textStyle={styles.submitBtnText}
                    onPress={handleSubmit}
                  />
                </View>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Themed Feedback Dialog */}
      <CustomDialog
        visible={dialog.visible}
        title={dialog.title}
        message={dialog.message}
        type={dialog.type}
        onClose={() => {
          const action = dialog.onCloseAction;
          setDialog({ visible: false, title: '' });
          if (action) action();
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 460,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontFamily: fontFamilies.bold,
    fontSize: 18,
  },
  closeBtn: {
    padding: 4,
  },
  subtitle: {
    fontFamily: fontFamilies.medium,
    fontSize: 14,
    marginBottom: 6,
  },
  bold: {
    fontFamily: fontFamilies.bold,
  },
  instruction: {
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18,
  },
  inputWrapper: {
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  textArea: {
    height: 90,
    fontSize: 15,
    textAlignVertical: 'top',
  },
  inputFooter: {
    alignItems: 'flex-end',
    paddingVertical: 2,
  },
  charCounter: {
    fontFamily: fontFamilies.regular,
    fontSize: 11,
  },
  ocrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 8,
  },
  ocrButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ocrButtonText: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 13,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    paddingHorizontal: 8,
  },
  submitBtn: {
    flex: 1.6,
    height: 48,
    paddingHorizontal: 10,
  },
  submitBtnText: {
    fontSize: 15,
  },
});
