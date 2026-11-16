import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { fontFamilies } from '../../theme/typography';
import { AppText } from './AppText';

interface SelectFieldProps {
  label: string;
  value: string;
  placeholder: string;
  icon: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
}

/** Labelled dropdown-style field that opens a picker when pressed. */
export function SelectField({
  label,
  value,
  placeholder,
  icon,
  onPress,
  disabled = false,
}: SelectFieldProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.wrapper}>
      <AppText style={[styles.label, { color: colors.textSecondary }]}>{label}</AppText>
      <TouchableOpacity
        style={[
          styles.field,
          { backgroundColor: colors.inputBackground, borderColor: colors.border },
          disabled && styles.disabled,
        ]}
        activeOpacity={0.8}
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={value ? `${label}: ${value}` : `${label}: ${placeholder}`}
        accessibilityState={{ disabled }}
      >
        <View style={styles.left}>
          {icon}
          <AppText
            style={[styles.text, { color: value ? colors.text : colors.textMuted }]}
            numberOfLines={1}
          >
            {value || placeholder}
          </AppText>
        </View>
        <ChevronDown size={18} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  label: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 14,
    marginBottom: 6,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderRadius: 14,
    minHeight: 54,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  disabled: {
    opacity: 0.55,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    flex: 1,
    fontSize: 16,
  },
});
