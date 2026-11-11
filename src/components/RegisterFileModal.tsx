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
import { Camera, FilePlus, X, Sparkles, QrCode } from 'lucide-react-native';
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

/**
 * Sanitizes OCR and manual text before display and submission:
 * - Strips HTML tags (<...>) and angle brackets (< >) to prevent Stored XSS
 * - Strips dangerous delimiters (; used in barcodes, \ and backticks)
 * - Disarms spreadsheet formula injection triggers at the start (=, +, -, @)
 * - Normalizes newlines and whitespace
 * - Truncates to max length
 */
export function sanitizeSubjectText(rawText: string, maxLength: number = 250): string {
  if (!rawText) return '';
  return rawText
    // Strip HTML tags like <html>, <script>, <b>, etc.
    .replace(/<[^>]*>/g, '')
    // Strip angle brackets (<, >) and dangerous delimiters
    .replace(/[<>;\\`]/g, ' ')
    // Strip formula injection triggers if positioned at the beginning
    .replace(/^[=+\-@]+/, '')
    // Normalize newlines, tabs, and control characters
    .replace(/[\r\n]+/g, ' ')
    .replace(/[\t\u00A0]/g, ' ')
    .replace(/[\x00-\x1F\x7F]/g, '')
    // Collapse consecutive spaces and trim
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, maxLength);
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
  const [isOcrExtracted, setIsOcrExtracted] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
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
      setIsOcrExtracted(false);
      setIsInputFocused(false);
    }
  }, [visible, code]);

  const handleCaptureOcr = async () => {
    try {
      setIsOcrProcessing(true);
      const result = await captureAndExtractText();
      if (!result) return; // User cancelled camera/cropper

      if (result.text) {
        const cleaned = sanitizeSubjectText(result.text, 250);
        if (!cleaned || !/[a-zA-Z0-9]/.test(cleaned)) {
          setDialog({
            visible: true,
            title: 'Unclear Text',
            message:
              'Could not recognize readable text from the captured image. Please ensure the file title is clearly lit, or type the subject manually.',
            type: 'warning',
          });
          return;
        }

        setSubject(cleaned);
        setIsOcrExtracted(true);
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
    // 1. HTML / Script injection validation (OWASP Stored XSS defense)
    const hasHtmlTags = /<[^>]*>|[<>]|javascript:|onerror=|onload=/i.test(subject);
    if (hasHtmlTags) {
      setDialog({
        visible: true,
        title: 'HTML Not Permitted',
        message:
          'HTML tags, script elements, and angle brackets (< >) are not allowed in file subjects. Please enter plain text only.',
        type: 'warning',
      });
      return;
    }

    const cleaned = sanitizeSubjectText(subject, 250);

    // 2. Empty / Blank Validation
    if (!cleaned) {
      setDialog({
        visible: true,
        title: 'Subject Required',
        message: 'Please enter or scan the full file subject.',
        type: 'warning',
      });
      return;
    }

    // 2. Minimum Length Validation
    if (cleaned.length < 3) {
      setDialog({
        visible: true,
        title: 'Subject Too Short',
        message: 'File subject must be at least 3 characters long.',
        type: 'warning',
      });
      return;
    }

    // 3. Meaningful Content Check (Must contain alphanumeric characters)
    if (!/[a-zA-Z0-9]/.test(cleaned)) {
      setDialog({
        visible: true,
        title: 'Invalid Subject',
        message: 'File subject must contain valid letters or numbers.',
        type: 'warning',
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // 4. Network Connectivity Check: Queue in offline outbox if disconnected
      const netState = await NetInfo.fetch();
      if (!netState.isConnected) {
        await OfflineSyncService.queueRegisterFile(code, '', cleaned);
        setDialog({
          visible: true,
          title: 'Offline Action Saved',
          message:
            'Device is offline. File registration has been saved to the outbox and will automatically sync when reconnected.',
          type: 'info',
          onCloseAction: onSuccess,
        });
        return;
      }

      // 5. Dispatch online API request
      const response = await FileTrackerApi.registerNewFile(code, cleaned);
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
                    <Text style={[styles.title, { color: colors.primary }]}>
                      This is a new file.
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={onClose}
                    style={styles.closeBtn}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <X size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {/* Code Badge */}
                <View style={[styles.codeBadge, { backgroundColor: colors.badgeBackground }]}>
                  <QrCode size={15} color={colors.primary} />
                  <Text style={[styles.codeBadgeText, { color: colors.primary }]}>
                    File Code: <Text style={styles.bold}>{code}</Text>
                  </Text>
                </View>

                {/* Section Header: Label & OCR Action */}
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                    File Subject / Title:
                  </Text>
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
                        <Text style={[styles.ocrToolbarText, { color: colors.primary }]}>
                          Scan with OCR
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                {/* OCR Success Notice */}
                {isOcrExtracted && (
                  <View style={[styles.ocrNotice, { backgroundColor: colors.badgeBackground }]}>
                    <Sparkles size={14} color={colors.primary} />
                    <Text style={[styles.ocrNoticeText, { color: colors.primary }]} numberOfLines={1}>
                      Text extracted via OCR. Please verify before saving.
                    </Text>
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
                  <Text style={[styles.helperText, { color: colors.textMuted }]}>
                    Min 3 — max 250 characters
                  </Text>
                  <Text
                    style={[
                      styles.charCounter,
                      {
                        color: subject.length >= 240 ? colors.warning : colors.textMuted,
                      },
                    ]}
                  >
                    {subject.length} / 250
                  </Text>
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
