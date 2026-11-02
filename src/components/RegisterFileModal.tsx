import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Camera, FilePlus, X } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { fontFamilies } from '../theme/typography';
import { CustomButton } from './common/CustomButton';
import { FileTrackerApi } from '../api/fileTrackerApi';
import { captureAndExtractText } from '../services/ocrService';

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

  const handleCaptureOcr = async () => {
    try {
      setIsOcrProcessing(true);
      const result = await captureAndExtractText();
      if (result && result.text) {
        setSubject(result.text);
      }
    } catch (error: any) {
      Alert.alert('OCR Failed', error.message || 'Could not scan document text.');
    } finally {
      setIsOcrProcessing(false);
    }
  };

  const handleSubmit = async () => {
    const trimmed = subject.trim();
    if (!trimmed) {
      Alert.alert('Required', 'Please enter or scan the full file subject.');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await FileTrackerApi.registerNewFile(code, trimmed);
      Alert.alert('File Registered', response || 'File registered successfully in WRD system.');
      onSuccess();
    } catch (error: any) {
      Alert.alert('Registration Error', error.message || 'Could not register file code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
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
              value={subject}
              onChangeText={setSubject}
              textAlignVertical="top"
            />

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
              style={styles.actionBtn}
              onPress={onClose}
            />
            <CustomButton
              title="Save & Proceed"
              loading={isSubmitting}
              style={styles.actionBtn}
              onPress={handleSubmit}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    width: '100%',
    shadowColor: '#000',
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
    height: 100,
    fontSize: 15,
    textAlignVertical: 'top',
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
  },
  actionBtn: {
    flex: 1,
    height: 48,
  },
});
