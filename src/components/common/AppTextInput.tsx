import React, { forwardRef } from 'react';
import { TextInput, type TextInputProps } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { fontFamilies } from '../../theme/typography';

/** The app's only TextInput: Inter font plus themed text/placeholder colours. */
export const AppTextInput = forwardRef<TextInput, TextInputProps>(function AppTextInput(
  { style, placeholderTextColor, ...rest },
  ref,
) {
  const { colors } = useTheme();
  return (
    <TextInput
      ref={ref}
      style={[{ fontFamily: fontFamilies.regular, color: colors.text }, style]}
      placeholderTextColor={placeholderTextColor ?? colors.textMuted}
      {...rest}
    />
  );
});
