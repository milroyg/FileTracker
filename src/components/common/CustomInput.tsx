import React from 'react';
import { View, StyleSheet, TouchableOpacity, type TextInputProps } from 'react-native';
import { X } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { fontFamilies } from '../../theme/typography';
import { AppText } from './AppText';
import { AppTextInput } from './AppTextInput';

interface CustomInputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  rightIconAccessibilityLabel?: string;
  clearable?: boolean;
  onClear?: () => void;
}

export function CustomInput({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  rightIconAccessibilityLabel,
  clearable,
  onClear,
  style,
  ...rest
}: CustomInputProps) {
  const { colors } = useTheme();
  const showClear = !!onClear && clearable && String(rest.value ?? '').length > 0;

  return (
    <View style={styles.wrapper}>
      {label && <AppText style={[styles.label, { color: colors.textSecondary }]}>{label}</AppText>}
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.inputBackground,
            borderColor: error ? colors.error : colors.border,
          },
        ]}
      >
        {leftIcon && <View style={styles.iconContainer}>{leftIcon}</View>}
        <AppTextInput
          style={[styles.input, style]}
          autoCapitalize="none"
          accessibilityLabel={rest.accessibilityLabel ?? label ?? rest.placeholder}
          {...rest}
        />
        {showClear && (
          <TouchableOpacity
            activeOpacity={0.6}
            onPress={onClear}
            style={styles.clearButton}
            accessibilityRole="button"
            accessibilityLabel="Clear text"
          >
            <X size={16} color={colors.textMuted} />
          </TouchableOpacity>
        )}
        {rightIcon &&
          (onRightIconPress ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onRightIconPress}
              style={styles.iconContainer}
              accessibilityRole="button"
              accessibilityLabel={rightIconAccessibilityLabel}
            >
              {rightIcon}
            </TouchableOpacity>
          ) : (
            <View style={styles.iconContainer}>{rightIcon}</View>
          ))}
      </View>
      {error && <AppText style={[styles.errorText, { color: colors.error }]}>{error}</AppText>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 14,
    marginBottom: 6,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 54,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  clearButton: {
    padding: 6,
    marginRight: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});
