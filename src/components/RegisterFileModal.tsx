import React, { useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Camera, FilePlus, X, Sparkles, QrCode } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { fontFamilies } from '../theme/typography';
import { AppText } from './common/AppText';
import { AppTextInput } from './common/AppTextInput';
import { CustomButton } from './common/CustomButton';
import { CustomDialog } from './common/CustomDialog';
import { useDialog } from '../hooks/useDialog';
import { useRegisterFileMutation } from '../hooks/useFileTracker';
import { toApiError } from '../api/errors';
import { captureAndExtractText } from '../services/ocrService';
import { OutboxService } from '../services/outboxService';
import { fetchIsOnline } from '../utils/network';
import {
  sanitizeSubjectText,
  validateSubject,
  SUBJECT_MAX_LENGTH,
} from '../utils/subjectValidation';

interface RegisterFileModalProps {
  code: string;
  username: string;
  onClose: () => void;
  /** Called once the file is registered (or queued offline) and the user dismissed the confirmation. */
  onSuccess: () => void;
}

/**
 * "This is a new file" — captures the subject of an unregistered file code
 * (typed, or read from a photo via OCR) and registers it.
 * Mount it only while it should be shown: each mount starts with a clean form.
 */
export function RegisterFileModal({ code, username, onClose, onSuccess }: RegisterFileModalProps) {
  const { colors } = useTheme();
  const { showDialog, dialogProps } = useDialog();
  const registerMutation = useRegisterFileMutation();
  const [subject, setSubject] = useState('');
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [isOcrExtracted, setIsOcrExtracted] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isQueueing, setIsQueueing] = useState(false);
  const isSubmitting = registerMutation.isPending || isQueueing;

  const handleCaptureOcr = async () => {
    try {
      setIsOcrProcessing(true);
      const result = await captureAndExtractText();
      if (!result) return; // user cancelled the camera / cropper

      if (!result.text) {
        showDialog({
          title: 'Text Not Recognized',
          message:
            'On-device text recognition is not available in this build. Please type the file subject manually.',
          type: 'info',
        });
        return;
      }

      const cleaned = sanitizeSubjectText(result.text);
      if (!/[a-zA-Z0-9]/.test(cleaned)) {
        showDialog({
          title: 'Unclear Text',
          message:
            'Could not recognize readable text from the captured image. Please ensure the file title is clearly lit, or type the subject manually.',
          type: 'warning',
        });
        return;
      }
      setSubject(cleaned);
      setIsOcrExtracted(true);
    } catch (error) {
      showDialog({
        title: 'OCR Scanner',
        message: error instanceof Error ? error.message : 'Please type the file subject manually.',
        type: 'info',
      });
    } finally {
      setIsOcrProcessing(false);
    }
  };

  /** Saves to the outbox first; only then tells the user it was saved. */
  const queueOffline = async (filename: string, reason: string) => {
    setIsQueueing(true);
    try {
      await OutboxService.enqueueRegisterFile(code, username, filename);
      showDialog({
        title: 'Saved Offline',
        message: `${reason} The registration was saved and will be sent automatically when the connection returns.`,
        type: 'info',
        onDismiss: onSuccess,
      });
    } catch {
      showDialog({
        title: 'Could Not Save',
        message: 'The registration could not be saved on this device. Please try again.',
        type: 'error',
      });
    } finally {
      setIsQueueing(false);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    const validation = validateSubject(subject);
    if (!validation.ok) {
      showDialog({ title: validation.title, message: validation.message, type: 'warning' });
      return;
    }

    if (!(await fetchIsOnline())) {
      await queueOffline(validation.value, 'This device is offline.');
      return;
    }

    try {
      const response = await registerMutation.mutateAsync({ code, filename: validation.value });
      showDialog({
        title: 'File Registered',
        message: response || 'File registered successfully in the WRD system.',
        type: 'success',
        onDismiss: onSuccess,
      });
    } catch (error) {
      const apiError = toApiError(error);
      if (apiError.isNetworkError) {
        await queueOffline(validation.value, 'The WRD server could not be reached.');
        return;
      }
      showDialog({ title: 'Registration Error', message: apiError.message, type: 'error' });
    }
  };

  return (
    <>
      <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
                {/* Header */}
                <View style={styles.header}>
                  <View style={styles.titleRow}>
                    <FilePlus size={22} color={colors.primary} />
                    <AppText style={[styles.title, { color: colors.primary }]}>
                      This is a new file.
                    </AppText>
                  </View>
                  <TouchableOpacity
                    onPress={onClose}
                    style={styles.closeBtn}
                    accessibilityRole="button"
                    accessibilityLabel="Close"
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <X size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {/* Code Badge */}
                <View style={[styles.codeBadge, { backgroundColor: colors.badgeBackground }]}>
                  <QrCode size={15} color={colors.primary} />
                  <AppText style={[styles.codeBadgeText, { color: colors.primary }]}>
                    File Code: <AppText style={styles.bold}>{code}</AppText>
                  </AppText>
                </View>

                {/* Section Header: Label & OCR Action */}
                <View style={styles.sectionHeader}>
                  <AppText style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                    File Subject / Title:
                  </AppText>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={[
                      styles.ocrToolbarButton,
                      {
                        backgroundColor: colors.badgeBackground,
                        borderColor: colors.primary,
                      },
                    ]}
                    onPress={handleCaptureOcr}
                    disabled={isOcrProcessing}
                  >
                    {isOcrProcessing ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <>
                        <Camera size={14} color={colors.primary} />
                        <AppText style={[styles.ocrToolbarText, { color: colors.primary }]}>
                          Scan with OCR
                        </AppText>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                {/* OCR Success Notice */}
                {isOcrExtracted && (
                  <View style={[styles.ocrNotice, { backgroundColor: colors.badgeBackground }]}>
                    <Sparkles size={14} color={colors.primary} />
                    <AppText
                      style={[styles.ocrNoticeText, { color: colors.primary }]}
                      numberOfLines={1}
                    >
                      Text extracted via OCR. Please verify before saving.
                    </AppText>
                  </View>
                )}

                {/* Dedicated Responsive Text Box */}
                <View
                  style={[
                    styles.textBoxContainer,
                    {
                      backgroundColor: colors.inputBackground,
                      borderColor: isInputFocused ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <AppTextInput
                    style={styles.textArea}
                    placeholder="e.g. Construction of retaining wall at Division 11..."
                    accessibilityLabel="File subject"
                    multiline
                    numberOfLines={4}
                    maxLength={SUBJECT_MAX_LENGTH}
                    autoCapitalize="sentences"
                    value={subject}
                    onChangeText={(val) => {
                      setSubject(val);
                      if (isOcrExtracted) setIsOcrExtracted(false);
                    }}
                    onFocus={() => setIsInputFocused(true)}
                    onBlur={() => setIsInputFocused(false)}
                    textAlignVertical="top"
                  />

                  {subject.length > 0 && (
                    <TouchableOpacity
                      style={styles.clearBtn}
                      onPress={() => {
                        setSubject('');
                        setIsOcrExtracted(false);
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityLabel="Clear subject input"
                    >
                      <X size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Footer outside the box: Helper & Counter */}
                <View style={styles.footerRow}>
                  <AppText style={[styles.helperText, { color: colors.textMuted }]}>
                    Min 3 — max 250 characters
                  </AppText>
                  <AppText
                    style={[
                      styles.charCounter,
                      {
                        color:
                          subject.length >= SUBJECT_MAX_LENGTH - 10
                            ? colors.warning
                            : colors.textMuted,
                      },
                    ]}
                  >
                    {subject.length} / {SUBJECT_MAX_LENGTH}
                  </AppText>
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
      <CustomDialog {...dialogProps} />
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
    marginBottom: 10,
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
  codeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 6,
    marginBottom: 14,
  },
  codeBadgeText: {
    fontFamily: fontFamilies.medium,
    fontSize: 13,
  },
  bold: {
    fontFamily: fontFamilies.bold,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionLabel: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 13,
  },
  ocrToolbarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  ocrToolbarText: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 12,
  },
  ocrNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 8,
  },
  ocrNoticeText: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    flex: 1,
  },
  textBoxContainer: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    minHeight: 110,
    position: 'relative',
  },
  textArea: {
    fontSize: 15,
    lineHeight: 22,
    textAlignVertical: 'top',
    minHeight: 90,
    padding: 0,
    paddingRight: 24,
  },
  clearBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 4,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 16,
    paddingHorizontal: 2,
  },
  helperText: {
    fontFamily: fontFamilies.regular,
    fontSize: 11,
  },
  charCounter: {
    fontFamily: fontFamilies.medium,
    fontSize: 11,
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
