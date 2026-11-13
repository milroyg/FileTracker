import React, { useState } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity } from 'react-native';
import { X } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { fontFamilies } from '../../theme/typography';
import { AppText } from '../common/AppText';
import { CustomButton } from '../common/CustomButton';
import { CustomInput } from '../common/CustomInput';

interface ManualCodeModalProps {
  onSubmit: (code: string) => void;
  onCancel: () => void;
}

/** Fallback when a barcode is damaged: type the code printed on the file. */
export function ManualCodeModal({ onSubmit, onCancel }: ManualCodeModalProps) {
  const { colors } = useTheme();
  const [code, setCode] = useState('');

  const submit = () => {
    const trimmed = code.trim();
    if (trimmed) onSubmit(trimmed);
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onCancel}>
      <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.border },
          ]}
        >
          <View style={styles.header}>
            <AppText style={styles.title}>Enter Barcode Manually</AppText>
            <TouchableOpacity
              onPress={onCancel}
              accessibilityRole="button"
              accessibilityLabel="Close"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <AppText style={[styles.subtitle, { color: colors.textSecondary }]}>
            Type the file barcode or tracking number printed on the physical file.
          </AppText>

          <CustomInput
            placeholder="e.g. 10024"
            accessibilityLabel="File code"
            value={code}
            onChangeText={setCode}
            onSubmitEditing={submit}
            returnKeyType="done"
            clearable
            onClear={() => setCode('')}
            autoFocus
          />

          <View style={styles.actions}>
            <CustomButton
              title="Cancel"
              variant="outline"
              onPress={onCancel}
              style={styles.actionLeft}
            />
            <CustomButton
              title="Continue"
              onPress={submit}
              disabled={!code.trim()}
              style={styles.actionRight}
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 480,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 6 },
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
  title: {
    fontFamily: fontFamilies.bold,
    fontSize: 18,
  },
  subtitle: {
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 8,
  },
  actionLeft: {
    flex: 1,
    marginRight: 8,
  },
  actionRight: {
    flex: 1,
    marginLeft: 8,
  },
});
